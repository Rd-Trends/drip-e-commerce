'use client'

import { useMutation } from '@tanstack/react-query'

export type ValidateCouponRequest = {
  code: string
  cartId: number
}

export type ValidateCouponResponse = {
  valid: boolean
  coupon?: {
    id: number
    code: string
    type: 'percentage' | 'fixed'
    value: number
    fixedAmount?: number
    description?: string
  }
  discount?: number
  error?: string
}

/**
 * Hook to validate a coupon code
 */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: async (data: ValidateCouponRequest): Promise<ValidateCouponResponse> => {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to validate coupon')
      }

      return result
    },
  })
}
