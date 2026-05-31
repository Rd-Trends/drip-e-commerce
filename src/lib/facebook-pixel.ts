export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID

// fbq commands: 'track', 'trackCustom', 'init', 'consent'
// Note: 'PageView', 'ViewContent' etc. are event names, not commands
type FbqCommand = 'track' | 'trackCustom' | 'init' | 'consent'

declare global {
  interface Window {
    // The 4th argument carries the eventID used for server-side deduplication.
    fbq: (
      command: FbqCommand,
      eventName: string,
      options?: Record<string, unknown>,
      extraInfo?: { eventID?: string },
    ) => void
  }
}

export const pageview = () => {
  if (!FB_PIXEL_ID) return
  window.fbq('track', 'PageView')
}

export const event = (name: string, options: Record<string, unknown> = {}, eventId?: string) => {
  if (!FB_PIXEL_ID) return
  if (typeof window.fbq !== 'function') return // pixel script not loaded yet
  window.fbq('track', name, options, eventId ? { eventID: eventId } : undefined)
}

export const viewContent = (options: {
  content_ids: string[]
  content_name: string
  content_type: 'product'
  /** Price in primary currency unit (naira, not kobo) */
  value: number
  currency: string
  eventId?: string
}) => {
  const { eventId, ...data } = options
  event('ViewContent', data, eventId)
}

export const addToCartEvent = (options: {
  content_ids: string[]
  content_name: string
  content_type: 'product'
  /** Price in primary currency unit (naira, not kobo) */
  value: number
  currency: string
  eventId?: string
}) => {
  const { eventId, ...data } = options
  event('AddToCart', data, eventId)
}

export const initiateCheckout = (options: {
  content_ids: string[]
  num_items: number
  /** Total in primary currency unit (naira, not kobo) */
  value: number
  currency: string
  eventId?: string
}) => {
  const { eventId, ...data } = options
  event('InitiateCheckout', data, eventId)
}

export const purchase = (options: {
  /** Total in primary currency unit (naira, not kobo) */
  value: number
  currency: string
  content_ids: string[]
  num_items: number
  /** Order ID — pass this so the server-side CAPI call can deduplicate. */
  eventId?: string
}) => {
  const { eventId, ...data } = options
  event('Purchase', data, eventId)
}
