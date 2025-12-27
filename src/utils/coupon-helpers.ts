import { Cart, Coupon, Product, User } from '@/payload-types'

/**
 * Validation result for coupon check
 */
export type CouponValidationResult = {
  valid: boolean
  error?: string
  discount?: number
  coupon?: Coupon
}

/**
 * Calculate discount amount based on coupon type and cart subtotal
 * @param coupon - The coupon to apply
 * @param subtotal - Cart subtotal in kobo
 * @returns Discount amount in kobo
 */
export function calculateDiscount(coupon: Coupon, subtotal: number): number {
  let discount = 0

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

/**
 * Validate if a coupon can be applied to a cart
 * @param coupon - The coupon to validate
 * @param cart - The cart to apply coupon to
 * @param userId - ID of the user applying the coupon (optional for guest checkouts)
 * @returns Validation result with error message if invalid
 */
export function validateCoupon(
  coupon: Coupon,
  cart: Cart,
  userId?: number | null,
): CouponValidationResult {
  const subtotal = cart.subtotal || 0
  const now = new Date()

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
    const usageCount = coupon.usageCount || 0
    if (usageCount >= coupon.usageLimit) {
      return {
        valid: false,
        error: 'This coupon has reached its usage limit',
      }
    }
  }

  // Check per-user usage limit
  if (userId && coupon.maxUsesPerUser && coupon.maxUsesPerUser > 0) {
    const usedBy = coupon.usedBy || []
    const userUsageCount = usedBy.filter((user) => {
      const uid = typeof user === 'object' ? user.id : user
      return uid === userId
    }).length

    if (userUsageCount >= coupon.maxUsesPerUser) {
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

  // Check if cart is empty
  if (!cart.items || cart.items.length === 0) {
    return {
      valid: false,
      error: 'Your cart is empty',
    }
  }

  // Check category restrictions
  if (coupon.applicableCategories && coupon.applicableCategories.length > 0) {
    const applicableCategoryIds = coupon.applicableCategories.map((cat) =>
      typeof cat === 'object' ? cat.id : cat,
    )

    const hasApplicableProduct = cart.items.some((item) => {
      const product = item.product as Product
      if (!product || typeof product !== 'object') return false

      const productCategories = product.categories || []
      return productCategories.some((cat) => {
        const catId = typeof cat === 'object' ? cat.id : cat
        return applicableCategoryIds.includes(catId)
      })
    })

    if (!hasApplicableProduct) {
      return {
        valid: false,
        error: 'This coupon is not applicable to items in your cart',
      }
    }
  }

  // Check product restrictions
  if (coupon.applicableProducts && coupon.applicableProducts.length > 0) {
    const applicableProductIds = coupon.applicableProducts.map((prod) =>
      typeof prod === 'object' ? prod.id : prod,
    )

    const hasApplicableProduct = cart.items.some((item) => {
      if (!item.product) return false
      const productId = typeof item.product === 'object' ? item.product.id : item.product
      return productId && applicableProductIds.includes(productId)
    })

    if (!hasApplicableProduct) {
      return {
        valid: false,
        error: 'This coupon is not applicable to items in your cart',
      }
    }
  }

  // Calculate discount
  const discount = calculateDiscount(coupon, subtotal)

  return {
    valid: true,
    discount,
    coupon,
  }
}


