'use client'

import { useMutation } from '@tanstack/react-query'
import { useCurrency } from '@/providers/currency'
import { useCart } from '@/providers/cart'
import { paymentApi } from '@/lib/api/payment'

/**
 * Hook for initiating payment
 * @example
 * const { mutate: initiatePayment, isPending } = useInitiatePayment()
 * initiatePayment({ paymentMethodID: 'paystack', additionalData: { email: 'user@example.com' } })
 */
export const useInitiatePayment = () => {
  const { currency } = useCurrency()
  const { cartID, cartSecret } = useCart()

  return useMutation({
    mutationFn: (data: { paymentMethodID: string; additionalData?: Record<string, unknown> }) => {
      if (!cartID) {
        throw new Error('No cart ID')
      }

      return paymentApi.initiatePayment(data.paymentMethodID, {
        cartID,
        cartSecret,
        currencyCode: currency.code,
        additionalData: data.additionalData,
      })
    },
  })
}

/**
 * Hook for confirming order after payment
 * @example
 * const { mutate: confirmOrder, isPending } = useConfirmOrder()
 * confirmOrder({ paymentMethodID: 'paystack', additionalData: { reference: 'xxx' } })
 */
export const useConfirmOrder = () => {
  const { currency } = useCurrency()
  const { cartID, cartSecret } = useCart()

  return useMutation({
    mutationFn: (data: { paymentMethodID: string; additionalData?: Record<string, unknown> }) => {
      if (!cartID) {
        throw new Error('No cart ID')
      }

      return paymentApi.confirmOrder(data.paymentMethodID, {
        cartID,
        cartSecret,
        currencyCode: currency.code,
        additionalData: data.additionalData,
      })
    },
  })
}
