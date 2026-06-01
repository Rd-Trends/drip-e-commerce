/**
 * Unified analytics pixel module.
 *
 * One call fires:
 *   1. Facebook browser pixel  (fbq)
 *   2. TikTok browser pixel    (ttq)
 *   3. Server-side relay       (POST /api/events → FB CAPI + TikTok Events API)
 *
 * All event names are standard on both platforms, so no mapping is needed.
 *
 * This module is client-only — never import it in server components or
 * Payload hooks. For server-side Purchase events see:
 * src/endpoints/paystack/confirm/analytics.ts
 */

import * as fb from '@/lib/facebook-pixel'
import * as tt from '@/lib/tiktok-pixel'

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserData = {
  email?: string
  /** Any unique user ID (e.g. Payload user ID). */
  externalId?: string
}

type CartItem = {
  contentId: string
  quantity: number
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Relay the event to the server so FB CAPI and TikTok Events API fire with
 * the same eventId for server-side deduplication.
 * Fire-and-forget — never blocks the UI.
 */
function relay(payload: Record<string, unknown>): void {
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      pageUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    }),
  }).catch((err) => console.error('[pixel] server relay failed:', err))
}

/**
 * Call TikTok browser identify for advanced matching.
 * Fire-and-forget — the async SHA-256 hash runs in the background.
 * The server relay already sends hashed user data, so this is supplementary.
 */
function identifyTikTok(userData: UserData): void {
  tt.identify({ email: userData.email, externalId: userData.externalId }).catch(() => {})
}

// ─── Events ───────────────────────────────────────────────────────────────────

/**
 * Fire a PageView on both platforms.
 * Called by the analytics provider on every route change.
 * No server relay — PageView volume is too high for CAPI.
 */
export function pageView(): void {
  fb.pageview()
  tt.pageview()
}

/**
 * Fire a ViewContent event on both platforms + server relay.
 */
export function viewContent(options: {
  contentId: string
  contentName: string
  /** Price in primary currency unit (naira, not kobo). */
  value: number
  currency?: string
  userData?: UserData
}): void {
  const { contentId, contentName, value, currency = 'NGN', userData } = options
  const eventId = crypto.randomUUID()

  if (userData) identifyTikTok(userData)

  fb.viewContent({
    content_ids: [contentId],
    content_name: contentName,
    content_type: 'product',
    value,
    currency,
    eventId,
  })
  tt.viewContent({
    content_id: contentId,
    content_name: contentName,
    content_type: 'product',
    price: value,
    value,
    currency,
    eventId,
  })

  relay({
    event: 'ViewContent',
    eventId,
    contentId,
    contentName,
    value,
    currency,
    price: value,
    userData,
  })
}

/**
 * Fire an AddToCart event on both platforms + server relay.
 */
export function addToCart(options: {
  contentId: string
  contentName: string
  /** Price in primary currency unit (naira, not kobo). */
  value: number
  currency?: string
  quantity?: number
  userData?: UserData
}): void {
  const { contentId, contentName, value, currency = 'NGN', quantity = 1, userData } = options
  const eventId = crypto.randomUUID()

  if (userData) identifyTikTok(userData)

  fb.addToCartEvent({
    content_ids: [contentId],
    content_name: contentName,
    content_type: 'product',
    value,
    currency,
    eventId,
  })
  tt.addToCartEvent({
    content_id: contentId,
    content_name: contentName,
    content_type: 'product',
    price: value,
    value,
    currency,
    quantity,
    eventId,
  })

  relay({
    event: 'AddToCart',
    eventId,
    contentId,
    contentName,
    value,
    currency,
    price: value,
    quantity,
    userData,
  })
}

/**
 * Fire an InitiateCheckout event on both platforms + server relay.
 */
export function initiateCheckout(options: {
  contents: CartItem[]
  /** Cart total in primary currency unit (naira, not kobo). */
  value: number
  currency?: string
  userData?: UserData
}): void {
  const { contents, value, currency = 'NGN', userData } = options
  const eventId = crypto.randomUUID()

  if (userData) identifyTikTok(userData)

  const contentIds = contents.map((c) => c.contentId)
  const numItems = contents.reduce((acc, c) => acc + c.quantity, 0)
  const fbContents = contents.map((c) => ({ id: c.contentId, quantity: c.quantity }))
  const ttContents = contents.map((c) => ({ content_id: c.contentId, num_items: c.quantity }))

  fb.initiateCheckout({
    content_ids: contentIds,
    num_items: numItems,
    value,
    currency,
    eventId,
    contents: fbContents,
  })
  tt.initiateCheckout({ contents: ttContents, value, currency, eventId })

  relay({
    event: 'InitiateCheckout',
    eventId,
    contentIds,
    numItems,
    value,
    currency,
    contents: ttContents,
    userData,
  })
}

/**
 * Fire a Purchase event on both platforms.
 *
 * The server-side CAPI Purchase is fired separately from `processOrderConfirmation`
 * using the same `eventId` (order ID) so both platforms can deduplicate.
 */
export function purchase(options: {
  contents: CartItem[]
  /** Order total in primary currency unit (naira, not kobo). */
  value: number
  currency?: string
  /**
   * Use the confirmed order ID so the browser pixel and server CAPI events
   * share the same event_id and are deduplicated by Facebook / TikTok.
   */
  eventId: string
  userData?: UserData
}): void {
  const { contents, value, currency = 'NGN', eventId, userData } = options

  if (userData) identifyTikTok(userData)

  const contentIds = contents.map((c) => c.contentId)
  const numItems = contents.reduce((acc, c) => acc + c.quantity, 0)
  const fbContents = contents.map((c) => ({ id: c.contentId, quantity: c.quantity }))
  const ttContents = contents.map((c) => ({ content_id: c.contentId, num_items: c.quantity }))

  fb.purchase({
    content_ids: contentIds,
    num_items: numItems,
    value,
    currency,
    eventId,
    contents: fbContents,
  })
  tt.purchase({ contents: ttContents, value, currency, eventId })
  // No relay here — server CAPI fires from processOrderConfirmation with the same eventId.
}
