export const TIKTOK_PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

declare global {
  interface Window {
    ttq: {
      page: () => void
      track: (
        event: string,
        params?: Record<string, unknown>,
        // 3rd arg carries event_id for server-side deduplication.
        options?: { event_id?: string },
      ) => void
      identify: (params: Record<string, unknown>) => void
      load: (pixelId: string) => void
      instance: (pixelId: string) => Window['ttq']
    }
  }
}

/** SHA-256 hash a string using the Web Crypto API. Returns a lowercase hex string. */
async function hashValue(value: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(value.toLowerCase().trim())
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export const pageview = () => {
  if (!TIKTOK_PIXEL_ID) return
  if (typeof window.ttq?.page !== 'function') return
  window.ttq.page()
}

const track = (name: string, params: Record<string, unknown> = {}, eventId?: string) => {
  if (!TIKTOK_PIXEL_ID) return
  if (typeof window.ttq?.track !== 'function') return
  window.ttq.track(name, params, eventId ? { event_id: eventId } : undefined)
}

/**
 * Call before event code on pages where PII data is available.
 * Hashes email, phone number and external ID with SHA-256 before sending.
 */
export const identify = async (options: {
  email?: string
  phoneNumber?: string
  /** Any unique identifier, e.g. user ID */
  externalId?: string
}) => {
  if (!TIKTOK_PIXEL_ID) return
  if (typeof window.ttq?.identify !== 'function') return

  const [hashedEmail, hashedPhone, hashedId] = await Promise.all([
    options.email ? hashValue(options.email) : undefined,
    options.phoneNumber ? hashValue(options.phoneNumber) : undefined,
    options.externalId ? hashValue(options.externalId) : undefined,
  ])

  window.ttq.identify({
    ...(hashedEmail && { email: hashedEmail }),
    ...(hashedPhone && { phone_number: hashedPhone }),
    ...(hashedId && { external_id: hashedId }),
  })
}

export const viewContent = (options: {
  content_id: string
  content_name: string
  content_type: 'product' | 'product_group'
  /** Price per item in primary currency unit (naira, not kobo) */
  price: number
  value: number
  currency: string
  eventId?: string
}) => {
  const { eventId, ...rest } = options
  track(
    'ViewContent',
    {
      contents: [
        {
          content_id: rest.content_id,
          content_type: rest.content_type,
          content_name: rest.content_name,
          price: rest.price,
        },
      ],
      value: rest.value,
      currency: rest.currency,
    },
    eventId,
  )
}

export const addToCartEvent = (options: {
  content_id: string
  content_name: string
  content_type: 'product' | 'product_group'
  /** Price per item in primary currency unit (naira, not kobo) */
  price: number
  value: number
  currency: string
  quantity: number
  eventId?: string
}) => {
  const { eventId, ...rest } = options
  track(
    'AddToCart',
    {
      contents: [
        {
          content_id: rest.content_id,
          content_type: rest.content_type,
          content_name: rest.content_name,
          price: rest.price,
          num_items: rest.quantity,
        },
      ],
      value: rest.value,
      currency: rest.currency,
    },
    eventId,
  )
}

export const initiateCheckout = (options: {
  contents: Array<{ content_id: string; num_items: number }>
  value: number
  currency: string
  eventId?: string
}) => {
  const { eventId, ...rest } = options
  track(
    'InitiateCheckout',
    {
      contents: rest.contents,
      value: rest.value,
      currency: rest.currency,
    },
    eventId,
  )
}

export const purchase = (options: {
  contents: Array<{ content_id: string; num_items: number }>
  value: number
  currency: string
  /** Order ID — pass this so the server-side Events API call can deduplicate. */
  eventId?: string
}) => {
  const { eventId, ...rest } = options
  track(
    'Purchase',
    {
      contents: rest.contents,
      value: rest.value,
      currency: rest.currency,
    },
    eventId,
  )
}
