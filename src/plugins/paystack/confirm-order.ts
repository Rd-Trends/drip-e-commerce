import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import Paystack from '@paystack/paystack-sdk'
import { CollectionSlug } from 'payload'
import { PaystackTransactionMetadata } from './initiate-payment'

type Props = {
  secretKey: string
}

export const confirmOrder: NonNullable<PaymentAdapter>['confirmOrder'] = async ({
  data,
  ordersSlug = 'orders',
  req,
  transactionsSlug = 'transactions',
}) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY

  const payload = req.payload
  const customerEmail = data.customerEmail
  const paymentReference = data.reference as string

  if (!secretKey) {
    throw new Error('Paystack secret key is not configured.')
  }

  if (!paymentReference) {
    throw new Error('PaymentReference is required')
  }

  if (!customerEmail || typeof customerEmail !== 'string') {
    throw new Error('A valid customer email is required to confirm the order.')
  }

  const paystack = new Paystack(secretKey)

  try {
    // Find our existing transaction by the payment intent ID
    const transactionsResults = await payload.find({
      collection: transactionsSlug as CollectionSlug,
      where: {
        'paystack.reference': {
          equals: paymentReference,
        },
      },
    })

    const transaction = transactionsResults.docs[0]

    if (!transaction) {
      throw new Error('No transaction found for the provided payment reference')
    }

    // Verify the payment intent exists and retrieve it
    const paymentIntent = await paystack.transaction.verify({ reference: paymentReference })
    const paymentMetadata = paymentIntent.data?.metadata as PaystackTransactionMetadata | undefined

    const cartID = paymentMetadata?.cartId
    const cartItemsSnapshot = paymentMetadata?.cartItemsSnapshot
    const shippingAddress = paymentMetadata?.shippingAddress

    if (!cartID) {
      throw new Error('No cart ID found in payment metadata')
    }

    if (!cartItemsSnapshot || !Array.isArray(cartItemsSnapshot)) {
      throw new Error('Cart items snapshot not found or invalid in the PaymentIntent metadata')
    }

    // Create the order in the database
    const order = await payload.create({
      collection: ordersSlug as CollectionSlug,
      data: {
        amount: paymentIntent.data.amount,
        currency: paymentIntent.data.currency as 'NGN',
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        items: cartItemsSnapshot,
        shippingAddress,
        status: 'processing',
        transactions: [transaction.id],
      },
    })

    const timestamp = new Date().toISOString()

    // Update the cart to mark it as purchased, this will prevent further updates to the cart
    await payload.update({
      id: cartID,
      collection: 'carts',
      data: {
        purchasedAt: timestamp,
      },
    })

    // Update the transaction with the order ID and mark as succeeded
    await payload.update({
      id: transaction.id,
      collection: transactionsSlug as CollectionSlug,
      data: {
        order: order.id,
        status: 'succeeded',
      },
    })

    return {
      message: 'Payment initiated successfully',
      orderID: order.id,
      transactionID: transaction.id,
    }
  } catch (error) {
    payload.logger.error(error, 'Error confirming payment with Paystack')

    throw new Error(error instanceof Error ? error.message : 'Unknown error confirming payment')
  }
}
