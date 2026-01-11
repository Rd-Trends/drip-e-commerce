import { Coupon, Order, User } from '@/payload-types'
import { BasePayload, PayloadRequest } from 'payload'
import Paystack from '@paystack/paystack-sdk'
import { PaystackTransactionMetadata } from '../shared/types'
import { render } from '@react-email/components'
import { OrderConfirmationEmail } from '@/lib/emails/order-confirmation'
import { USER_ROLES } from '@/lib/constants'
import { AdminOrderNotificationEmail } from '@/lib/emails/admin-order-notification'
import { Resend } from 'resend'

type VerifyPaymentParams = {
  reference: string
  req: PayloadRequest
}

/**
 * Verifies payment with Paystack and retrieves transaction
 */
export async function verifyPayment({ reference, req }: VerifyPaymentParams) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  const payload = req.payload

  if (!secretKey) {
    throw new Error('Paystack secret key is not configured.')
  }

  // Find existing transaction
  const transactionsResults = await payload.find({
    collection: 'transactions',
    where: {
      'paystack.reference': {
        equals: reference,
      },
    },
  })

  const transaction = transactionsResults.docs[0]

  if (!transaction) {
    throw new Error('No transaction found for the provided payment reference')
  }

  // Verify payment with Paystack
  const paystack = new Paystack(secretKey)
  const paymentIntent = await paystack.transaction.verify({ reference })
  const metadata = paymentIntent.data?.metadata as PaystackTransactionMetadata | undefined

  if (!metadata) {
    throw new Error('Payment metadata not found')
  }

  const { cartId, cartItemsSnapshot } = metadata

  if (!cartId) {
    throw new Error('No cart ID found in payment metadata')
  }

  if (!cartItemsSnapshot || !Array.isArray(cartItemsSnapshot)) {
    throw new Error('Cart items snapshot not found or invalid in the PaymentIntent metadata')
  }

  return {
    transaction,
    paymentIntent,
    metadata,
  }
}

type UpdateCartAndTransactionParams = {
  cartId: number
  transactionId: number
  orderId: string
  req: PayloadRequest
}

/**
 * Updates cart and transaction after order creation
 */
export async function updateCartAndTransaction({
  cartId,
  transactionId,
  orderId,
  req,
}: UpdateCartAndTransactionParams): Promise<void> {
  const payload = req.payload
  const timestamp = new Date().toISOString()

  // Mark cart as purchased
  await payload.update({
    id: cartId,
    collection: 'carts',
    data: {
      purchasedAt: timestamp,
    },
  })

  // Update transaction with order ID and mark as succeeded
  await payload.update({
    id: transactionId,
    collection: 'transactions',
    data: {
      order: orderId,
      status: 'succeeded',
    },
  })
}

type UpdateInventoryParams = {
  transactionId: number | string
  req: PayloadRequest
}

/**
 * Updates product/variant inventory after successful order
 */
export async function updateInventory({
  transactionId,
  req,
}: UpdateInventoryParams): Promise<void> {
  const payload = req.payload

  const transaction = await payload.findByID({
    id: transactionId,
    collection: 'transactions',
    depth: 0,
    select: {
      id: true,
      items: true,
    },
  })

  if (!transaction || !Array.isArray(transaction.items) || transaction.items.length === 0) {
    return
  }

  for (const item of transaction.items) {
    if (item.variant) {
      const id = typeof item.variant === 'object' ? item.variant.id : item.variant

      await payload.db.updateOne({
        id,
        collection: 'variants',
        data: {
          inventory: {
            $inc: item.quantity * -1,
          },
        },
      })
    } else if (item.product) {
      const id = typeof item.product === 'object' ? item.product.id : item.product

      await payload.db.updateOne({
        id,
        collection: 'products',
        data: {
          inventory: {
            $inc: item.quantity * -1,
          },
        },
      })
    }
  }
}

/**
 * Tracks coupon usage after successful order
 */
export async function trackCouponUsage(
  payload: BasePayload,
  couponId: number,
  userId?: number | null,
): Promise<void> {
  try {
    const coupon = await payload.findByID({
      collection: 'coupons',
      id: couponId,
    })

    if (!coupon) return

    // Increment usage count
    const updateData: Partial<Coupon> = {
      usageCount: (coupon.usageCount || 0) + 1,
    }

    // Add user to usedBy list if userId provided
    if (userId) {
      const usedBy = coupon.usedBy || []
      const usedByIds = usedBy.map((user: User | number) =>
        typeof user === 'object' ? user.id : user,
      )

      // Add user if not already in the list (for tracking multiple uses)
      updateData.usedBy = [...usedByIds, userId]
    }

    await payload.update({
      collection: 'coupons',
      id: couponId,
      data: updateData,
    })
  } catch (error) {
    payload.logger.error(error, 'Error tracking coupon usage')
  }
}

export async function sendOrderConfirmationEmail(order: Order, payload: BasePayload) {
  try {
    const orderManagers = await payload.find({
      collection: 'users',
      where: {
        roles: {
          in: [USER_ROLES.ADMIN, USER_ROLES.ORDER_MANAGER],
        },
      },
      //   sort by date (olderst first)
      sort: 'createdAt',
      select: {
        email: true,
        name: true,
        roles: true,
      },
      limit: 0, // Fetch all matching users
    })

    const customerEmailHtml = await render(OrderConfirmationEmail({ order }))
    const adminEmailHtml = await render(AdminOrderNotificationEmail({ order }))

    const customerEmail = order.customer
      ? typeof order.customer === 'object'
        ? order.customer.email
        : ''
      : order.customerEmail

    const resend = new Resend(process.env.RESEND_API_KEY || '')
    const emailFromAddress = process.env.EMAIL_FROM_ADDRESS || 'drip-fashion@drip.ng'
    const emailFromName = process.env.EMAIL_FROM_NAME || 'Drip Fashion'

    // Send batch emails to customer and admins
    // We are using batch send to optimize email sending and to ensure we don't hit rate limits (max 2 emails/sec)
    await resend.batch.send([
      ...(!!customerEmail
        ? [
            {
              to: customerEmail,
              from: `${emailFromName} <${emailFromAddress}>`,
              subject: `Order Confirmation - #${order.id} - Drip Fashion`,
              html: customerEmailHtml,
            },
          ]
        : []),
      ...orderManagers.docs.map((user) => ({
        to: user.email,
        from: `${emailFromName} <${emailFromAddress}>`,
        subject: `New Order #${order.id} - ${order.grandTotal} - Drip Fashion`,
        html: adminEmailHtml,
      })),
    ])

    payload.logger.info(`Order confirmation email sent to ${customerEmail} for order #${order.id}`)
    payload.logger.info(
      `Admin order notification emails sent for order #${order.id} to ${orderManagers.totalDocs} users`,
    )
  } catch (error) {
    payload.logger.error(error, `Error sending order confirmation email for order #${order.id}`)
  }
}
