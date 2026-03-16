import { Endpoint } from 'payload'
import { validateCoupon } from './helpers'

export const validateCouponHandler: Endpoint['handler'] = async (req) => {
  try {
    const body = await req.json?.()
    const { code, cartId, cartSecret, customerEmail } = body
    const payload = req.payload

    if (!code || typeof code !== 'string') {
      return Response.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    if (!cartId) {
      return Response.json({ error: 'Cart ID is required' }, { status: 400 })
    }

    if (!req.user && (!cartSecret || typeof cartSecret !== 'string')) {
      return Response.json({ error: 'Cart secret is required for guest carts' }, { status: 400 })
    }

    // Find coupon by code (case-insensitive)
    const couponsResult = await payload.find({
      collection: 'coupons',
      overrideAccess: true,
      where: {
        code: {
          equals: code.toUpperCase().trim(),
        },
      },
      limit: 1,
    })

    if (!couponsResult.docs || couponsResult.docs.length === 0) {
      return Response.json({ error: 'Invalid coupon code' }, { status: 404 })
    }

    const coupon = couponsResult.docs[0]

    // Fetch cart with populated items
    if (cartSecret && typeof cartSecret === 'string') {
      req.query = {
        ...req.query,
        secret: cartSecret,
      }
    }

    const cart = await payload.findByID({
      collection: 'carts',
      id: cartId,
      depth: 2,
      overrideAccess: false,
      user: req.user,
      req,
    })

    if (!cart) {
      return Response.json({ error: 'Cart not found' }, { status: 404 })
    }

    // Validate coupon
    const validationResult = await validateCoupon(coupon, cart, {
      payload,
      userId: req.user?.id || null,
      customerEmail,
    })

    if (!validationResult.valid) {
      return Response.json({ error: validationResult.error }, { status: 400 })
    }

    // Return success with discount details
    return Response.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
      },
      discount: validationResult.discount,
      freeShipping: validationResult.freeShipping,
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return Response.json(
      { error: 'An error occurred while validating the coupon' },
      { status: 500 },
    )
  }
}
