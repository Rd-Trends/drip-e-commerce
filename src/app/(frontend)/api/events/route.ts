/**
 * POST /api/events
 *
 * Server-side relay for client-triggered analytics events.
 * The browser fires the client-side pixel and simultaneously calls this route
 * with the same eventId so both signals can be deduplicated by Facebook and
 * TikTok.
 *
 * Supported events: ViewContent | AddToCart | InitiateCheckout
 * Purchase events are handled exclusively in the Paystack confirm flow.
 */

import { sendFBAddToCart, sendFBInitiateCheckout, sendFBViewContent } from '@/lib/facebook-capi'
import {
  sendTikTokAddToCart,
  sendTikTokInitiateCheckout,
  sendTikTokViewContent,
} from '@/lib/tiktok-events-api'
import { NextRequest, NextResponse } from 'next/server'

type EventBody = {
  event: 'ViewContent' | 'AddToCart' | 'InitiateCheckout'
  eventId: string
  userData?: {
    email?: string
    externalId?: string
  }
  contentId?: string
  contentIds?: string[]
  contentName?: string
  value: number
  currency: string
  numItems?: number
  price?: number
  quantity?: number
  contents?: Array<{
    content_id: string
    num_items: number
    price?: number
    content_name?: string
  }>
  pageUrl?: string
}

const ALLOWED_EVENTS = new Set(['ViewContent', 'AddToCart', 'InitiateCheckout'])

export async function POST(req: NextRequest) {
  let body: EventBody
  try {
    body = (await req.json()) as EventBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!ALLOWED_EVENTS.has(body.event)) {
    return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  }

  // ── Browser context extracted server-side ──────────────────────────────────
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined
  const userAgent = req.headers.get('user-agent') || undefined

  const fbp = req.cookies.get('_fbp')?.value
  const fbc = req.cookies.get('_fbc')?.value
  const ttp = req.cookies.get('_ttp')?.value
  const ttclid = req.cookies.get('ttclid')?.value

  const { event, eventId, userData, pageUrl, value, currency } = body

  const fbUserData = {
    email: userData?.email,
    externalId: userData?.externalId,
    clientIpAddress: ip,
    clientUserAgent: userAgent,
    fbp,
    fbc,
  }

  const ttUserData = {
    email: userData?.email,
    externalId: userData?.externalId,
    ip,
    userAgent,
    ttp,
    ttclid,
  }

  // One check per event — both platforms fired together inside each branch.
  let promises: Promise<void>[]

  if (event === 'ViewContent') {
    const contentIds = body.contentIds ?? (body.contentId ? [body.contentId] : [])
    promises = [
      sendFBViewContent({
        eventId,
        contentIds,
        contentName: body.contentName ?? '',
        value,
        currency,
        userData: fbUserData,
        pageUrl,
      }),
      sendTikTokViewContent({
        eventId,
        contentId: body.contentId ?? contentIds[0] ?? '',
        contentName: body.contentName ?? '',
        price: body.price ?? value,
        value,
        currency,
        user: ttUserData,
        pageUrl,
      }),
    ]
  } else if (event === 'AddToCart') {
    const contentIds = body.contentIds ?? (body.contentId ? [body.contentId] : [])
    promises = [
      sendFBAddToCart({
        eventId,
        contentIds,
        contentName: body.contentName ?? '',
        value,
        currency,
        quantity: body.quantity ?? 1,
        userData: fbUserData,
        pageUrl,
      }),
      sendTikTokAddToCart({
        eventId,
        contentId: body.contentId ?? contentIds[0] ?? '',
        contentName: body.contentName ?? '',
        price: body.price ?? value,
        value,
        currency,
        quantity: body.quantity ?? 1,
        user: ttUserData,
        pageUrl,
      }),
    ]
  } else {
    // InitiateCheckout
    const contentIds = body.contentIds ?? body.contents?.map((c) => c.content_id) ?? []
    const numItems = body.numItems ?? body.contents?.reduce((a, c) => a + c.num_items, 0) ?? 0
    const fbContents =
      body.contents?.map((c) => ({ id: c.content_id, quantity: c.num_items })) ?? []
    const ttContents =
      body.contents?.map((c) => ({
        content_id: c.content_id,
        content_type: 'product' as const,
        content_name: c.content_name,
        price: c.price,
        quantity: c.num_items,
      })) ?? []
    promises = [
      sendFBInitiateCheckout({
        eventId,
        contentIds,
        contents: fbContents,
        numItems,
        value,
        currency,
        userData: fbUserData,
        pageUrl,
      }),
      sendTikTokInitiateCheckout({
        eventId,
        contents: ttContents,
        value,
        currency,
        user: ttUserData,
        pageUrl,
      }),
    ]
  }

  const results = await Promise.allSettled(promises)
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[/api/events] Analytics error:', result.reason)
    }
  }

  return NextResponse.json({ ok: true })
}
