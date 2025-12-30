import { InitializePaystackTransactionResult } from '@/endpoints/paystack/initiate/helpers'
import type { DefaultDocumentIDType } from 'payload'

/**
 * Payment API functions
 * All payment-related API calls
 *
 * @example
 * // Direct API usage
 * import { paymentApi } from '@/lib/api/payment'
 *
 * const response = await paymentApi.initiatePayment('paystack', {
 *   cartID: 123,
 *   currencyCode: 'NGN',
 *   additionalData: { customerEmail: 'user@example.com' }
 * })
 *
 * @example
 * // Using React hooks (recommended)
 * import { usePayment } from '@/hooks/use-payment'
 *
 * const { initiatePayment, confirmOrder } = usePayment()
 * const result = await initiatePayment('paystack', {
 *   additionalData: { customerEmail: 'user@example.com' }
 * })
 */

const API_URL = process.env.NEXT_PUBLIC_SERVER_URL

const fetchJSON = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`)
  }

  return response.json()
}

export type InitiatePaymentOptions = {
  cartID: DefaultDocumentIDType
  cartSecret?: string
  currencyCode: string
  additionalData?: Record<string, unknown>
}

export type ConfirmOrderOptions = {
  cartID: DefaultDocumentIDType
  cartSecret?: string
  currencyCode: string
  additionalData?: Record<string, unknown>
}

type InitiatePaymentResponse = Pick<
  InitializePaystackTransactionResult,
  'reference' | 'accessCode' | 'transactionID' | 'breakdown'
>

export const paymentApi = {
  /**
   * Initiate payment for a cart
   */
  initiatePayment: async (
    paymentMethodID: string,
    options: InitiatePaymentOptions,
  ): Promise<InitiatePaymentResponse> => {
    const { cartID, cartSecret, currencyCode, additionalData } = options

    if (!cartID) {
      throw new Error('No cart is provided.')
    }

    const data = await fetchJSON(
      `${API_URL}/api/payments/${paymentMethodID}/initiate${cartSecret ? `?secret=${cartSecret}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify({
          cartID,
          currency: currencyCode,
          ...(additionalData || {}),
        }),
      },
    )

    if (data.error) {
      throw new Error(data.error)
    }

    return data as InitiatePaymentResponse
  },

  /**
   * Confirm order after payment
   */
  confirmOrder: async (
    paymentMethodID: string,
    options: ConfirmOrderOptions,
  ): Promise<{ orderID: number; message: string }> => {
    const { cartID, cartSecret, currencyCode, additionalData } = options

    if (!cartID) {
      throw new Error('Cart is empty.')
    }

    const data = await fetchJSON(
      `${API_URL}/api/payments/${paymentMethodID}/confirm-order${cartSecret ? `?secret=${cartSecret}` : ''}`,
      {
        method: 'POST',
        body: JSON.stringify({
          cartID,
          currency: currencyCode,
          ...(additionalData || {}),
        }),
      },
    )

    if (data.error) {
      throw new Error(data.error)
    }

    return data as { orderID: number; message: string }
  },
}
