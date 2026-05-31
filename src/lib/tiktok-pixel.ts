export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

declare global {
  interface Window {
    ttq: {
      page: () => void
      track: (event: string, params?: Record<string, unknown>) => void
      identify: (params: Record<string, unknown>) => void
      load: (pixelId: string) => void
      instance: (pixelId: string) => Window['ttq']
    }
  }
}

export const pageview = () => {
  if (!TIKTOK_PIXEL_ID) return
  if (typeof window.ttq?.page !== 'function') return
  window.ttq.page()
}

export const event = (name: string, params: Record<string, unknown> = {}) => {
  if (!TIKTOK_PIXEL_ID) return
  if (typeof window.ttq?.track !== 'function') return
  window.ttq.track(name, params)
}

export const viewContent = (options: {
  content_id: string
  content_name: string
  content_type: 'product' | 'product_group'
  /** Price in primary currency unit (naira, not kobo) */
  price: number
  value: number
  currency: string
}) => {
  event('ViewContent', options)
}

export const addToCartEvent = (options: {
  content_id: string
  content_name: string
  content_type: 'product' | 'product_group'
  /** Price in primary currency unit (naira, not kobo) */
  price: number
  value: number
  currency: string
  quantity: number
}) => {
  event('AddToCart', options)
}

export const initiateCheckout = (options: {
  content_id: string[]
  /** Total in primary currency unit (naira, not kobo) */
  value: number
  currency: string
  quantity: number
}) => {
  event('InitiateCheckout', options)
}

export const completePayment = (options: {
  content_id: string[]
  /** Total in primary currency unit (naira, not kobo) */
  value: number
  currency: string
  quantity: number
}) => {
  event('CompletePayment', options)
}
