import { currenciesConfig } from '@/lib/constants'
import { Endpoint } from 'payload'
import { getCartID, getCustomerEmail, getCurrency } from '../shared/cart-helpers'
import {
  validateAndGetCart,
  validateCurrency,
  validateCartItems,
  validateCartItemsInventory,
} from '../shared/validators'
import { calculateFees, initializePaystackTransaction } from './helpers'

export const initiatePaystackPaymentHandler: Endpoint['handler'] = async (req) => {
  try {
    const data = await req.json?.()
    const user = req.user

    // Extract and validate customer email
    const customerEmail = getCustomerEmail(user, data?.customerEmail)

    // Get cart ID from user or data
    const cartData = getCartID(user, data?.cartID)
    const cartID = cartData.cartID
    let cart = cartData.cart

    // Fetch cart if not already available
    if (!cart) {
      cart = await validateAndGetCart(req, cartID)
    }

    // Get and validate currency
    const currency = validateCurrency(getCurrency(cart, currenciesConfig.defaultCurrency))

    // Validate cart has items
    validateCartItems(cart)

    // Validate all cart items for pricing and inventory
    await validateCartItemsInventory(req, cart, currency)

    // Get subtotal from cart
    const subtotal = cart.subtotal || 0
    if (!subtotal || subtotal <= 0) {
      return Response.json(
        {
          message: 'A valid cart subtotal is required to initiate a payment.',
        },
        {
          status: 400,
        },
      )
    }

    // Calculate fees (shipping, tax, discount)
    const fees = await calculateFees({
      cart,
      subtotal,
      req,
      shippingState: data?.shippingAddress?.state,
      couponIdParam: data?.couponId,
    })

    // Initialize Paystack transaction
    const paymentResponse = await initializePaystackTransaction({
      customerEmail,
      currency,
      cart,
      fees,
      billingAddress: data?.billingAddress,
      shippingAddress: data?.shippingAddress,
      req,
    })

    return Response.json({
      message: 'Payment initiated successfully',
      reference: paymentResponse.reference,
      accessCode: paymentResponse.accessCode,
      breakdown: paymentResponse.breakdown,
    })
  } catch (error) {
    req.payload.logger.error(error, 'Error initiating payment.')

    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Error initiating payment.',
      },
      {
        status: 500,
      },
    )
  }
}
