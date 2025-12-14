import { Address } from '@/payload-types'
import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import Paystack from '@paystack/paystack-sdk'
import { CollectionSlug } from 'payload'

export type PaystackTransactionMetadata = {
  cartId: number
  cartItemsSnapshot: Array<{
    product: number
    quantity: number
    variant?: number
  }>
  shippingAddress?: Address
  billingAddress?: Address
}

export const initiatePayment: NonNullable<PaymentAdapter>['initiatePayment'] = async ({
  data,
  req,
  transactionsSlug,
}) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  const payload = req.payload

  // Check for any required data
  const customerEmail = data.customerEmail
  const currency = data.currency
  const cart = data.cart
  const amount = cart.subtotal
  const billingAddress = data.billingAddress
  const shippingAddress = data.shippingAddress

  if (!secretKey) {
    throw new Error('Paystack secret key is not configured.')
  }

  if (!currency) {
    throw new Error('Currency is required.')
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    throw new Error('Cart is empty or not provided.')
  }

  if (!customerEmail || typeof customerEmail !== 'string') {
    throw new Error('A valid customer email is required to make a purchase.')
  }

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    throw new Error('A valid amount is required to initiate a payment.')
  }

  const paystack = new Paystack(secretKey)

  try {
    let customer: { email: string; id: number } = (
      await paystack.customer.fetch({ code: customerEmail })
    ).data
    if (!customer?.id) {
      customer = (await paystack.customer.create({ email: customerEmail })).data
    }

    // Initialize transaction with Paystack
    const reference = `txn_${crypto.randomUUID()}`
    const flattenedCart = cart.items.map((item) => {
      const productID = typeof item.product === 'object' ? item.product.id : item.product
      const variantID = item.variant
        ? typeof item.variant === 'object'
          ? item.variant.id
          : item.variant
        : undefined

      return {
        product: productID,
        quantity: item.quantity,
        variant: variantID,
      }
    })

    const transactionResponse = await paystack.transaction.initialize({
      email: customerEmail,
      amount: cart.subtotal || 0, // Value in kobo
      currency: currency,
      reference: reference,
      callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm`,
      metadata: JSON.stringify({
        cartId: cart.id,
        billingAddress,
        shippingAddress,
        cartItemsSnapshot: flattenedCart,
      } as PaystackTransactionMetadata),
    })

    // Create a transaction for the payment intent in the database
    const transaction = await payload.create({
      collection: transactionsSlug as CollectionSlug,
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        amount: cart.subtotal || 0,
        billingAddress: billingAddress,
        cart: cart.id,
        currency: currency as 'NGN',
        items: flattenedCart,
        paymentMethod: 'paystack',
        status: 'pending',
        paystack: {
          reference: reference,
          customerId: customer.id,
        },
      },
    })

    // Return the data needed for the client to complete the payment
    const returnData = {
      message: 'Payment initiated successfully',
      reference: reference,
      authorizationUrl: transactionResponse.data?.authorization_url,
      accessCode: transactionResponse.data?.access_code,
      transactionID: transaction.id,
    }

    return returnData
  } catch (error) {
    payload.logger.error(error, 'Error initiating payment with Paystack')

    throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
  }
}
