import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { validateCoupon } from '@/utils/coupon-helpers'
import { Cart, Coupon } from '@/payload-types'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config: configPromise })
    const body = await req.json()
    const { code, cartId } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 })
    }

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID is required' }, { status: 400 })
    }

    // Find coupon by code (case-insensitive)
    const couponsResult = await payload.find({
      collection: 'coupons',
      where: {
        code: {
          equals: code.toUpperCase().trim(),
        },
      },
      limit: 1,
    })

    if (!couponsResult.docs || couponsResult.docs.length === 0) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
    }

    const coupon = couponsResult.docs[0] as Coupon

    // Fetch cart with populated items
    const cart = await payload.findByID({
      collection: 'carts',
      id: cartId,
      depth: 2,
    })

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 })
    }

    // Get user ID from authenticated session if available
    const { user } = await payload.auth({ headers: req.headers })
    const userId = user?.id || null

    // Validate coupon
    const validationResult = validateCoupon(coupon as Coupon, cart as Cart, userId)

    if (!validationResult.valid) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 })
    }

    // Return success with discount details
    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
      },
      discount: validationResult.discount,
    })
  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'An error occurred while validating the coupon' },
      { status: 500 },
    )
  }
}
