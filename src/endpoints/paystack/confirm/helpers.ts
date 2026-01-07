import { Coupon, Order, User } from '@/payload-types'
import { BasePayload, PayloadRequest } from 'payload'
import Paystack from '@paystack/paystack-sdk'
import { PaystackTransactionMetadata } from '../shared/types'
import { render } from '@react-email/components'
import { OrderConfirmationEmail } from '@/lib/emails/order-confirmation'

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
  transactionId: number | string
  orderId: number
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
    const emailHtml = await render(OrderConfirmationEmail({ order }))

    await payload.sendEmail({
      to: order.customerEmail,
      subject: `Order Confirmation - #${order.id} - Drip Fashion`,
      html: emailHtml,
    })

    const email = order.customer
      ? typeof order.customer === 'object'
        ? order.customer.email
        : ''
      : order.customerEmail

    payload.logger.info(`Order confirmation email sent to ${email} for order #${order.id}`)
  } catch (error) {
    payload.logger.error(error, `Error sending order confirmation email for order #${order.id}`)
  }
}

export async function sendAdminOrderNotifications(order: Order, payload: BasePayload) {
  try {
    const { USER_ROLES } = await import('@/lib/constants')
    const { AdminOrderNotificationEmail } = await import('@/lib/emails/admin-order-notification')
    const { formatCurrency } = await import('@/utils/format-currency')

    // Query all users with admin or order-manager roles
    const staffUsers = await payload.find({
      collection: 'users',
      where: {
        roles: {
          in: [USER_ROLES.ADMIN, USER_ROLES.ORDER_MANAGER],
        },
      },
      select: {
        email: true,
        name: true,
        roles: true,
      },
      limit: 0, // Fetch all matching users
    })

    if (!staffUsers.docs || staffUsers.docs.length === 0) {
      payload.logger.warn('No admin or order manager users found to send notifications')
      return
    }

    payload.logger.info(
      `Found ${staffUsers.docs.length} staff members to notify for order #${order.id}`,
    )

    // Render the email template
    const emailHtml = await render(AdminOrderNotificationEmail({ order }))

    // Send emails in batches of 2 to respect rate limit (2 req/sec on Resend)
    const BATCH_SIZE = 2
    for (let i = 0; i < staffUsers.docs.length; i += BATCH_SIZE) {
      const batch = staffUsers.docs.slice(i, i + BATCH_SIZE)

      const emailPromises = batch.map(async (user) => {
        try {
          await payload.sendEmail({
            to: user.email,
            subject: `New Order #${order.id} - ${formatCurrency(order.grandTotal)} - Drip Fashion`,
            html: emailHtml,
          })

          payload.logger.info(
            `Admin notification email sent to ${user.email} for order #${order.id}`,
          )
        } catch (error) {
          payload.logger.error(
            error,
            `Failed to send admin notification to ${user.email} for order #${order.id}`,
          )
          // Don't throw - continue sending to other staff members
        }
      })

      await Promise.all(emailPromises)

      // Add small delay between batches if there are more emails to send
      if (i + BATCH_SIZE < staffUsers.docs.length) {
        await new Promise((resolve) => setTimeout(resolve, 1100))
      }
    }

    payload.logger.info(
      `Admin order notifications completed for order #${order.id}. Sent to ${staffUsers.docs.length} recipients.`,
    )
  } catch (error) {
    payload.logger.error(error, `Error sending admin order notifications for order #${order.id}`)
    // Don't throw - admin notifications shouldn't break order confirmation
  }
}
