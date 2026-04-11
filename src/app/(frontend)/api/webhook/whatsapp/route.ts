/**
 * WhatsApp Webhook Route
 *
 * Handles inbound messages from Meta's WhatsApp Cloud API to facilitate
 * product creation via chat. Admins send product details and images; when
 * they type a confirmation keyword, an AI extracts structured product data
 * and creates a draft product in the CMS.
 *
 * File layout
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Constants          — regex triggers, markup defaults
 * 2. Route Handlers     — GET (Meta verification), POST (inbound messages)
 * 3. Background Worker  — processWebhook
 * 4. Message Handlers   — handleTextMessage, handleImageMessage
 * 5. Session Processing — processSession (AI extraction + product creation)
 * 6. Session Helpers    — findPendingSession, normalizeMessages
 * 7. Utilities          — textToLexical, verifySignature
 */

import crypto from 'crypto'
import { getPayload } from 'payload'
import type { BasePayload } from 'payload'
import config from '@payload-config'
import { sendTextMessage, downloadWhatsAppImage } from '@/lib/whatsapp-api'
import { parseProductFromMessage, groupImagesByProduct } from '@/lib/ai/ai'
import type { Category } from '@/lib/ai/ai'
import { getServerSideURL } from '@/utils/get-url'
import type { WhatsAppWebhookPayload } from './types'
import type { Media, WhatsappSession } from '@/payload-types'
import { after } from 'next/server'
import { formatCurrency } from '@/utils/format-currency'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Keywords that trigger product creation (case-insensitive, trimmed). */
const CONFIRMATION_RE = /^(done|proceed|create|start\s*creating|go|finish)$/i

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

  // Schedule processing after the 200 response is sent so Meta never times out
  after(async () => {
    await processWebhook(body, request)
  })

  return new Response('OK', { status: 200 })
}

// ─── Background Worker ────────────────────────────────────────────────────────

/**
 * Fans out all messages in a webhook payload to the appropriate handler.
 * Runs after the 200 response has already been sent to Meta.
 *
 * Each message is dispatched concurrently; per-message errors are logged
 * without failing the entire batch.
 */
async function processWebhook(body: WhatsAppWebhookPayload, req: Request): Promise<void> {
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
          handleTextMessage({ payload, phone, senderName, textBody: message.text.body, req }).catch(
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
            req,
          }).catch((err) =>
            payload.logger.error(err, `[whatsapp] unhandled image error for ${message.id}`),
          )
        }
      }
    }
  }
}

// ─── Message Handlers ─────────────────────────────────────────────────────────

/**
 * Handles an inbound text message:
 * - Confirmation keyword  → locate the pending session and trigger processing.
 * - Any other text        → append to the pending session (or open a new one).
 */
async function handleTextMessage(params: {
  payload: BasePayload
  phone: string
  senderName: string
  textBody: string
  req: Request
}): Promise<void> {
  const { payload, phone, senderName, textBody, req } = params
  const trimmed = textBody.trim()
  const isKeyword = CONFIRMATION_RE.test(trimmed)

  const session = await findPendingSession(payload, phone, req)

  // ── Confirmation keyword → kick off background processing ─────────────────
  if (isKeyword) {
    if (!session) {
      await sendTextMessage(
        phone,
        '🤷 No product info to process. Send your product details and images first, then type *done* when ready.',
      )
      return
    }
    // Fire-and-forget — heavy processing runs in background
    await processSession({ payload, sessionId: session.id, phone, req })
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
 * - Downloads the image and uploads it to the `media` collection.
 * - Captures the optional caption as a text entry alongside the image.
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
  const { payload, phone, senderName, imageId, mimeType, caption, req } = params

  // 1. Download from WhatsApp CDN and store in Payload media collection
  const imageBuffer = await downloadWhatsAppImage(imageId, mimeType)
  if (!imageBuffer) {
    await sendTextMessage(phone, "⚠️ Sorry, we couldn't download the image, please try again.")
    return
  }

  const extension = getImageExtension(mimeType)

  // 2. Upload to Payload media collection with a neutral SEO-safe base name
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
  const session = await findPendingSession(payload, phone, req)

  if (session) {
    const existing = normalizeMessages(session.messages ?? [])
    const updatedMessages = [...existing, imageMessage]
    await payload.update({
      collection: 'whatsapp-sessions',
      id: session.id,
      data: { messages: updatedMessages },
      req,
    })
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

// ─── Session Processing ───────────────────────────────────────────────────────

/**
 * Core pipeline for a confirmed session:
 *   1. Mark session as `processing`
 *   2. Re-fetch session with depth:1 to hydrate images
 *   3. Gather text + images from all messages
 *   4. Fetch available categories for AI context
 *   5. Run AI extraction (parseProductFromMessage)
 *   6. Create any new variant options in parallel
 *   7. Create draft product (reuses the saved media docs + slug)
 *   8. Create variant docs (cartesian product of option combos)
 *   9. Mark session `done` and send a rich summary to the user
 *
 * Called fire-and-forget when the user sends a confirmation keyword.
 */
async function processSession(params: {
  payload: BasePayload
  sessionId: number
  phone: string
  req: Request
}): Promise<void> {
  const { payload, sessionId, phone, req } = params

  try {
    // 1. Mark session as processing so duplicate triggers are ignored
    await payload.update({
      collection: 'whatsapp-sessions',
      id: sessionId,
      data: { status: 'processing' },
      req,
    })

    await sendTextMessage(phone, '⏳ Processing your product, please wait…')

    // 2. Re-fetch with depth:1 so image fields are hydrated Media objects
    const session = await payload.findByID({
      collection: 'whatsapp-sessions',
      id: sessionId,
      depth: 1,
      req,
    })

    // 3. Collect text (from text messages AND image captions)
    const messages = session.messages ?? []

    const allText = messages
      .filter((msg) => !!msg.text)
      .map((msg) => msg.text as string)
      .join('\n')

    // 4. Collect hydrated Media objects attached to image messages
    const sessionImages = messages
      .map((msg) => (msg.image && typeof msg.image === 'object' ? msg.image : null))
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
        req,
      })
      return
    }

    // 5. Fetch all categories so the AI can assign the right ones
    const categoriesResult = await payload.find({
      collection: 'categories',
      limit: 0,
      pagination: false,
      select: { title: true },
      req,
    })

    const categories: Category[] = categoriesResult.docs.map((c) => ({
      id: c.id,
      title: c.title,
    }))

    // 6. Determine product groups — one group per distinct product
    let imageGroups: Array<{ id: number; url: string }[]>

    if (images.length <= 1) {
      // Fast path: single or no image — no grouping needed
      imageGroups = [images]
    } else {
      await sendTextMessage(phone, `🔍 Analysing ${images.length} images…`)
      try {
        const groups = await groupImagesByProduct(images)
        imageGroups = groups
          .map((g) =>
            g.imageIds
              .map((id) => images.find((img) => img.id === id))
              .filter((img): img is { id: number; url: string } => !!img),
          )
          .filter((g) => g.length > 0)
        if (imageGroups.length === 0) imageGroups = [images]
      } catch (err) {
        payload.logger.error(err, '[whatsapp] Image grouping failed, treating all as one product')
        imageGroups = [images]
      }
    }

    const isMultiProduct = imageGroups.length > 1

    if (isMultiProduct) {
      await sendTextMessage(
        phone,
        `📦 Found ${imageGroups.length} separate products. Creating them now…`,
      )
    }

    // 7. Create one product per image group
    type CreatedProductSummary = {
      title: string
      costPrice: number
      price: number
      variantInfo: string
      categoryCount: number
      categoryNames: string
      adminUrl: string
    }

    const createdProducts: CreatedProductSummary[] = []
    let failedGroupCount = 0

    for (const groupImages of imageGroups) {
      try {
        const parsed = await parseProductFromMessage({
          messageText: allText,
          categories,
          images: groupImages,
          payload,
        })

        const costPrice = (parsed.costPriceInNGN ?? 0) * 100
        const price = (parsed.sellingPriceInNGN ?? 0) * 100

        const needsVariants = parsed.selectedVariants?.length > 0

        const variantMap = needsVariants
          ? parsed.selectedVariants.map((variant) => ({
              typeId: variant.variantTypeId,
              optionIds: variant.options.map((option) => option.id),
              inventory: variant.inventoryPerOption,
              labels: variant.options.map((option) => option.label),
            }))
          : []

        const variantTypeIds = [...new Set(variantMap.map((v) => v.typeId))]

        const product = await payload.create({
          collection: 'products',
          draft: true,
          data: {
            title: parsed.title,
            slug: parsed.slug,
            description: textToLexical(parsed.description),
            priceInNGN: price,
            priceInNGNEnabled: true,
            enableVariants: needsVariants,
            ...(needsVariants ? { variantTypes: variantTypeIds } : {}),
            ...(!needsVariants ? { inventory: parsed.inventory ?? 1 } : {}),
            categories: parsed.categories.map((c) => c.id),
            _status: 'draft',
            isFeatured: parsed.isFeatured,
            gallery: parsed.images.map((img) => ({
              image: img.id,
              ...(img.colorVariantOptionId ? { variantOption: img.colorVariantOptionId } : {}),
            })),
            meta: {
              title: parsed.title,
              description: parsed.metaDescription,
              image: parsed.images[0]?.id ?? null,
            },
          },
          req,
        })

        if (needsVariants) {
          const optionArrays = variantMap.map((v) => v.optionIds)
          const combinations: number[][] = optionArrays.reduce<number[][]>(
            (acc, array) => acc.flatMap((x) => array.map((y) => [...x, y])),
            [[]],
          )
          const defaultInventory = Math.min(...variantMap.map((v) => v.inventory))

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
                req,
              }),
            ),
          )
        }

        await Promise.allSettled(
          parsed.images.map((img) => {
            if (!img.altText?.trim()) return Promise.resolve()
            return payload.update({
              collection: 'media',
              id: img.id,
              data: { alt: img.altText.trim() },
              req,
            })
          }),
        )

        const adminUrl = `${getServerSideURL()}/admin/collections/products/${product.id}`
        const categoryNames = parsed.categories.map((c) => c.name).join(', ')
        const variantInfo = needsVariants
          ? parsed.selectedVariants
              .map(
                (v) =>
                  `📏 ${v.variantTypeName}: ${v.options.map((o) => o.label).join(', ')} (${v.inventoryPerOption} each)`,
              )
              .join('\n')
          : `📦 Inventory: ${parsed.inventory ?? 1}`

        createdProducts.push({
          title: product.title,
          costPrice,
          price,
          variantInfo,
          categoryCount: parsed.categories.length,
          categoryNames,
          adminUrl,
        })
      } catch (err) {
        payload.logger.error(err, '[whatsapp] Failed to create product for image group')
        failedGroupCount++
      }
    }

    if (createdProducts.length === 0) {
      throw new Error('All product groups failed to process')
    }

    // 8. Mark session done
    await payload.update({
      collection: 'whatsapp-sessions',
      id: sessionId,
      data: { status: 'done' },
      req,
    })

    // 9. Notify user with a rich summary
    if (createdProducts.length === 1) {
      const p = createdProducts[0]
      await sendTextMessage(
        phone,
        [
          '✅ Product created successfully!\n',
          `📦 *${p.title}*`,
          `💰 Cost Price: ₦${formatCurrency(p.costPrice)}`,
          `💰 Selling Price: ₦${formatCurrency(p.price)}`,
          p.variantInfo,
          `📁 ${p.categoryCount === 1 ? 'Category' : 'Categories'}: ${p.categoryNames}`,
          `📝 Status: Draft (review & publish in admin)\n`,
          `🔗 Edit in admin:`,
          p.adminUrl,
        ].join('\n'),
      )
    } else {
      const lines = [`✅ ${createdProducts.length} products created successfully!\n`]
      createdProducts.forEach((p, i) => {
        lines.push(
          `*${i + 1}. ${p.title}*`,
          `   💰 ₦${formatCurrency(p.costPrice)} cost · ₦${formatCurrency(p.price)} selling`,
          `   ${p.variantInfo.split('\n').join('\n   ')}`,
          `   🔗 ${p.adminUrl}`,
          '',
        )
      })
      lines.push(`📝 All drafts — review & publish in admin`)
      if (failedGroupCount > 0) {
        lines.push(`\n⚠️ ${failedGroupCount} product(s) could not be created.`)
      }
      await sendTextMessage(phone, lines.join('\n'))
    }
  } catch (err) {
    console.error(`[whatsapp] Processing error for session ${sessionId}:`, err)

    await payload
      .update({
        collection: 'whatsapp-sessions',
        id: sessionId,
        data: { status: 'failed' },
        req,
      })
      .catch(() => {})

    await sendTextMessage(
      phone,
      '❌ Sorry, something went wrong while creating your product. Please try again by sending new product details.',
    )
  }
}

// ─── Session Helpers ──────────────────────────────────────────────────────────

/** Returns the most recent `pending` session for a given phone number, or `null`. */
async function findPendingSession(payload: BasePayload, phone: string, req: Request) {
  const result = await payload.find({
    collection: 'whatsapp-sessions',
    where: { and: [{ phone: { equals: phone } }, { status: { equals: 'pending' } }] },
    sort: '-createdAt',
    limit: 1,
    req,
  })
  return result.docs[0] ?? null
}

/**
 * Normalises an existing messages array so it is safe to spread when
 * appending new entries. Handles both hydrated (depth > 0) and bare-ID
 * image references.
 */
function normalizeMessages(messages: WhatsappSession['messages']) {
  return (
    messages?.map((msg) => ({
      type: msg.type,
      text: msg.text || undefined,
      image:
        msg.type === 'image'
          ? typeof msg.image === 'object' && !!msg.image
            ? msg.image.id
            : msg.image
          : undefined,
    })) ?? []
  )
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Converts plain text to Lexical rich-text JSON for Payload's editor.
 * Double newlines become separate paragraph nodes.
 */
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

function getImageExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return (
        mimeType
          .split('/')
          .pop()
          ?.replace(/[^a-z0-9]/gi, '')
          .toLowerCase() || 'jpg'
      )
  }
}

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
