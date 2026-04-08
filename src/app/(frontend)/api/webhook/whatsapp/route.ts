import crypto from 'crypto'
import { getPayload } from 'payload'
import type { BasePayload } from 'payload'
import config from '@payload-config'
import { sendTextMessage, downloadWhatsAppImage } from '@/lib/whatsapp-api'
import { parseProductFromMessage } from '@/lib/ai/ai'
import type { Category } from '@/lib/ai/ai'
import { getServerSideURL } from '@/utils/get-url'
import type { WhatsAppWebhookPayload } from './types'
import type { Media, WhatsappSession } from '@/payload-types'
import { after } from 'next/server'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Keywords that trigger product creation (case-insensitive, trimmed). */
const CONFIRMATION_RE = /^(done|proceed|create|start\s*creating|go|finish)$/i

/** Convert plain text to Lexical rich text JSON for Payload's editor. */
function textToLexical(text: string) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  return {
    root: {
      type: 'root',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        children: [{ type: 'text', text: p.trim(), version: 1 }],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

// ─── Signature Verification ───────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Find the most recent pending session for a phone number. */
async function findPendingSession(payload: BasePayload, phone: string) {
  const result = await payload.find({
    collection: 'whatsapp-sessions',
    where: { and: [{ phone: { equals: phone } }, { status: { equals: 'pending' } }] },
    sort: '-createdAt',
    limit: 1,
  })
  return result.docs[0] ?? null
}

/**
 * Normalize existing messages array for safe appending.
 * Handles both hydrated (depth > 0) and non-hydrated (bare ID) image refs.
 */
function normalizeMessages(messages: WhatsappSession['messages']) {
  return (
    messages?.map((msg) => ({
      type: msg.type,
      text: msg.text || undefined,
      image:
        msg.type === 'image'
          ? !!msg.image && typeof msg.image === 'object'
            ? msg.image.id
            : msg.image
          : undefined,
    })) ?? []
  )
}

// ─── Session Processing ───────────────────────────────────────────────────────

/**
 * Process a pending session: run AI extraction, create draft product, notify user.
 * Called fire-and-forget when the user sends a confirmation keyword.
 */
async function processSession(params: {
  payload: BasePayload
  sessionId: number
  phone: string
}): Promise<void> {
  const { payload, sessionId, phone } = params

  try {
    // 1. Mark processing
    await payload.update({
      collection: 'whatsapp-sessions',
      id: sessionId,
      data: { status: 'processing' },
    })

    await sendTextMessage(phone, '⏳ Processing your product, please wait…')

    // 2. Re-fetch with depth: 1 to hydrate image objects
    const session = await payload.findByID({
      collection: 'whatsapp-sessions',
      id: sessionId,
      depth: 1,
    })

    // 3. Collect text (from text messages AND image captions)
    const messages = session.messages ?? []

    const allText = messages
      .filter((msg) => !!msg.text)
      .map((msg) => msg.text as string)
      .join('\n')

    // 4. Collect hydrated images
    const sessionImages = messages
      .map((message) => {
        if (message.image && typeof message.image === 'object') return message.image
        return null
      })
      .filter((item): item is Media => item !== null)
    const images = sessionImages.map((img) => ({
      id: img.id,
      url: `${getServerSideURL()}${img.url}`,
    }))

    if (!allText.trim() && images.length === 0) {
      await sendTextMessage(
        phone,
        '❌ No product details found. Please send product info and images, then type *done*.',
      )
      await payload.update({
        collection: 'whatsapp-sessions',
        id: sessionId,
        data: { status: 'failed' },
      })
      return
    }

    // 5. Fetch categories
    const categoriesResult = await payload.find({
      collection: 'categories',
      limit: 0,
      pagination: false,
      select: { title: true },
    })

    const categories: Category[] = categoriesResult.docs.map((c) => ({
      id: c.id,
      title: c.title,
    }))

    // 6. Call AI (tools handle variant type/option discovery internally)
    const parsed = await parseProductFromMessage({
      messageText: allText,
      categories,
      images,
      payload,
    })

    // 7. Process AI-selected variants (parallel per variant type)
    const needsVariants = parsed.selectedVariants?.length > 0

    const variantMap = needsVariants
      ? await Promise.all(
          parsed.selectedVariants.map(async (variant) => {
            // Create ONLY user-specified new options (in parallel)
            const newOptionIds =
              variant.newOptionLabels.length > 0
                ? await Promise.all(
                    variant.newOptionLabels.map((label) =>
                      payload
                        .create({
                          collection: 'variantOptions',
                          data: {
                            variantType: variant.variantTypeId,
                            label,
                            value: label.toLowerCase(),
                          },
                        })
                        .then((doc) => doc.id),
                    ),
                  )
                : []

            return {
              typeId: variant.variantTypeId,
              optionIds: [...variant.existingOptions.map((o) => o.id), ...newOptionIds],
              inventory: variant.inventoryPerOption,
            }
          }),
        )
      : []

    const variantTypeIds = [...new Set(variantMap.map((v) => v.typeId))]

    // 8. Create draft product
    const product = await payload.create({
      collection: 'products',
      draft: true,
      data: {
        title: parsed.title,
        description: textToLexical(parsed.description),
        priceInNGN: parsed.priceInNGN ?? 0,
        priceInNGNEnabled: true,
        enableVariants: needsVariants,
        ...(needsVariants ? { variantTypes: variantTypeIds } : {}),
        ...(!needsVariants ? { inventory: parsed.inventory ?? 1 } : {}),
        categories: parsed.categories.map((c) => c.id),
        _status: 'draft',
        gallery: images.map((img: { id: number; url: string }) => ({ image: img.id })),
        meta: {
          title: parsed.title,
          description: parsed.metaDescription,
          image: images[0]?.id ?? null,
        },
      },
    })

    // 9. Create variant docs
    if (needsVariants) {
      const optionArrays = variantMap.map((v) => v.optionIds)
      const combinations: number[][] = optionArrays.reduce<number[][]>(
        (acc, array) => acc.flatMap((x) => array.map((y) => [...x, y])),
        [[]],
      )
      const defaultInventory = Math.min(...variantMap.map((v) => v.inventory))
      const price = (parsed.priceInNGN ?? 0) * 100 //converted to kobo
      const costPrice = price //in kobo

      await Promise.all(
        combinations.map((combo) =>
          payload.create({
            collection: 'variants',
            data: {
              product: product.id,
              options: combo,
              inventory: defaultInventory,
              priceInNGN: price,
              priceInNGNEnabled: true,
              costPrice: costPrice,
              _status: 'published',
            },
          }),
        ),
      )
    }

    // 10. Update media alt text
    await Promise.allSettled(
      parsed.images
        .filter((img) => img.altText)
        .map((img) =>
          payload.update({
            collection: 'media',
            id: img.id,
            data: { alt: img.altText },
          }),
        ),
    )

    // 11. Mark done
    await payload.update({
      collection: 'whatsapp-sessions',
      id: sessionId,
      data: { status: 'done' },
    })

    // 12. Send success message
    const adminUrl = `${getServerSideURL()}/admin/collections/products/${product.id}`
    const formattedPrice = (parsed.priceInNGN ?? 0).toLocaleString('en-NG')
    const categoryNames = parsed.categories.map((c) => c.name).join(', ')

    const variantInfo = needsVariants
      ? parsed.selectedVariants
          .map((v) => {
            const allLabels = [...v.existingOptions.map((o) => o.label), ...v.newOptionLabels]
            return `📏 ${v.variantTypeName}: ${allLabels.join(', ')} (${v.inventoryPerOption} each)`
          })
          .join('\n')
      : `📦 Inventory: ${parsed.inventory ?? 1}`

    await sendTextMessage(
      phone,
      [
        '✅ Product created successfully!\n',
        `📦 *${product.title}*`,
        `💰 Price: ₦${formattedPrice}`,
        variantInfo,
        `📁 ${parsed.categories.length === 1 ? 'Category' : 'Categories'}: ${categoryNames}`,
        `📝 Status: Draft (review & publish in admin)\n`,
        `🔗 Edit in admin:`,
        adminUrl,
      ].join('\n'),
    )
  } catch (err) {
    console.error(`[whatsapp] Processing error for session ${sessionId}:`, err)
    await payload
      .update({
        collection: 'whatsapp-sessions',
        id: sessionId,
        data: { status: 'failed' },
      })
      .catch(() => {})
    await sendTextMessage(
      phone,
      '❌ Sorry, something went wrong while creating your product. Please try again by sending new product details.',
    )
  }
}

// ─── Message Handlers ─────────────────────────────────────────────────────────

/**
 * Handles an inbound text message:
 * - If it's a confirmation keyword → find pending session and trigger processing.
 * - Otherwise → accumulate text into a pending session (or create a new one).
 */
async function handleTextMessage(params: {
  payload: BasePayload
  phone: string
  senderName: string
  textBody: string
}): Promise<void> {
  const { payload, phone, senderName, textBody } = params
  const trimmed = textBody.trim()
  const isKeyword = CONFIRMATION_RE.test(trimmed)

  const session = await findPendingSession(payload, phone)

  // ── Confirmation keyword → trigger processing ─────────────────────────────
  if (isKeyword) {
    if (!session) {
      await sendTextMessage(
        phone,
        '🤷 No product info to process. Send your product details and images first, then type *done* when ready.',
      )
      return
    }
    // Fire-and-forget — processing runs in background
    processSession({ payload, sessionId: session.id, phone }).catch((err) =>
      console.error(`[whatsapp] processSession error:`, err),
    )
    return
  }

  // ── Regular text → accumulate into session ────────────────────────────────
  if (session) {
    const existing = normalizeMessages(session.messages ?? [])
    await payload.update({
      collection: 'whatsapp-sessions',
      id: session.id,
      data: { messages: [...existing, { type: 'text', text: trimmed }] },
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
    })
    await sendTextMessage(
      phone,
      `📝 Got it, ${senderName}! Keep sending your product details and images.\n\nWhen you're ready, type *done* to create the product.`,
    )
  }
}

/**
 * Handles an inbound image message:
 * - Downloads the image and uploads it to the `media` collection.
 * - Captures the optional image caption as text.
 * - Appends to a pending session or creates a new one.
 */
async function handleImageMessage(params: {
  payload: BasePayload
  phone: string
  senderName: string
  imageId: string
  mimeType: string
  caption?: string
}): Promise<void> {
  const { payload, phone, senderName, imageId, mimeType, caption } = params

  // 1. Download and upload image
  const imageBuffer = await downloadWhatsAppImage(imageId, mimeType)
  if (!imageBuffer) {
    await sendTextMessage(phone, "⚠️ Sorry, we couldn't download the image, please try again.")
    return
  }

  const mediaDoc = await payload.create({
    collection: 'media',
    data: { alt: caption || 'WhatsApp product image' },
    file: {
      data: imageBuffer,
      mimetype: mimeType,
      name: `whatsapp-${Date.now()}.${mimeType.split('/').pop()}`,
      size: imageBuffer.length,
    },
  })

  if (!mediaDoc.id) {
    await sendTextMessage(phone, '⚠️ Sorry, we failed to save the image, please try again.')
    return
  }

  // 2. Build the message entry (image + optional caption)
  const imageMessage = {
    type: 'image' as const,
    text: caption || undefined,
    image: mediaDoc.id,
  }

  // 3. Append to pending session or create a new one
  const session = await findPendingSession(payload, phone)

  if (session) {
    const existing = normalizeMessages(session.messages ?? [])
    await payload.update({
      collection: 'whatsapp-sessions',
      id: session.id,
      data: { messages: [...existing, imageMessage] },
    })
  } else {
    await payload.create({
      collection: 'whatsapp-sessions',
      data: {
        phone,
        senderName,
        status: 'pending',
        messages: [imageMessage],
      },
    })
    await sendTextMessage(
      phone,
      `📸 Got your image, ${senderName}! Keep sending your product details and images.\n\nWhen you're ready, type *done* to create the product.`,
    )
  }
}

// ─── Route Handlers ───────────────────────────────────────────────────────────

/** GET /api/webhook/whatsapp — Meta webhook verification handshake */
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

/** POST /api/webhook/whatsapp — Inbound messages from Meta */
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text()

  if (!verifySignature(rawBody, request.headers.get('x-hub-signature-256'))) {
    console.warn('[whatsapp] Rejected request with invalid signature')
    return new Response('Unauthorized', { status: 401 })
  }

  // Parse body synchronously — fast enough to do before responding
  let body: WhatsAppWebhookPayload
  try {
    body = JSON.parse(rawBody) as WhatsAppWebhookPayload
  } catch {
    console.error('[whatsapp] Failed to parse webhook body')
    return new Response('OK', { status: 200 })
  }

  // Schedule the webhook processing in the background after the response is sent
  after(async () => {
    await processWebhook(body)
  })

  // Return 200 immediately so Meta doesn't time out or retry
  return new Response('OK', { status: 200 })
}

// ─── Background Processing ────────────────────────────────────────────────────

/** Processes all inbound messages from a webhook payload. Runs after the 200 response. */
async function processWebhook(body: WhatsAppWebhookPayload): Promise<void> {
  const payload = await getPayload({ config })

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value
      if (!value?.messages) continue

      const contacts = value.contacts ?? []

      for (const message of value.messages) {
        if (message.type !== 'text' && message.type !== 'image') continue

        const contact = contacts.find((c) => c.wa_id === message.from) ?? {
          profile: { name: 'Customer' },
          wa_id: message.from,
        }

        const phone = message.from
        const senderName = contact.profile.name

        if (message.type === 'text' && message.text?.body) {
          handleTextMessage({ payload, phone, senderName, textBody: message.text.body }).catch(
            (err) => payload.logger.error(err, `[whatsapp] unhandled text error for ${message.id}`),
          )
        } else if (message.type === 'image' && message.image?.id) {
          handleImageMessage({
            payload,
            phone,
            senderName,
            imageId: message.image.id,
            mimeType: message.image.mime_type ?? 'image/jpeg',
            caption: message.image.caption,
          }).catch((err) =>
            payload.logger.error(err, `[whatsapp] unhandled image error for ${message.id}`),
          )
        }
      }
    }
  }
}
