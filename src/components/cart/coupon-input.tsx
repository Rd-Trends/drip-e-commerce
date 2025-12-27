'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useValidateCoupon } from '@/hooks/use-coupon'
import { AlertCircle, CheckCircle2, Tag, X } from 'lucide-react'
import { useState } from 'react'
import { Price } from '@/components/price'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { InputGroup, InputGroupInput, InputGroupAddon, InputGroupButton } from '../ui/input-group'

type AppliedCoupon = {
  id: number
  code: string
  type: 'percentage' | 'fixed'
  value: number
  discount: number
}

type CouponInputProps = {
  cartId: number
  onCouponApplied: (coupon: AppliedCoupon) => void
  onCouponRemoved: () => void
  appliedCoupon: AppliedCoupon | null
  disabled?: boolean
}

export function CouponInput({
  cartId,
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  disabled = false,
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const validateCoupon = useValidateCoupon()

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code')
      return
    }
    setError(null)

    validateCoupon.mutate(
      { code: couponCode.trim(), cartId },
      {
        onSuccess: (result) => {
          if (result.valid && result.coupon && result.discount) {
            onCouponApplied({
              id: result.coupon.id,
              code: result.coupon.code,
              type: result.coupon.type,
              value: result.coupon.value,
              discount: result.discount,
            })
            setCouponCode('')
            setError(null)
          } else {
            setError(result.error || 'Invalid coupon code')
          }
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Failed to validate coupon')
        },
      },
    )
  }

  const handleRemoveCoupon = () => {
    onCouponRemoved()
    setCouponCode('')
    setError(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleApplyCoupon()
    }
  }

  if (appliedCoupon) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20">
        <CheckCircle2 className="size-4 text-green-600 dark:text-green-500" />
        <AlertTitle className="flex items-center gap-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {appliedCoupon.code}
          </Badge>
          <span className="text-sm font-normal text-muted-foreground">
            {appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}% off` : 'Fixed discount'}
          </span>
        </AlertTitle>
        <AlertDescription className="text-xs text-green-700 dark:text-green-400">
          You save <Price amount={appliedCoupon.discount} as="span" className="font-semibold" />
        </AlertDescription>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRemoveCoupon}
          disabled={disabled}
          className="absolute right-2 top-2"
        >
          <X className="size-4" />
        </Button>
      </Alert>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="coupon-code" className="text-sm font-medium flex items-center gap-2">
        <Tag className="h-4 w-4" />
        Have a coupon code?
      </Label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Tag className="size-4" />
        </InputGroupAddon>
        <InputGroupInput
          id="coupon-code"
          type="text"
          placeholder="Enter code"
          value={couponCode}
          onChange={(e) => {
            setCouponCode(e.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={handleKeyPress}
          disabled={disabled || validateCoupon.isPending}
          className="font-mono"
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            variant="secondary"
            onClick={handleApplyCoupon}
            disabled={disabled || !couponCode.trim() || validateCoupon.isPending}
          >
            {validateCoupon.isPending ? 'Validating...' : 'Apply'}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="size-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
