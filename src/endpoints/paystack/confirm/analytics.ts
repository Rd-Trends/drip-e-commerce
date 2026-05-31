/**
 * Fires server-side Purchase analytics events (FB CAPI + TikTok Events API)
 * after a successful order confirmation.
 *
 * Uses Promise.allSettled so a failure in one platform never blocks the other.
 */

import { sendFBPurchase } from '@/lib/facebook-capi'
import { sendTikTokPurchase } from '@/lib/tiktok-events-api'
import { Order } from '@/payload-types'
import { PayloadRequest } from 'payload'

/** Extract a single named cookie from a raw Cookie header string. */
function extractCookie(cookieHeader: string, name: string): string | undefined {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]!) : undefined
}

export async function sendPurchaseAnalytics(
  order: Order,
  req: PayloadRequest,
  source: 'client' | 'webhook',
): Promise<void> {
  // Only read browser-specific headers from client-initiated confirmations.
  const isClientRequest = source === 'client'
  const ip = isClientRequest
    ? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      undefined
    : undefined
  const userAgent = isClientRequest ? req.headers.get('user-agent') || undefined : undefined

  const cookieHeader = isClientRequest ? req.headers.get('cookie') || '' : ''
  const fbp = extractCookie(cookieHeader, '_fbp')
  const fbc = extractCookie(cookieHeader, '_fbc')
  const ttp = extractCookie(cookieHeader, '_ttp')
  const ttclid = extractCookie(cookieHeader, 'ttclid')

  const customer = typeof order.customer === 'object' ? order.customer : null
  const customerEmail = customer?.email || order.customerEmail || undefined
  const externalId = customer?.id != null ? String(customer.id) : undefined

  const contentIds =
    order.items
      ?.map((item) => {
        const prod = item.product
        if (!prod) return null
        return typeof prod === 'object' ? String(prod.id) : String(prod)
      })
      .filter((id): id is string => id !== null) ?? []

  // Build the richer per-item contents array (id + quantity) for FB CAPI.
  const fbContents =
    order.items
      ?.map((item) => {
        const prod = item.product
        if (!prod) return null
        const id = typeof prod === 'object' ? String(prod.id) : String(prod)
        return { id, quantity: item.quantity || 1 }
      })
      .filter((c): c is NonNullable<typeof c> => c !== null) ?? []

  const numItems = order.items?.reduce((acc, item) => acc + (item.quantity || 1), 0) ?? 0

  // grandTotal is stored in the smallest currency unit (kobo); convert to naira.
  const value = (order.grandTotal || 0) / 100

  // Use the order ID as the event_id — the client-side pixel also uses this
  // value so Facebook / TikTok can deduplicate across both signals.
  const eventId = String(order.id)

  const pageUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/checkout`

  const results = await Promise.allSettled([
    sendFBPurchase({
      eventId,
      value,
      currency: 'NGN',
      contentIds,
      contents: fbContents,
      numItems,
      userData: {
        email: customerEmail,
        externalId,
        clientIpAddress: ip,
        clientUserAgent: userAgent,
        fbp,
        fbc,
      },
      pageUrl,
    }),
    sendTikTokPurchase({
      eventId,
      value,
      currency: 'NGN',
      contents:
        order.items
          ?.map((item) => {
            const prod = item.product
            if (!prod) return null
            const id = typeof prod === 'object' ? String(prod.id) : String(prod)
            return {
              content_id: id,
              content_type: 'product' as const,
              quantity: item.quantity || 1,
            }
          })
          .filter((c): c is NonNullable<typeof c> => c !== null) ?? [],
      user: {
        email: customerEmail,
        externalId,
        ip,
        userAgent,
        ttp,
        ttclid,
      },
      pageUrl,
    }),
  ])

  for (const result of results) {
    if (result.status === 'rejected') {
      req.payload.logger.error({ msg: 'Purchase analytics event failed', err: result.reason })
    }
  }
}
