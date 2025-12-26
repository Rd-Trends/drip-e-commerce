import { Address } from '@/payload-types'
import { PaymentAdapter } from '@payloadcms/plugin-ecommerce/types'
import Paystack from '@paystack/paystack-sdk'
import { CollectionSlug } from 'payload'
import { calculateShippingFee } from '@/utils/calculate-shipping'
import { calculateTax } from '@/utils/calculate-tax'

export type PaystackTransactionMetadata = {
  cartId: number
  cartItemsSnapshot: Array<{
    product: number
    quantity: number
    variant?: number
  }>
  shippingAddress?: Address
  billingAddress?: Address
  taxAmount: number
  shippingAmount: number
  subtotalAmount: number
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
  const subtotal = cart.subtotal || 0
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

  if (!subtotal || typeof subtotal !== 'number' || subtotal <= 0) {
    throw new Error('A valid cart subtotal is required to initiate a payment.')
  }

  // Fetch shipping configuration for tax and shipping calculations
  const shippingConfig = await payload.findGlobal({
    slug: 'shipping-config',
  })

  if (!shippingConfig) {
    throw new Error('Shipping configuration not found.')
  }

  // Calculate shipping fee based on shipping address state
  const shippingState = shippingAddress?.state
  const shippingCalculation = calculateShippingFee(shippingState, subtotal, shippingConfig)
  const shippingFee = shippingCalculation.fee

  // Calculate tax on subtotal (before shipping)
  const taxRate = (shippingConfig.taxRate as number) || 7.5
  const taxAmount = calculateTax(subtotal, taxRate)

  // Calculate grand total: subtotal + shipping + tax - discount
  // Note: discount will be handled later if/when coupon system is implemented
  const discount = 0
  const grandTotal = subtotal + shippingFee + taxAmount - discount

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
      amount: grandTotal, // Grand total in kobo (subtotal + shipping + tax - discount)
      currency: currency,
      reference: reference,
      callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm`,
      metadata: JSON.stringify({
        cartId: cart.id,
        billingAddress,
        shippingAddress,
        cartItemsSnapshot: flattenedCart,
        subtotalAmount: subtotal,
        shippingAmount: shippingFee,
        taxAmount: taxAmount,
      } as PaystackTransactionMetadata),
    })

    // Create a transaction for the payment intent in the database
    const transaction = await payload.create({
      collection: transactionsSlug as CollectionSlug,
      data: {
        ...(req.user ? { customer: req.user.id } : { customerEmail }),
        amount: grandTotal,
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
      breakdown: {
        subtotal,
        shippingFee,
        taxAmount,
        discount,
        grandTotal,
      },
    }

    return returnData
  } catch (error) {
    payload.logger.error(error, 'Error initiating payment with Paystack')

    throw new Error(error instanceof Error ? error.message : 'Unknown error initiating payment')
  }
}
