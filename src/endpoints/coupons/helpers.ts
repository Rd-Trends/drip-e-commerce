import { Cart, Coupon, Product } from '@/payload-types'
import { currenciesConfig } from '@/lib/constants'
import { BasePayload, Where } from 'payload'

/**
 * Validation result for coupon check
 */
export type CouponValidationResult = {
  valid: boolean
  error?: string
  discount?: number
  freeShipping?: boolean
  coupon?: Coupon
}

type CouponValidationIdentity = {
  userId?: number | null
  customerEmail?: string | null
}

type CountCouponOrdersArgs = CouponValidationIdentity & {
  couponId: number
  payload: BasePayload
}

type CouponValidationOptions = CouponValidationIdentity & {
  payload?: BasePayload
}

const normalizeCustomerEmail = (email?: string | null) => {
  if (!email) return null

  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail.length > 0 ? normalizedEmail : null
}

const normalizeRelationshipID = (value: number | { id: number } | null | undefined) => {
  if (!value) return null
  return typeof value === 'number' ? value : value.id
}

const getCouponRestrictionState = (coupon: Coupon) => {
  const hasCategoryRestrictions =
    Array.isArray(coupon.applicableCategories) && coupon.applicableCategories.length > 0
  const hasProductRestrictions =
    Array.isArray(coupon.applicableProducts) && coupon.applicableProducts.length > 0

  return {
    hasCategoryRestrictions,
    hasProductRestrictions,
    isRestricted: hasCategoryRestrictions || hasProductRestrictions,
  }
}

const getCartPriceField = (cart: Cart) => {
  const cartCurrency =
    typeof cart.currency === 'string' ? cart.currency : currenciesConfig.defaultCurrency
  return `priceIn${cartCurrency.toUpperCase()}`
}

const getCartItemUnitPrice = (cart: Cart, item: NonNullable<Cart['items']>[number]) => {
  const priceField = getCartPriceField(cart)

  if (item.variant && typeof item.variant === 'object') {
    const variantPrice = item.variant[priceField as keyof typeof item.variant]
    if (typeof variantPrice === 'number') {
      return variantPrice
    }
  }

  if (item.product && typeof item.product === 'object') {
    const productPrice = item.product[priceField as keyof typeof item.product]
    if (typeof productPrice === 'number') {
      return productPrice
    }
  }

  return 0
}

const isCouponApplicableToItem = (
  coupon: Coupon,
  item: NonNullable<Cart['items']>[number],
): boolean => {
  const { hasCategoryRestrictions, hasProductRestrictions, isRestricted } =
    getCouponRestrictionState(coupon)

  if (!isRestricted) {
    return true
  }

  if (!item.product || typeof item.product !== 'object') {
    return false
  }

  const product = item.product as Product

  if (hasProductRestrictions) {
    const applicableProductIds = (coupon.applicableProducts || [])
      .map((productValue) => normalizeRelationshipID(productValue as number | { id: number }))
      .filter((productId): productId is number => typeof productId === 'number')

    const productId = normalizeRelationshipID(item.product as number | { id: number })

    if (!productId || !applicableProductIds.includes(productId)) {
      return false
    }
  }

  if (hasCategoryRestrictions) {
    const applicableCategoryIds = (coupon.applicableCategories || [])
      .map((categoryValue) => normalizeRelationshipID(categoryValue as number | { id: number }))
      .filter((categoryId): categoryId is number => typeof categoryId === 'number')

    const hasMatchingCategory = (product.categories || []).some((categoryValue) => {
      const categoryId = normalizeRelationshipID(categoryValue as number | { id: number })
      return typeof categoryId === 'number' && applicableCategoryIds.includes(categoryId)
    })

    if (!hasMatchingCategory) {
      return false
    }
  }

  return true
}

export function calculateApplicableSubtotal(coupon: Coupon, cart: Cart): number {
  if (!cart.items || cart.items.length === 0) {
    return 0
  }

  return cart.items.reduce((eligibleSubtotal, item) => {
    if (!isCouponApplicableToItem(coupon, item)) {
      return eligibleSubtotal
    }

    const unitPrice = getCartItemUnitPrice(cart, item)
    const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1

    return eligibleSubtotal + unitPrice * quantity
  }, 0)
}

/**
 * Calculate discount amount based on coupon type and cart subtotal
 * @param coupon - The coupon to apply
 * @param subtotal - Cart subtotal in kobo
 * @returns Discount amount in kobo
 */
export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  let discount = 0

  // Free shipping coupons don't apply cart discounts
  if (coupon.type === 'free-shipping') {
    return 0
  }

  if (coupon.type === 'percentage') {
    // Calculate percentage discount
    const percentageValue = coupon.value || 0
    discount = Math.floor((subtotal * percentageValue) / 100)

    // Apply max discount cap if set (maxDiscountAmount is in kobo from amountField)
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount)
    }
  } else if (coupon.type === 'fixed') {
    // Fixed amount discount (fixedAmount is already in kobo from amountField)
    discount = coupon.fixedAmount || 0
  }

  // Ensure discount doesn't exceed subtotal
  discount = Math.min(discount, subtotal)

  return discount
}

export async function countCouponAttributedOrders({
  couponId,
  payload,
  userId,
  customerEmail,
}: CountCouponOrdersArgs): Promise<number> {
  const normalizedCustomerEmail = normalizeCustomerEmail(customerEmail)

  const whereClauses: Where[] = [
    {
      coupon: {
        equals: couponId,
      },
    },
    {
      status: {
        not_in: ['cancelled', 'refunded'],
      },
    },
  ]

  if (userId) {
    whereClauses.push({
      customer: {
        equals: userId,
      },
    })
  } else if (normalizedCustomerEmail) {
    whereClauses.push({
      customerEmail: {
        equals: normalizedCustomerEmail,
      },
    })
  }

  const result = await payload.find({
    collection: 'orders',
    depth: 0,
    limit: 0,
    where: {
      and: whereClauses,
    },
  })

  return result.totalDocs
}

/**
 * Validate if a coupon can be applied to a cart
 * @param coupon - The coupon to validate
 * @param cart - The cart to apply coupon to
 * @param userId - ID of the user applying the coupon (optional for guest checkouts)
 * @returns Validation result with error message if invalid
 */
export async function validateCoupon(
  coupon: Coupon,
  cart: Cart,
  { payload, userId, customerEmail }: CouponValidationOptions = {},
): Promise<CouponValidationResult> {
  const subtotal = cart.subtotal || 0
  const now = new Date()

  if (cart.status && cart.status !== 'active') {
    return {
      valid: false,
      error: 'This cart can no longer accept coupons',
    }
  }

  if (!cart.items || cart.items.length === 0) {
    return {
      valid: false,
      error: 'Your cart is empty',
    }
  }

  // Check if coupon is active
  if (!coupon.active) {
    return {
      valid: false,
      error: 'This coupon is no longer active',
    }
  }

  // Check validity dates
  const validFrom = coupon.validFrom ? new Date(coupon.validFrom) : null
  const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null

  if (validFrom && now < validFrom) {
    return {
      valid: false,
      error: 'This coupon is not yet valid',
    }
  }

  if (validUntil && now > validUntil) {
    return {
      valid: false,
      error: 'This coupon has expired',
    }
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageLimit > 0) {
    if (!payload) {
      return {
        valid: false,
        error: 'Unable to validate coupon usage at the moment',
      }
    }

    const usageCount = await countCouponAttributedOrders({
      couponId: coupon.id,
      payload,
    })

    if (usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        error: 'This coupon has reached its usage limit',
      }
    }
  }

  // Check per-user usage limit
  if (coupon.maxUsesPerUser && coupon.maxUsesPerUser > 0) {
    const normalizedCustomerEmail = normalizeCustomerEmail(customerEmail)

    if (!userId && !normalizedCustomerEmail) {
      return {
        valid: false,
        error: 'Add your email address before applying this coupon',
      }
    }

    if (!payload) {
      return {
        valid: false,
        error: 'Unable to validate coupon usage at the moment',
      }
    }

    const customerUsageCount = await countCouponAttributedOrders({
      couponId: coupon.id,
      payload,
      userId,
      customerEmail: normalizedCustomerEmail,
    })

    if (customerUsageCount >= coupon.maxUsesPerUser) {
      return {
        valid: false,
        error: 'You have already used this coupon the maximum number of times',
      }
    }
  }

  // Check minimum purchase amount (minPurchaseAmount is already in kobo from amountField)
  if (coupon.minPurchaseAmount && coupon.minPurchaseAmount > 0) {
    if (subtotal < coupon.minPurchaseAmount) {
      // Convert kobo to Naira for display
      const minPurchaseNaira = Math.floor(coupon.minPurchaseAmount / 100)
      return {
        valid: false,
        error: `Minimum purchase of ₦${minPurchaseNaira.toLocaleString()} required`,
      }
    }
  }

  const { isRestricted } = getCouponRestrictionState(coupon)
  const applicableSubtotal = calculateApplicableSubtotal(coupon, cart)

  if (isRestricted && applicableSubtotal <= 0) {
    return {
      valid: false,
      error: 'This coupon is not applicable to items in your cart',
    }
  }

  // Calculate discount
  const discount = calculateDiscount(coupon, isRestricted ? applicableSubtotal : subtotal)

  return {
    valid: true,
    discount,
    freeShipping: coupon.type === 'free-shipping',
    coupon,
  }
}
