export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

// fbq commands: 'track', 'trackCustom', 'init', 'consent'
// Note: 'PageView', 'ViewContent' etc. are event names, not commands
type FbqCommand = 'track' | 'trackCustom' | 'init' | 'consent'

declare global {
  interface Window {
    fbq: (command: FbqCommand, eventName: string, options?: Record<string, unknown>) => void
  }
}

export const pageview = () => {
  if (!FB_PIXEL_ID) return
  window.fbq('track', 'PageView')
}

export const event = (name: string, options: Record<string, unknown> = {}) => {
  if (!FB_PIXEL_ID) return
  window.fbq('track', name, options)
}

export const viewContent = (options: {
  content_ids: string[]
  content_name: string
  content_type: 'product'
  /** Price in primary currency unit (naira, not kobo) */
  value: number
  currency: string
}) => {
  event('ViewContent', options)
}

export const addToCartEvent = (options: {
  content_ids: string[]
  content_name: string
  content_type: 'product'
  /** Price in primary currency unit (naira, not kobo) */
  value: number
  currency: string
}) => {
  event('AddToCart', options)
}

export const initiateCheckout = (options: {
  content_ids: string[]
  num_items: number
  /** Total in primary currency unit (naira, not kobo) */
  value: number
  currency: string
}) => {
  event('InitiateCheckout', options)
}

export const purchase = (options: {
  /** Total in primary currency unit (naira, not kobo) */
  value: number
  currency: string
  content_ids: string[]
  num_items: number
}) => {
  event('Purchase', options)
}
