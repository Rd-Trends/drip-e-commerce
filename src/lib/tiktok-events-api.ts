/**
 * TikTok Events API — server-side event tracking.
 * https://business.tiktok.com/marketing_api/docs#/docs?id=1741601162187777
 *
 * This module is server-only. Never import it in client components.
 */

import { createHash } from 'crypto'

const PIXEL_CODE = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
const ACCESS_TOKEN = process.env.TIKTOK_EVENTS_API_ACCESS_TOKEN

const TIKTOK_EVENTS_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'

function sha256(value: string): string {
  return createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

export type TikTokUserData = {
  email?: string
  phone?: string
  externalId?: string
  ip?: string
  userAgent?: string
  /** _ttp cookie value */
  ttp?: string
  /** TikTok click ID from the ttclid URL parameter */
  ttclid?: string
}

export type TikTokContent = {
  content_id: string
  content_type?: 'product' | 'product_group'
  content_name?: string
  price?: number
  quantity?: number
}

type TikTokEventInput = {
  eventName: string
  /** Re-use the same ID used in the browser pixel call for deduplication. */
  eventId?: string
  eventTime?: number
  user?: TikTokUserData
  properties?: {
    currency?: string
    value?: number
    contents?: TikTokContent[]
  }
  pageUrl?: string
}

export async function sendTikTokEvent(input: TikTokEventInput): Promise<void> {
  if (!PIXEL_CODE || !ACCESS_TOKEN) return

  const { eventName, eventId, eventTime, user = {}, properties, pageUrl } = input

  const userPayload: Record<string, unknown> = {}
  if (user.email) userPayload.email = sha256(user.email)
  if (user.phone) userPayload.phone_number = sha256(user.phone)
  if (user.externalId) userPayload.external_id = sha256(user.externalId)
  if (user.ip) userPayload.ip = user.ip
  if (user.userAgent) userPayload.user_agent = user.userAgent
  if (user.ttp) userPayload.ttp = user.ttp
  if (user.ttclid) userPayload.ttclid = user.ttclid

  // Build the event object that goes inside the data array.
  const eventData: Record<string, unknown> = {
    event: eventName,
    event_time: eventTime ?? Math.floor(Date.now() / 1000),
    user: userPayload,
    properties: properties ?? {},
  }
  if (eventId) eventData.event_id = eventId
  if (pageUrl) eventData.page = { url: pageUrl }

  // Top-level envelope — event_source_id is the pixel code.
  const body = {
    event_source: 'web',
    event_source_id: PIXEL_CODE,
    data: [eventData],
  }

  const res = await fetch(TIKTOK_EVENTS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Access-Token': ACCESS_TOKEN,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`TikTok Events API error ${res.status}: ${text}`)
  }

  const json = (await res.json()) as { code: number; message: string }
  if (json.code !== 0) {
    throw new Error(`TikTok Events API returned code ${json.code}: ${json.message}`)
  }
}

// ─── Typed helpers ───────────────────────────────────────────────────────────

export async function sendTikTokPurchase(options: {
  eventId?: string
  value: number
  currency: string
  contents: TikTokContent[]
  user?: TikTokUserData
  pageUrl?: string
}): Promise<void> {
  return sendTikTokEvent({
    eventName: 'Purchase',
    eventId: options.eventId,
    user: options.user,
    properties: {
      value: options.value,
      currency: options.currency,
      contents: options.contents,
    },
    pageUrl: options.pageUrl,
  })
}

export async function sendTikTokViewContent(options: {
  eventId?: string
  contentId: string
  contentName: string
  price: number
  value: number
  currency: string
  user?: TikTokUserData
  pageUrl?: string
}): Promise<void> {
  return sendTikTokEvent({
    eventName: 'ViewContent',
    eventId: options.eventId,
    user: options.user,
    properties: {
      value: options.value,
      currency: options.currency,
      contents: [
        {
          content_id: options.contentId,
          content_type: 'product',
          content_name: options.contentName,
          price: options.price,
          quantity: 1,
        },
      ],
    },
    pageUrl: options.pageUrl,
  })
}

export async function sendTikTokAddToCart(options: {
  eventId?: string
  contentId: string
  contentName: string
  price: number
  value: number
  currency: string
  quantity: number
  user?: TikTokUserData
  pageUrl?: string
}): Promise<void> {
  return sendTikTokEvent({
    eventName: 'AddToCart',
    eventId: options.eventId,
    user: options.user,
    properties: {
      value: options.value,
      currency: options.currency,
      contents: [
        {
          content_id: options.contentId,
          content_type: 'product',
          content_name: options.contentName,
          price: options.price,
          quantity: options.quantity,
        },
      ],
    },
    pageUrl: options.pageUrl,
  })
}

export async function sendTikTokInitiateCheckout(options: {
  eventId?: string
  contents: TikTokContent[]
  value: number
  currency: string
  user?: TikTokUserData
  pageUrl?: string
}): Promise<void> {
  return sendTikTokEvent({
    eventName: 'InitiateCheckout',
    eventId: options.eventId,
    user: options.user,
    properties: {
      value: options.value,
      currency: options.currency,
      contents: options.contents,
    },
    pageUrl: options.pageUrl,
  })
}
