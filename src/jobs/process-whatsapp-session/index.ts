/**
 * Background job: processWhatsappSession
 *
 * Handles the heavy-lifting pipeline when a user sends the "done" keyword:
 *   1. Mark session as `processing`
 *   2. Fetch & hydrate session data (images, text, captions)
 *   3. Run one AI extraction pass for the whole session
 *   4. Create draft products with deterministic variant / slug resolution
 *   5. Send a rich summary back via WhatsApp
 *   6. Mark session `done` (or `failed`)
 *
 * Runs as a Payload background task with automatic retries.
 */

import type { TaskHandler } from 'payload'
import { sendTextMessage } from '@/lib/whatsapp-api'
import { parseProductsFromSession, type Category, type VariantCatalogType } from '@/lib/ai/ai'
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

    // ── 3. Notify user and fetch AI context in parallel ─────────────────────
    const [, categoriesResult, variantTypesResult] = await Promise.all([
      sendTextMessage(phone, '⏳ Processing your product, please wait…'),
      payload.find({
        collection: 'categories',
        limit: 0,
        pagination: false,
        select: { title: true },
        req,
      }),
      payload.find({
        collection: 'variantTypes',
        limit: 0,
        pagination: false,
        select: { label: true, name: true },
        req,
      }),
    ])

    const categories: Category[] = categoriesResult.docs.map((c) => ({
      id: c.id,
      title: c.title,
    }))

    const variantCatalog: VariantCatalogType[] = variantTypesResult.docs.map((variantType) => ({
      id: variantType.id,
      label: variantType.label,
      name: variantType.name,
      options: [],
      optionsLoaded: false,
    }))

    // ── 4. Extract products in a single AI pass ─────────────────────────────
    await sendTextMessage(
      phone,
      images.length > 0
        ? `🔍 Analysing ${images.length} image(s) and extracting products…`
        : '🔍 Analysing your product details…',
    )

    const extractedSession = await parseProductsFromSession({
      messageText: allText,
      categories,
      images,
      payload,
      variantCatalog,
    })

    const isMultiProduct = extractedSession.products.length > 1

    if (isMultiProduct) {
      await sendTextMessage(
        phone,
        `📦 Found ${extractedSession.products.length} separate products. Creating them now…`,
      )
    }

    // ── 5. Create products sequentially to avoid concurrent local API writes ─
    const createdProducts: CreatedProductSummary[] = []
    let failedProductCount = 0

    for (const [index, parsedProduct] of extractedSession.products.entries()) {
      try {
        const createdProduct = await createProductFromGroup({
          parsedProduct,
          payload,
          req,
          serverUrl,
          variantCatalog,
        })

        createdProducts.push(createdProduct)

        try {
          await sendTextMessage(
            phone,
            [
              `✅ Product ${index + 1}/${extractedSession.products.length} created successfully!\n`,
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
        failedProductCount += 1
        payload.logger.error(reason, `[whatsapp] Failed to create product ${index + 1}`)
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

      if (failedProductCount > 0) {
        summaryLines.push(`⚠️ ${failedProductCount} product(s) failed during creation.`)
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
