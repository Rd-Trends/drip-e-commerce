import { Address, Cart } from '@/payload-types'
import { PayloadRequest } from 'payload'
import Paystack from '@paystack/paystack-sdk'
import { calculateShippingFee } from '@/utils/calculate-shipping'
import { calculateTax } from '@/utils/calculate-tax'
import { validateCoupon } from '@/utils/coupon-helpers'
import { PaystackTransactionMetadata } from '../shared/types'

type CalculateTotalsParams = {
  cart: Cart
  subtotal: number
  req: PayloadRequest
  shippingState?: string
  couponIdParam?: string | number
}

/**
 * Calculates all fees including shipping, tax, and discount
 */
export async function calculateFees({
  cart,
  subtotal,
  req,
  shippingState,
  couponIdParam,
}: CalculateTotalsParams) {
  const payload = req.payload

  // Fetch shipping configuration
  const shippingConfig = await payload.findGlobal({
    slug: 'shipping-config',
  })

  if (!shippingConfig) {
    throw new Error('Shipping configuration not found.')
  }

  // Calculate shipping fee
  const shippingCalculation = calculateShippingFee(shippingState, subtotal, shippingConfig)
  const shippingFee = shippingCalculation.fee

  // Handle coupon discount
  let discount = 0
  let couponId: number | undefined

  if (couponIdParam) {
    try {
      const coupon = await payload.findByID({
        collection: 'coupons',
        id: couponIdParam,
        depth: 2,
      })

      if (coupon) {
        const userId = req.user?.id || null
        const validationResult = validateCoupon(coupon, cart, userId)

        if (validationResult.valid && validationResult.discount) {
          discount = validationResult.discount
          couponId = couponIdParam as number
        } else {
          payload.logger.warn(`Coupon validation failed: ${validationResult.error}`)
        }
      }
    } catch (error) {
      payload.logger.error(`Error validating coupon during payment initiation: ${error}`)
    }
  }

  const adjustedFee = subtotal - discount

  // Calculate tax
  const taxRate = shippingConfig.taxRate || 7.5
  const taxAmount = calculateTax(adjustedFee, taxRate)

  // Calculate grand total
  const grandTotal = adjustedFee + shippingFee + taxAmount

  return {
    subtotal,
    shippingFee,
    taxAmount,
    discount,
    grandTotal,
    couponId,
  }
}

type InitializePaystackTransactionParams = {
  customerEmail: string
  currency: string
  cart: Cart
  fees: Awaited<ReturnType<typeof calculateFees>>
  billingAddress?: Address
  shippingAddress?: Address
  req: PayloadRequest
}

export type InitializePaystackTransactionResult = {
  reference: string
  authorizationUrl?: string
  accessCode?: string
  transactionID: number | string
  breakdown: {
    subtotal: number
    shippingFee: number
    taxAmount: number
    discount: number
    grandTotal: number
  }
}

/**
 * Initializes Paystack transaction and creates transaction record
 */
export async function initializePaystackTransaction({
  customerEmail,
  currency,
  cart,
  fees,
  billingAddress,
  shippingAddress,
  req,
}: InitializePaystackTransactionParams): Promise<InitializePaystackTransactionResult> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  const payload = req.payload

  if (!secretKey) {
    throw new Error('Paystack secret key is not configured.')
  }

  const paystack = new Paystack(secretKey)

  // Get or create Paystack customer
  let customer: { email: string; id: number }
  try {
    customer = (await paystack.customer.fetch({ code: customerEmail })).data
    if (!customer?.id) {
      customer = (await paystack.customer.create({ email: customerEmail })).data
    }
  } catch (error) {
    // Customer doesn't exist, create new one
    customer = (await paystack.customer.create({ email: customerEmail })).data
  }

  // Prepare cart items snapshot
  if (!cart.items) {
    throw new Error('Cart items are required.')
  }

  const flattenedCart = cart.items.map((item) => {
    if (!item.product) {
      throw new Error('Product is required for cart item.')
    }
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

  // Generate unique reference
  const reference = `txn_${crypto.randomUUID()}`

  // Initialize transaction with Paystack
  const transactionResponse = await paystack.transaction.initialize({
    email: customerEmail,
    amount: fees.grandTotal,
    currency: currency,
    reference: reference,
    callback_url: `${process.env.NEXT_PUBLIC_SERVER_URL}/checkout/confirm`,
    metadata: JSON.stringify({
      cartId: cart.id,
      billingAddress,
      shippingAddress,
      cartItemsSnapshot: flattenedCart,
      subtotalAmount: fees.subtotal,
      shippingAmount: fees.shippingFee,
      taxAmount: fees.taxAmount,
      discountAmount: fees.discount,
      couponId: fees.couponId,
    } as PaystackTransactionMetadata),
  })

  // Create transaction record in database
  // @ts-ignore – Type issue with create method (don't have a draft field)
  const transaction = await payload.create({
    collection: 'transactions',
    data: {
      ...(req.user ? { customer: req.user.id } : { customerEmail }),
      amount: fees.grandTotal,
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

  return {
    reference: reference,
    authorizationUrl: transactionResponse.data?.authorization_url,
    accessCode: transactionResponse.data?.access_code,
    transactionID: transaction.id,
    breakdown: {
      subtotal: fees.subtotal,
      shippingFee: fees.shippingFee,
      taxAmount: fees.taxAmount,
      discount: fees.discount,
      grandTotal: fees.grandTotal,
    },
  }
}
