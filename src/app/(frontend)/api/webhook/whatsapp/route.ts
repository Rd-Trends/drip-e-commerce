/**
 * WhatsApp Webhook Route
 *
 * Handles inbound messages from Meta's WhatsApp Cloud API to facilitate
 * product creation via chat. Admins send product details and images; when
 * they type a confirmation keyword, a background job handles AI extraction
 * and draft product creation.
 *
 * File layout
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Route Handlers     — GET (Meta verification), POST (inbound messages)
 * 2. Webhook Dispatcher — processWebhook (fans out messages to handlers)
 * 3. Message Handlers   — handleTextMessage, handleImageMessage
 * 4. Security           — verifySignature
 */

import crypto from 'crypto'
import { getPayload } from 'payload'
import type { BasePayload } from 'payload'
import config from '@payload-config'
import { sendTextMessage, downloadWhatsAppImage } from '@/lib/whatsapp-api'
import type { WhatsAppWebhookPayload } from './types'
import { after } from 'next/server'
import {
  CONFIRMATION_RE,
  findPendingSession,
  normalizeMessages,
  getImageExtension,
} from '@/lib/whatsapp/utils'

// ─── Route Handlers ───────────────────────────────────────────────────────────

/**
 * GET /api/webhook/whatsapp
 * Meta webhook verification handshake — echoes the hub.challenge token.
 */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('[whatsapp] Webhook verified successfully')
    return new Response(challenge, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  console.warn('[whatsapp] Webhook verification failed — token mismatch')
  return new Response('Forbidden', { status: 403 })
}

/**
 * POST /api/webhook/whatsapp
 * Receives inbound messages from Meta. Validates the signature, then hands
 * off to `processWebhook` via `after()` so Meta gets an immediate 200.
 */
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text()

  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    console.warn('[whatsapp] Rejected request with invalid signature')
    return new Response('Unauthorized', { status: 401 })
  }

  let body: WhatsAppWebhookPayload
  try {
    body = JSON.parse(rawBody) as WhatsAppWebhookPayload
  } catch {
    console.error('[whatsapp] Failed to parse webhook body')
    return new Response('OK', { status: 200 })
  }

  // Schedule lightweight dispatch after the 200 response is sent
  after(async () => {
    await processWebhook(body)
  })

  return new Response('OK', { status: 200 })
}

// ─── Webhook Dispatcher ───────────────────────────────────────────────────────

/**
 * Fans out all messages in a webhook payload to the appropriate handler.
 * Runs after the 200 response has already been sent to Meta.
 */
async function processWebhook(body: WhatsAppWebhookPayload): Promise<void> {
  const payload = await getPayload({ config })

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      if (!value?.messages) continue

      const contacts = value.contacts ?? []

      console.log(value.messages)

      for (const message of value.messages) {
        if (message.type !== 'text' && message.type !== 'image') continue

        const contact = contacts.find((c) => c.wa_id === message.from) ?? {
          profile: { name: 'Customer' },
          wa_id: message.from,
        }

        const phone = message.from
        const senderName = contact.profile.name

        try {
          if (message.type === 'text' && message.text?.body) {
            await handleTextMessage({
              payload,
              phone,
              senderName,
              textBody: message.text.body,
              req,
            })
          } else if (message.type === 'image' && message.image?.id) {
            await handleImageMessage({
              payload,
              phone,
              senderName,
              imageId: message.image.id,
              mimeType: message.image.mime_type ?? 'image/jpeg',
              caption: message.image.caption,
              req,
            })
          }
        } catch (err) {
          payload.logger.error(err, `[whatsapp] unhandled ${message.type} error for ${message.id}`)
        }
      }
    }
  }
}

// ─── Message Handlers ─────────────────────────────────────────────────────────

/**
 * Handles an inbound text message:
 * - Confirmation keyword  → queue a background job to process the session.
 * - Any other text        → append to the pending session (or open a new one).
 */
async function handleTextMessage(params: {
  payload: BasePayload
  phone: string
  senderName: string
  textBody: string
  req: Request
}): Promise<void> {
  const { payload, phone, senderName, textBody } = params
  const trimmed = textBody.trim()
  const isKeyword = CONFIRMATION_RE.test(trimmed)

  const session = await findPendingSession(payload, phone)

  // ── Confirmation keyword → queue background job ───────────────────────────
  if (isKeyword) {
    if (!session) {
      await sendTextMessage(
        phone,
        '🤷 No product info to process. Send your product details and images first, then type *done* when ready.',
      )
      return
    }

    // Queue the heavy processing as a background job
    await payload.jobs.queue({
      task: 'processWhatsappSession',
      input: { sessionId: session.id, phone },
      queue: 'whatsapp',
    })

    // Immediately trigger the job runner so the user doesn't wait for the cron
    payload.jobs
      .run({ queue: 'whatsapp', limit: 1 })
      .catch((err) => payload.logger.error(err, '[whatsapp] Failed to trigger job runner'))

    return
  }

  // ── Regular text → accumulate into pending session ─────────────────────────
  if (session) {
    const existing = normalizeMessages(session.messages ?? [])
    await payload.update({
      collection: 'whatsapp-sessions',
      id: session.id,
      data: { messages: [...existing, { type: 'text', text: trimmed }] },
      req,
    })
  } else {
    await payload.create({
      collection: 'whatsapp-sessions',
      data: {
        phone,
        senderName,
        status: 'pending',
        messages: [{ type: 'text', text: trimmed }],
      },
      req,
    })
    await sendTextMessage(
      phone,
      `📝 Got it, ${senderName}! Keep sending your product details and images.\n\nWhen you're ready, type *done* to create the product.`,
    )
  }
}

/**
 * Handles an inbound image message:
 * - Downloads the image from WhatsApp CDN (time-sensitive — URLs expire).
 * - Uploads to the Payload `media` collection (S3-backed).
 * - Appends to a pending session (or creates a new one).
 */
async function handleImageMessage(params: {
  payload: BasePayload
  phone: string
  senderName: string
  imageId: string
  mimeType: string
  caption?: string
  req: Request
}): Promise<void> {
  const { payload, phone, senderName, imageId, mimeType, caption } = params

  // 1. Download from WhatsApp CDN — must happen immediately (URLs expire in ~5 min)
  const imageBuffer = await downloadWhatsAppImage(imageId, mimeType)
  if (!imageBuffer) {
    await sendTextMessage(phone, "⚠️ Sorry, we couldn't download the image, please try again.")
    return
  }

  const extension = getImageExtension(mimeType)

  // 2. Upload to Payload media collection (S3-backed)
  const mediaDoc = await payload.create({
    collection: 'media',
    data: { alt: 'Drip fashion product image' },
    file: {
      data: imageBuffer,
      mimetype: mimeType,
      name: `drip-fashion-product-${Date.now()}.${extension}`,
      size: imageBuffer.length,
    },
    req,
  })

  if (!mediaDoc.id) {
    await sendTextMessage(phone, '⚠️ Sorry, we failed to save the image, please try again.')
    return
  }

  // 3. Build message entry — image reference + optional caption as text
  const imageMessage = {
    type: 'image' as const,
    text: caption || undefined,
    image: mediaDoc.id,
  }

  // 4. Append to pending session or open a new one
  const session = await findPendingSession(payload, phone)

  if (session) {
    const existing = normalizeMessages(session.messages ?? [])
    const updatedMessages = [...existing, imageMessage]
    await payload.update(
      {
        collection: 'whatsapp-sessions',
        id: session.id,
        data: { messages: updatedMessages },
      },
      req,
    )
    const total = updatedMessages.length
    await sendTextMessage(phone, `📸 Message ${total}/${total} processed`)
  } else {
    await payload.create({
      collection: 'whatsapp-sessions',
      data: {
        phone,
        senderName,
        status: 'pending',
        messages: [imageMessage],
      },
      req,
    })
    await sendTextMessage(
      phone,
      `📸 Got your image, ${senderName}! Keep sending your product details and images.\n\nWhen you're ready, type *done* to create the product.`,
    )
  }
}

// ─── Security ─────────────────────────────────────────────────────────────────

/**
 * Verifies that a request genuinely originated from Meta by comparing the
 * `x-hub-signature-256` header against an HMAC-SHA256 digest of the raw body
 * signed with the app secret.
 *
 * Uses `timingSafeEqual` to prevent timing-based side-channel attacks.
 */
function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET

  if (!secret) {
    console.error('[whatsapp] WHATSAPP_APP_SECRET is not set — cannot verify signature')
    return false
  }

  if (!signatureHeader?.startsWith('sha256=')) {
    console.warn('[whatsapp] Missing or malformed x-hub-signature-256 header')
    return false
  }

  const receivedHex = signatureHeader.slice('sha256='.length)
  const expectedHex = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')

  if (receivedHex.length !== expectedHex.length) return false

  try {
    return crypto.timingSafeEqual(Buffer.from(receivedHex, 'hex'), Buffer.from(expectedHex, 'hex'))
  } catch {
    return false
  }
}
