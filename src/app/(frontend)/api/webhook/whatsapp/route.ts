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
import { CONFIRMATION_RE, findPendingSession, getImageExtension } from '@/lib/whatsapp/utils'

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
    await processWebhook({ body, req: request })
  })

  return new Response('OK', { status: 200 })
}

// ─── Webhook Dispatcher ───────────────────────────────────────────────────────

/**
 * Fans out all messages in a webhook payload to the appropriate handler.
 * Runs after the 200 response has already been sent to Meta.
 */
async function processWebhook({
  body,
  req,
}: {
  body: WhatsAppWebhookPayload
  req: Request
}): Promise<void> {
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
              sourceMessageId: message.id,
              textBody: message.text.body,
              req,
            })
          } else if (message.type === 'image' && message.image?.id) {
            await handleImageMessage({
              payload,
              phone,
              senderName,
              sourceMessageId: message.id,
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
  sourceMessageId: string
  textBody: string
  req: Request
}): Promise<void> {
  const { payload, phone, senderName, sourceMessageId, textBody, req } = params
  const trimmed = textBody.trim()
  const isKeyword = CONFIRMATION_RE.test(trimmed)

  let session = await findPendingSession(payload, phone)
  let isNewConversation = false

  // ── Confirmation keyword → queue background job ───────────────────────────
  if (isKeyword) {
    if (!session) {
      await sendTextMessage(
        phone,
        '🤷 No product info to process. Send your product details and images first, then type *done* when ready.',
      ).catch((err) =>
        payload.logger.error(err, `[whatsapp] Failed to send missing-session reply for ${phone}`),
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
  if (!session) {
    try {
      session = await payload.create({
        collection: 'whatsapp-sessions',
        data: {
          phone,
          senderName,
          status: 'pending',
        },
        overrideAccess: true,
        req,
      })

      isNewConversation = true
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }

      session = await findPendingSession(payload, phone)
    }
  }

  if (!session) {
    throw new Error(`Unable to resolve pending WhatsApp conversation for ${phone}`)
  }

  try {
    await payload.create({
      collection: 'whatsapp-messages',
      data: {
        conversation: session.id,
        sourceMessageId,
        text: trimmed,
        type: 'text',
      },
      overrideAccess: true,
      req,
    })

    const existingCount = await payload.count({
      collection: 'whatsapp-messages',
      where: { conversation: { equals: session.id } },
      overrideAccess: true,
    })

    if (isNewConversation) {
      await sendTextMessage(
        phone,
        `📝 Got it, ${senderName}! Keep sending your product details and images.\n\nWhen you're ready, type *done* to create the product.`,
      ).catch((err) =>
        payload.logger.error(err, `[whatsapp] Failed to send session-start reply for ${phone}`),
      )
    } else {
      await sendTextMessage(
        phone,
        `📝Message ${existingCount.totalDocs}/${existingCount.totalDocs} processed`,
      ).catch((err) =>
        payload.logger.error(err, `[whatsapp] Failed to send message processed ${phone}`),
      )
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      payload.logger.info(`[whatsapp] Skipped duplicate inbound text ${sourceMessageId}`)
      return
    }

    throw error
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
  sourceMessageId: string
  imageId: string
  mimeType: string
  caption?: string
  req: Request
}): Promise<void> {
  const { payload, phone, senderName, sourceMessageId, imageId, mimeType, caption, req } = params
  let session = await findPendingSession(payload, phone)
  let isNewConversation = false

  if (!session) {
    try {
      session = await payload.create({
        collection: 'whatsapp-sessions',
        data: {
          phone,
          senderName,
          status: 'pending',
        },
        overrideAccess: true,
        req,
      })

      isNewConversation = true
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error
      }

      session = await findPendingSession(payload, phone)
    }
  }

  if (!session) {
    throw new Error(`Unable to resolve pending WhatsApp conversation for ${phone}`)
  }

  try {
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
      overrideAccess: true,
      req,
    })

    if (!mediaDoc.id) {
      await sendTextMessage(phone, '⚠️ Sorry, we failed to save the image, please try again.')
      return
    }

    try {
      await payload.create({
        collection: 'whatsapp-messages',
        data: {
          conversation: session.id,
          image: mediaDoc.id,
          sourceMessageId,
          text: caption || undefined,
          type: 'image',
        },
        overrideAccess: true,
        req,
      })
    } catch (error) {
      await payload
        .delete({
          collection: 'media',
          id: mediaDoc.id,
          overrideAccess: true,
          req,
        })
        .catch((cleanupErr) =>
          payload.logger.error(
            cleanupErr,
            `[whatsapp] Failed to clean up duplicate image media for ${sourceMessageId}`,
          ),
        )

      if (isUniqueConstraintError(error)) {
        payload.logger.info(`[whatsapp] Skipped duplicate inbound image ${sourceMessageId}`)
        return
      }

      throw error
    }

    const totalMessages = await payload.count({
      collection: 'whatsapp-messages',
      where: { conversation: { equals: session.id } },
      overrideAccess: true,
    })

    if (!isNewConversation) {
      await sendTextMessage(
        phone,
        `📸 Message ${totalMessages.totalDocs}/${totalMessages.totalDocs} processed`,
      ).catch((err) =>
        payload.logger.error(err, `[whatsapp] Failed to send image receipt for ${phone}`),
      )
    } else {
      await sendTextMessage(
        phone,
        `📸 Got your image, ${senderName}! Keep sending your product details and images.\n\nWhen you're ready, type *done* to create the product.`,
      ).catch((err) =>
        payload.logger.error(
          err,
          `[whatsapp] Failed to send image session-start reply for ${phone}`,
        ),
      )
    }
  } catch (error) {
    throw error
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('duplicate') || message.includes('unique')
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
