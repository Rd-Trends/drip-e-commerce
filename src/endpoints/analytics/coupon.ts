import type { PayloadHandler } from 'payload'
import { checkRole } from '@/access/utilities'

export const couponAnalyticsHandler: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    // Fetch all active coupons
    const { docs: coupons } = await payload.find({
      collection: 'coupons',
      where: {
        active: { equals: true },
      },
      limit: 100,
      select: {
        code: true,
        type: true,
        value: true,
        fixedAmount: true,
        usageLimit: true,
        usageCount: true,
        minPurchaseAmount: true,
      },
    })

    const couponStats = coupons.map((coupon) => {
      const usageRate =
        coupon.usageLimit && coupon.usageLimit > 0
          ? ((coupon.usageCount || 0) / coupon.usageLimit) * 100
          : 0

      return {
        code: coupon.code,
        discountType: coupon.type,
        discountValue: coupon.type === 'percentage' ? coupon.value || 0 : coupon.fixedAmount || 0,
        currentUses: coupon.usageCount || 0,
        maxUses: coupon.usageLimit,
        usageRate,
        minimumOrderValue: coupon.minPurchaseAmount,
      }
    })

    // Sort by usage
    const topCoupons = couponStats.sort((a, b) => b.currentUses - a.currentUses).slice(0, 10)

    return Response.json({
      topCoupons,
      totalActiveCoupons: coupons.length,
    })
  } catch (error) {
    console.error('Coupon analytics error:', error)
    return Response.json({ error: 'Failed to fetch coupon analytics' }, { status: 500 })
  }
}
