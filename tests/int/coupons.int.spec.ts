import { describe, expect, it, vi } from 'vitest'

import { validateCoupon } from '@/endpoints/coupons/helpers'
import { validateCouponHandler } from '@/endpoints/coupons/validate'
import type { Cart, Coupon } from '@/payload-types'

const buildCoupon = (overrides: Partial<Coupon> = {}): Coupon =>
  ({
    id: 1,
    code: 'SAVE20',
    type: 'percentage',
    value: 20,
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2026-12-31T23:59:59.000Z',
    active: true,
    usageCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as Coupon

const buildCart = (overrides: Partial<Cart> = {}): Cart =>
  ({
    id: 10,
    items: [],
    subtotal: 0,
    currency: 'NGN',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as Cart

const buildProductReference = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 101,
    slug: 'product-slug',
    title: 'Product',
    categories: [11],
    priceInNGN: 5000,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }) as NonNullable<NonNullable<Cart['items']>[number]['product']>

describe('coupon validation helpers', () => {
  it('applies percentage discounts only to eligible restricted items', async () => {
    const coupon = buildCoupon({
      applicableCategories: [11],
    })

    const cart = buildCart({
      subtotal: 15000,
      items: [
        {
          id: 'line-1',
          quantity: 1,
          product: buildProductReference({
            id: 101,
            title: 'Eligible product',
          }),
        },
        {
          id: 'line-2',
          quantity: 1,
          product: buildProductReference({
            id: 102,
            title: 'Ineligible product',
            categories: [12],
            priceInNGN: 10000,
          }),
        },
      ],
    })

    const result = await validateCoupon(coupon, cart)

    expect(result.valid).toBe(true)
    expect(result.discount).toBe(1000)
  })

  it('caps fixed discounts at the eligible restricted subtotal', async () => {
    const coupon = buildCoupon({
      type: 'fixed',
      fixedAmount: 7000,
      applicableProducts: [101],
    })

    const cart = buildCart({
      subtotal: 15000,
      items: [
        {
          id: 'line-1',
          quantity: 1,
          product: buildProductReference({
            id: 101,
            title: 'Eligible product',
          }),
        },
        {
          id: 'line-2',
          quantity: 1,
          product: buildProductReference({
            id: 102,
            title: 'Ineligible product',
            categories: [12],
            priceInNGN: 10000,
          }),
        },
      ],
    })

    const result = await validateCoupon(coupon, cart)

    expect(result.valid).toBe(true)
    expect(result.discount).toBe(5000)
  })

  it('rejects carts that are no longer active', async () => {
    const coupon = buildCoupon()
    const cart = buildCart({
      status: 'purchased',
      subtotal: 5000,
      items: [
        {
          id: 'line-1',
          quantity: 1,
          product: buildProductReference(),
        },
      ],
    })

    const result = await validateCoupon(coupon, cart)

    expect(result.valid).toBe(false)
    expect(result.error).toBe('This cart can no longer accept coupons')
  })

  it('enforces max uses per user from attributed orders', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ totalDocs: 1 }),
    } as any

    const coupon = buildCoupon({
      maxUsesPerUser: 1,
    })

    const cart = buildCart({
      subtotal: 5000,
      items: [
        {
          id: 'line-1',
          quantity: 1,
          product: buildProductReference(),
        },
      ],
    })

    const result = await validateCoupon(coupon, cart, {
      payload,
      userId: 42,
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('You have already used this coupon the maximum number of times')
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        where: expect.objectContaining({
          and: expect.arrayContaining([
            { coupon: { equals: coupon.id } },
            { customer: { equals: 42 } },
          ]),
        }),
      }),
    )
  })

  it('enforces global usage limits from attributed orders', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ totalDocs: 2 }),
    } as any

    const coupon = buildCoupon({
      usageLimit: 2,
      maxUsesPerUser: 0,
    })

    const cart = buildCart({
      subtotal: 5000,
      items: [
        {
          id: 'line-1',
          quantity: 1,
          product: buildProductReference(),
        },
      ],
    })

    const result = await validateCoupon(coupon, cart, {
      payload,
      customerEmail: 'guest@example.com',
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('This coupon has reached its usage limit')
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        where: {
          and: [
            { coupon: { equals: coupon.id } },
            { status: { not_in: ['cancelled', 'refunded'] } },
          ],
        },
      }),
    )
  })

  it('enforces max uses per guest from attributed orders', async () => {
    const payload = {
      find: vi.fn().mockResolvedValue({ totalDocs: 1 }),
    } as any

    const coupon = buildCoupon({
      maxUsesPerUser: 1,
    })

    const cart = buildCart({
      subtotal: 5000,
      items: [
        {
          id: 'line-1',
          quantity: 1,
          product: buildProductReference(),
        },
      ],
    })

    const result = await validateCoupon(coupon, cart, {
      payload,
      customerEmail: 'Guest@Example.com',
    })

    expect(result.valid).toBe(false)
    expect(result.error).toBe('You have already used this coupon the maximum number of times')
    expect(payload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'orders',
        where: expect.objectContaining({
          and: expect.arrayContaining([
            { coupon: { equals: coupon.id } },
            { customerEmail: { equals: 'guest@example.com' } },
          ]),
        }),
      }),
    )
  })
})

describe('validateCouponHandler', () => {
  it('requires a cart secret for guest cart validation', async () => {
    const req = {
      json: async () => ({
        code: 'SAVE20',
        cartId: 10,
      }),
      payload: {
        find: vi.fn(),
        findByID: vi.fn(),
      },
      query: {},
      user: null,
    } as any

    const response = await validateCouponHandler(req)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Cart secret is required for guest carts')
    expect(req.payload.find).not.toHaveBeenCalled()
  })

  it('uses the guest cart secret when validating guest carts', async () => {
    const coupon = buildCoupon()
    const cart = buildCart({
      subtotal: 5000,
      items: [
        {
          id: 'line-1',
          quantity: 1,
          product: buildProductReference(),
        },
      ],
    })

    const find = vi.fn().mockResolvedValue({ docs: [coupon] })
    const findByID = vi
      .fn()
      .mockImplementation(async ({ req }: { req: { query: { secret?: string } } }) => {
        if (req.query.secret !== 'guest-secret') {
          return null
        }

        return cart
      })

    const req = {
      json: async () => ({
        code: 'save20',
        cartId: 10,
        cartSecret: 'guest-secret',
        customerEmail: 'guest@example.com',
      }),
      payload: {
        find,
        findByID,
      },
      query: {},
      user: null,
    } as any

    const response = await validateCouponHandler(req)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.valid).toBe(true)
    expect(result.discount).toBe(1000)
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'coupons',
        overrideAccess: true,
      }),
    )
    expect(findByID).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'carts',
        overrideAccess: false,
        user: null,
      }),
    )
  })

  it('rejects guest validation without an email for max-per-user coupons', async () => {
    const coupon = buildCoupon({
      maxUsesPerUser: 1,
    })

    const cart = buildCart({
      subtotal: 5000,
      items: [
        {
          id: 'line-1',
          quantity: 1,
          product: buildProductReference(),
        },
      ],
    })

    const req = {
      json: async () => ({
        code: 'save20',
        cartId: 10,
        cartSecret: 'guest-secret',
      }),
      payload: {
        find: vi.fn().mockResolvedValue({ docs: [coupon] }),
        findByID: vi.fn().mockResolvedValue(cart),
      },
      query: {},
      user: null,
    } as any

    const response = await validateCouponHandler(req)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Add your email address before applying this coupon')
  })
})
