import { Endpoint } from 'payload'
import { getCustomerEmail } from '../shared/cart-helpers'
import {
  verifyPayment,
  updateCartAndTransaction,
  updateInventory,
  trackCouponUsage,
} from './helpers'

export const confirmPaystackOrderHandler: Endpoint['handler'] = async (req) => {
  try {
    const data = await req.json?.()
    const payload = req.payload
    const user = req.user

    // Extract and validate customer email
    const customerEmail = getCustomerEmail(user, data?.customerEmail)

    // Validate payment reference
    const paymentReference = data?.reference as string
    if (!paymentReference) {
      return Response.json(
        {
          message: 'Payment reference is required',
        },
        {
          status: 400,
        },
      )
    }

    // Verify payment and get transaction
    const { transaction, paymentIntent, metadata } = await verifyPayment({
      reference: paymentReference,
      req,
    })

    // Create order from verified payment
    // @ts-ignore – Type issue with create method (don't have a draft field)
    const order = await payload.create({
      collection: 'orders',
      data: {
        currency: paymentIntent.data.currency as 'NGN',
        grandTotal: paymentIntent.data.amount,
        tax: metadata.taxAmount || 0,
        shippingFee: metadata.shippingAmount || 0,
        subtotal: metadata.subtotalAmount || paymentIntent.data.amount,
        discount: metadata.discountAmount || 0,
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        items: metadata.cartItemsSnapshot,
        shippingAddress: metadata.shippingAddress,
        status: 'processing',
        transactions: [transaction.id],
      },
    })

    // Update cart and transaction
    await updateCartAndTransaction({
      cartId: metadata.cartId,
      transactionId: transaction.id,
      orderId: order.id,
      req,
    })

    // Update inventory
    await updateInventory({
      transactionId: transaction.id,
      req,
    })

    // Track coupon usage if applicable
    if (metadata.couponId) {
      await trackCouponUsage(payload, metadata.couponId, user?.id || null)
    }

    return Response.json({
      message: 'Payment confirmed successfully',
      orderID: order.id,
    })
  } catch (error) {
    req.payload.logger.error(error, 'Error confirming order.')

    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Error confirming order.',
      },
      {
        status: 500,
      },
    )
  }
}
