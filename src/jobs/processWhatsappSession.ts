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
import type { CreatedProductSummary } from '@/lib/whatsapp/utils'
import { createProductFromGroup } from '@/jobs/createProductFromGroup'

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

    // ── 2. Re-fetch with depth:1 so image fields are hydrated Media objects ─
    const session = await payload.findByID({
      collection: 'whatsapp-sessions',
      id: sessionId,
      depth: 1,
      req,
    })

    const serverUrl = getServerSideURL()
    const messages = session.messages ?? []

    // Collect text from text messages AND image captions
    const allText = messages
      .filter((msg) => !!msg.text)
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
    const results: PromiseSettledResult<CreatedProductSummary>[] = []

    for (const groupImages of imageGroups) {
      try {
        const createdProduct = await createProductFromGroup({
          groupImages,
          allText,
          categories,
          payload,
          req,
          serverUrl,
        })

        results.push({
          status: 'fulfilled',
          value: createdProduct,
        })
      } catch (reason) {
        results.push({
          status: 'rejected',
          reason,
        })
      }
    }

    const createdProducts = results
      .filter((r): r is PromiseFulfilledResult<CreatedProductSummary> => r.status === 'fulfilled')
      .map((r) => r.value)
    const failedGroupCount = results.filter((r) => r.status === 'rejected').length

    // Log failures
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        payload.logger.error(r.reason, `[whatsapp] Failed to create product for group ${i + 1}`)
      }
    })

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
      if (createdProducts.length === 1) {
        const p = createdProducts[0]
        await sendTextMessage(
          phone,
          [
            '✅ Product created successfully!\n',
            `📦 *${p.title}*`,
            `💰 Cost Price: ${formatCurrency(p.costPrice)}`,
            `💰 Selling Price: ${formatCurrency(p.price)}`,
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
            `   💰 ${formatCurrency(p.costPrice)} cost · ${formatCurrency(p.price)} selling`,
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
