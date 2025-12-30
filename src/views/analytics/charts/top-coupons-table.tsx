'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'

interface Coupon {
  code: string
  discountType: string
  discountValue: number
  currentUses: number
  maxUses?: number
  usageRate: number
}

interface TopCouponsTableProps {
  coupons: Coupon[]
}

export function TopCouponsTable({ coupons }: TopCouponsTableProps) {
  if (coupons.length === 0) {
    return <p className="empty-message">No coupon data available</p>
  }

  return (
    <table className="analytics-table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Discount</th>
          <th className="text-right">Uses</th>
          <th className="text-right">Max Uses</th>
          <th className="text-right">Usage Rate</th>
        </tr>
      </thead>
      <tbody>
        {coupons.map((coupon) => (
          <tr key={coupon.code}>
            <td className="font-mono font-medium">{coupon.code}</td>
            <td>
              {coupon.discountType === 'percentage' ? (
                <span className="discount-badge">{coupon.discountValue}% off</span>
              ) : (
                <span className="discount-badge">{formatCurrency(coupon.discountValue)} off</span>
              )}
            </td>
            <td className="text-right">{coupon.currentUses}</td>
            <td className="text-right">{coupon.maxUses || 'Unlimited'}</td>
            <td className="text-right">
              {coupon.maxUses ? (
                <span
                  className={
                    coupon.usageRate >= 80
                      ? 'usage-high'
                      : coupon.usageRate >= 50
                        ? 'usage-medium'
                        : ''
                  }
                >
                  {coupon.usageRate.toFixed(0)}%
                </span>
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
