/**
 * Facebook Conversions API (CAPI) — server-side event tracking.
 * https://developers.facebook.com/docs/marketing-api/conversions-api
 *
 * This module is server-only. Never import it in client components.
 */

import { createHash } from 'crypto'

const PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
const ACCESS_TOKEN = process.env.FB_CAPI_ACCESS_TOKEN
/** Optional. Set to enable test-event mode in the Facebook Events Manager. */
const TEST_EVENT_CODE = process.env.FB_CAPI_TEST_EVENT_CODE

const CAPI_VERSION = 'v25.0'

function sha256(value: string): string {
  return createHash('sha256').update(value.toLowerCase().trim()).digest('hex')
}

export type FBUserData = {
  email?: string
  phone?: string
  externalId?: string
  clientIpAddress?: string
  clientUserAgent?: string
  /** _fbp cookie value */
  fbp?: string
  /** _fbc cookie value */
  fbc?: string
}

/** Per-item data for custom_data.contents (richer than content_ids alone). */
type FBContentItem = {
  id: string
  quantity: number
}

type FBCustomData = {
  value?: number
  currency?: string
  /** Simple string array — kept alongside `contents` for backwards compatibility. */
  contentIds?: string[]
  /** Richer per-item format: [{ id, quantity }]. Sent as custom_data.contents. */
  contents?: FBContentItem[]
  contentName?: string
  contentType?: string
  numItems?: number
}

type FBEventInput = {
  eventName: string
  /** Re-use the same ID used in the browser pixel call for deduplication. */
  eventId?: string
  eventTime?: number
  /**
   * The URL of the page where the event occurred.
   * Required for action_source "website".
   * Sent as event_source_url.
   */
  eventSourceUrl?: string
  userData?: FBUserData
  customData?: FBCustomData
  actionSource?: string
}

export async function sendFBEvent(input: FBEventInput): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return

  const {
    eventName,
    eventId,
    eventTime,
    eventSourceUrl,
    userData = {},
    customData,
    actionSource = 'website',
  } = input

  const userDataPayload: Record<string, unknown> = {}
  if (userData.email) userDataPayload.em = [sha256(userData.email)]
  if (userData.phone) userDataPayload.ph = [sha256(userData.phone)]
  if (userData.externalId) userDataPayload.external_id = [sha256(userData.externalId)]
  if (userData.clientIpAddress) userDataPayload.client_ip_address = userData.clientIpAddress
  if (userData.clientUserAgent) userDataPayload.client_user_agent = userData.clientUserAgent
  if (userData.fbp) userDataPayload.fbp = userData.fbp
  if (userData.fbc) userDataPayload.fbc = userData.fbc

  const _eventTime = eventTime ?? Math.floor(Date.now() / 1000)

  const eventData: Record<string, unknown> = {
    event_name: eventName,
    event_time: _eventTime,
    action_source: actionSource,
    user_data: userDataPayload,
    original_event_data: {
      event_name: eventName,
      event_time: _eventTime,
    },
  }
  if (eventId) eventData.event_id = eventId
  if (eventSourceUrl) eventData.event_source_url = eventSourceUrl

  if (customData) {
    const cd: Record<string, unknown> = {}
    if (customData.value !== undefined) cd.value = customData.value
    if (customData.currency) cd.currency = customData.currency
    if (customData.contentIds?.length) cd.content_ids = customData.contentIds
    // Richer per-item format — send alongside content_ids for max match quality.
    if (customData.contents?.length) {
      cd.contents = customData.contents.map((c) => ({ id: c.id, quantity: c.quantity }))
    }
    if (customData.contentName) cd.content_name = customData.contentName
    if (customData.contentType) cd.content_type = customData.contentType
    if (customData.numItems !== undefined) cd.num_items = customData.numItems
    eventData.custom_data = cd
  }

  const body: Record<string, unknown> = { data: [eventData] }
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE

  const url = `https://graph.facebook.com/${CAPI_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(ACCESS_TOKEN)}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`FB CAPI error ${res.status}: ${text}`)
  }
}

// ─── Typed helpers ────────────────────────────────────────────────────────────

export async function sendFBPurchase(options: {
  eventId?: string
  value: number
  currency: string
  contentIds: string[]
  /** Per-item quantities — used to build the richer custom_data.contents array. */
  contents?: FBContentItem[]
  numItems: number
  userData?: FBUserData
  pageUrl?: string
}): Promise<void> {
  return sendFBEvent({
    eventName: 'Purchase',
    eventId: options.eventId,
    eventSourceUrl: options.pageUrl,
    userData: options.userData,
    customData: {
      value: options.value,
      currency: options.currency,
      contentIds: options.contentIds,
      contents: options.contents,
      contentType: 'product',
      numItems: options.numItems,
    },
  })
}

export async function sendFBViewContent(options: {
  eventId?: string
  contentIds: string[]
  contentName: string
  value: number
  currency: string
  userData?: FBUserData
  pageUrl?: string
}): Promise<void> {
  return sendFBEvent({
    eventName: 'ViewContent',
    eventId: options.eventId,
    eventSourceUrl: options.pageUrl,
    userData: options.userData,
    customData: {
      contentIds: options.contentIds,
      // Single-product ViewContent: quantity is always 1.
      contents: options.contentIds.map((id) => ({ id, quantity: 1 })),
      contentName: options.contentName,
      contentType: 'product',
      value: options.value,
      currency: options.currency,
    },
  })
}

export async function sendFBAddToCart(options: {
  eventId?: string
  contentIds: string[]
  contentName: string
  value: number
  currency: string
  quantity?: number
  userData?: FBUserData
  pageUrl?: string
}): Promise<void> {
  return sendFBEvent({
    eventName: 'AddToCart',
    eventId: options.eventId,
    eventSourceUrl: options.pageUrl,
    userData: options.userData,
    customData: {
      contentIds: options.contentIds,
      contents: options.contentIds.map((id) => ({ id, quantity: options.quantity ?? 1 })),
      contentName: options.contentName,
      contentType: 'product',
      value: options.value,
      currency: options.currency,
    },
  })
}

export async function sendFBInitiateCheckout(options: {
  eventId?: string
  contentIds: string[]
  /** Per-item quantities for the richer contents array. */
  contents?: FBContentItem[]
  numItems: number
  value: number
  currency: string
  userData?: FBUserData
  pageUrl?: string
}): Promise<void> {
  return sendFBEvent({
    eventName: 'InitiateCheckout',
    eventId: options.eventId,
    eventSourceUrl: options.pageUrl,
    userData: options.userData,
    customData: {
      contentIds: options.contentIds,
      contents: options.contents,
      contentType: 'product',
      numItems: options.numItems,
      value: options.value,
      currency: options.currency,
    },
  })
}
