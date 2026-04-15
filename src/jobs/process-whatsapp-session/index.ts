/**
 * Background job: processWhatsappSession
 *
 * Handles the heavy-lifting pipeline when a user sends the "done" keyword:
 *   1. Mark session as `processing`
 *   2. Fetch & hydrate session data (images, text, captions)
 *   3. Group images by product using AI vision
 *   4. For each group, run AI extraction + create draft product with variants
 *   5. Send a rich summary back via WhatsApp
 *   6. Mark session `done` (or `failed`)
 *
 * Runs as a Payload background task with automatic retries.
 */

import type { TaskHandler } from 'payload'
import { sendTextMessage } from '@/lib/whatsapp-api'
import { groupImagesByProduct } from '@/lib/ai/ai'
import type { Category } from '@/lib/ai/ai'
import { getServerSideURL } from '@/utils/get-url'
import { formatCurrency } from '@/utils/format-currency'
import type { Media } from '@/payload-types'
import { CONFIRMATION_RE, type CreatedProductSummary } from '@/lib/whatsapp/utils'
import { createProductFromGroup } from '@/jobs/process-whatsapp-session/create-product-from-group'

type TaskIO = {
  input: { sessionId: number; phone: string }
  output: { productsCreated: number }
}

export const handler: TaskHandler<TaskIO> = async ({ input, req }) => {
  const { sessionId, phone } = input
  const payload = req.payload

  try {
    // ── 1. Mark session as processing ───────────────────────────────────────
    await payload.update({
      collection: 'whatsapp-sessions',
      id: sessionId,
      data: { status: 'processing' },
      req,
    })

    // ── 2. Fetch the conversation's ordered inbound messages ────────────────
    const messagesResult = await payload.find({
      collection: 'whatsapp-messages',
      depth: 1,
      limit: 0,
      pagination: false,
      sort: 'orderIndex',
      where: { conversation: { equals: sessionId } },
      req,
    })

    const serverUrl = getServerSideURL()
    const messages = messagesResult.docs

    // Collect text from text messages AND image captions
    const allText = messages
      .filter((msg) => !!msg.text && !CONFIRMATION_RE.test(msg.text.trim()))
      .map((msg) => msg.text as string)
      .join('\n')

    // Collect hydrated Media objects attached to image messages
    const sessionImages = messages
      .map((msg) => (msg.image && typeof msg.image === 'object' ? msg.image : null))
      .filter((item): item is Media => item !== null)

    const images = sessionImages.map((img) => ({
      id: img.id,
      url: img.url?.startsWith('http') ? img.url : `${serverUrl}${img.url}`,
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
      return { output: { productsCreated: 0 } }
    }

    // ── 3. Notify user and fetch categories in parallel ─────────────────────
    const [, categoriesResult] = await Promise.all([
      sendTextMessage(phone, '⏳ Processing your product, please wait…'),
      payload.find({
        collection: 'categories',
        limit: 0,
        pagination: false,
        select: { title: true },
        req,
      }),
    ])

    const categories: Category[] = categoriesResult.docs.map((c) => ({
      id: c.id,
      title: c.title,
    }))

    // ── 4. Group images by product ──────────────────────────────────────────
    let imageGroups: Array<{ id: number; url: string }[]>

    if (images.length <= 1) {
      imageGroups = [images]
    } else {
      await sendTextMessage(phone, `🔍 Analysing ${images.length} images…`)
      const groups = await groupImagesByProduct(images)
      imageGroups = groups.map((group) =>
        group.imageIds.map((imageId) => {
          const image = images.find((img) => img.id === imageId)
          if (!image) {
            throw new Error(`Grouped image ${imageId} was not found in the session payload`)
          }
          return image
        }),
      )
    }

    const isMultiProduct = imageGroups.length > 1

    if (isMultiProduct) {
      await sendTextMessage(
        phone,
        `📦 Found ${imageGroups.length} separate products. Creating them now…`,
      )
    }

    // ── 5. Create products sequentially to avoid concurrent local API writes
    // sharing the same Payload request transaction context.
    const createdProducts: CreatedProductSummary[] = []
    let failedGroupCount = 0

    for (const [index, groupImages] of imageGroups.entries()) {
      try {
        const createdProduct = await createProductFromGroup({
          groupImages,
          allText,
          categories,
          payload,
          req,
          serverUrl,
        })

        createdProducts.push(createdProduct)

        try {
          await sendTextMessage(
            phone,
            [
              `✅ Product ${index + 1}/${imageGroups.length} created successfully!\n`,
              `📦 *${createdProduct.title}*`,
              `💰 Cost Price: ${formatCurrency(createdProduct.costPrice)}`,
              `💰 Selling Price: ${formatCurrency(createdProduct.price)}`,
              createdProduct.variantInfo,
              `📁 ${createdProduct.categoryCount === 1 ? 'Category' : 'Categories'}: ${createdProduct.categoryNames}`,
              `📝 Status: Draft (review & publish in admin)\n`,
              `🔗 Edit in admin:`,
              createdProduct.adminUrl,
            ].join('\n'),
          )
        } catch (notifyErr) {
          payload.logger.error(
            notifyErr,
            `[whatsapp] Failed to send success update for group ${index + 1}`,
          )
        }
      } catch (reason) {
        failedGroupCount += 1
        payload.logger.error(reason, `[whatsapp] Failed to create product for group ${index + 1}`)
      }
    }

    if (createdProducts.length === 0) {
      await payload.update({
        collection: 'whatsapp-sessions',
        id: sessionId,
        data: { status: 'failed' },
        req,
      })
      await sendTextMessage(phone, "❌ Sorry, we couldn't create any products. Please try again.")
      return { state: 'failed' as const, errorMessage: 'All product groups failed to process' }
    }

    // ── 6. Mark session done ────────────────────────────────────────────────
    await payload.update({
      collection: 'whatsapp-sessions',
      id: sessionId,
      data: { status: 'done' },
      req,
    })

    // ── 7. Send summary ─────────────────────────────────────────────────────
    try {
      const summaryLines = [`✅ Successfully created ${createdProducts.length} product(s).`]

      if (failedGroupCount > 0) {
        summaryLines.push(`⚠️ ${failedGroupCount} product(s) failed during creation.`)
      }

      await sendTextMessage(phone, summaryLines.join('\n'))
    } catch (notifyErr) {
      payload.logger.error(notifyErr, '[whatsapp] Failed to send summary to user')
    }

    return { output: { productsCreated: createdProducts.length } }
  } catch (err) {
    payload.logger.error(err, `[whatsapp] Job error for session ${sessionId}`)

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
    ).catch(() => {})

    return { state: 'failed' as const, errorMessage: String(err) }
  }
}
