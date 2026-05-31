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
  const pathname = window.location.pathname
  console.log('Tracking TikTok pageview:', pathname)
  window.ttq.page()
}

const track = (name: string, params: Record<string, unknown> = {}) => {
  if (!TIKTOK_PIXEL_ID) return
  if (typeof window.ttq?.track !== 'function') return
  console.log('Tracking TikTok event:', name, params)
  window.ttq.track(name, params)
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
}) => {
  track('ViewContent', {
    contents: [
      {
        content_id: options.content_id,
        content_type: options.content_type,
        content_name: options.content_name,
        price: options.price,
      },
    ],
    value: options.value,
    currency: options.currency,
  })
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
}) => {
  track('AddToCart', {
    contents: [
      {
        content_id: options.content_id,
        content_type: options.content_type,
        content_name: options.content_name,
        price: options.price,
        num_items: options.quantity,
      },
    ],
    value: options.value,
    currency: options.currency,
  })
}

export const initiateCheckout = (options: {
  contents: Array<{ content_id: string; num_items: number }>
  value: number
  currency: string
}) => {
  track('InitiateCheckout', {
    contents: options.contents,
    value: options.value,
    currency: options.currency,
  })
}

export const purchase = (options: {
  contents: Array<{ content_id: string; num_items: number }>
  value: number
  currency: string
}) => {
  track('Purchase', {
    contents: options.contents,
    value: options.value,
    currency: options.currency,
  })
}
