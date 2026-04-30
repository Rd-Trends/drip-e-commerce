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

import { APICallError, NoObjectGeneratedError } from 'ai'
import type { TaskHandler } from 'payload'
import { sendTextMessage } from '@/lib/whatsapp-api'
import { ParsedSessionProduct, parseProductsFromSession } from '@/lib/ai/ai'
import { getServerSideURL } from '@/utils/get-url'
import { formatCurrency } from '@/utils/format-currency'
import { CONFIRMATION_RE, type CreatedProductSummary } from '@/lib/whatsapp/utils'
import { createProductFromGroup } from '@/jobs/process-whatsapp-session/create-product-from-group'
import { slugify } from '@/utils/slugify'

type TaskIO = {
  input: { sessionId: number; phone: string }
  output: { productsCreated: number }
}

type AIErrorKind = 'billing' | 'technical'

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

function isBillingAIError(error: unknown): boolean {
  const billingHints = [
    'billing',
    'quota',
    'insufficient_quota',
    'insufficient quota',
    'credit',
    'credits',
    'balance',
    'payment',
    '402',
  ]

  const messages = [getErrorMessage(error)]

  if (error instanceof Error && error.cause) {
    messages.push(getErrorMessage(error.cause))
  }

  if (APICallError.isInstance(error)) {
    if (error.statusCode === 402) return true

    const responseBody = error.responseBody

    if (
      typeof responseBody === 'string' &&
      billingHints.some((hint) => responseBody.toLowerCase().includes(hint))
    ) {
      return true
    }
  }

  return messages.some((message) => {
    const normalized = message.toLowerCase()
    return billingHints.some((hint) => normalized.includes(hint))
  })
}

function getAIErrorKind(error: unknown): AIErrorKind {
  return isBillingAIError(error) ? 'billing' : 'technical'
}

function buildAIProcessingFailureMessage(params: {
  kind: AIErrorKind
  sessionAdminUrl: string
}): string {
  const { kind, sessionAdminUrl } = params

  const reasonLine =
    kind === 'billing'
      ? '❌ We could not process this session because the AI service billing or quota needs attention.'
      : '❌ We could not extract your product details because of a temporary AI processing issue.'

  return [
    reasonLine,
    'Your WhatsApp session has been marked as failed.',
    'You do not need to resend the session.',
    'To retry it yourself, open this link and change the status to *Processing*:',
    sessionAdminUrl,
  ].join('\n\n')
}

function getVariantOptionValueKey(variantTypeId: number, value: string): string {
  return `${variantTypeId}:${value.trim().toLowerCase()}`
}

function getVariantOptionLabelKey(variantTypeId: number, label: string): string {
  return `${variantTypeId}:${slugify(label.trim().replace(/\s+/g, ' '))}`
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
    const sessionAdminUrl = `${serverUrl}/admin/collections/whatsapp-sessions/${sessionId}`

    // Collect text from text messages AND image captions
    const sessionMessageTexts = messages
      .filter((msg) => !!msg.text && !CONFIRMATION_RE.test(msg.text.trim()))
      .map((msg) => msg.text as string)
      .join('\n')

    // Collect hydrated Media objects attached to image messages
    const images = messages
      .map(({ image }) => {
        if (!image || typeof image === 'number') return null
        if (!image.id || !image.url) return null
        return {
          id: image.id,
          url: image.url.startsWith('http') ? image.url : `${serverUrl}${image.url}`,
        }
      })
      .filter((item) => item !== null)

    if (!sessionMessageTexts.trim() && images.length === 0) {
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
    const [, categoriesData, variantTypesData] = await Promise.all([
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

    const categories = categoriesData.docs
    const variantTypes = variantTypesData.docs

    // ── 4. Extract products in a single AI pass ─────────────────────────────
    await sendTextMessage(
      phone,
      images.length > 0
        ? `🔍 Analysing ${images.length} image(s) and extracting products…`
        : '🔍 Analysing your product details…',
    )

    let products: ParsedSessionProduct[]

    try {
      products = await parseProductsFromSession({
        messageText: sessionMessageTexts,
        categories,
        images,
        payload,
        variantTypes,
      })
    } catch (aiError) {
      const aiErrorKind = getAIErrorKind(aiError)
      const aiErrorDetails = NoObjectGeneratedError.isInstance(aiError)
        ? ` finishReason=${aiError.finishReason ?? 'unknown'}`
        : ''

      payload.logger.error(
        aiError,
        `[whatsapp] AI extraction failed for session ${sessionId}.${aiErrorDetails}`,
      )

      await payload.update({
        collection: 'whatsapp-sessions',
        id: sessionId,
        data: { status: 'failed' },
        req,
      })

      await sendTextMessage(
        phone,
        buildAIProcessingFailureMessage({
          kind: aiErrorKind,
          sessionAdminUrl,
        }),
      ).catch((notifyErr) =>
        payload.logger.error(
          notifyErr,
          `[whatsapp] Failed to send AI failure message for session ${sessionId}`,
        ),
      )

      return { output: { productsCreated: 0 } }
    }

    if (products.length > 1) {
      await sendTextMessage(
        phone,
        `📦 Found ${products.length} separate products. Creating them now…`,
      )
    }

    const newVariantOptions = products.flatMap((product) =>
      product.selectedVariants.flatMap((selectedVariant) =>
        selectedVariant.options
          .filter((option) => option.id == null && option.label.trim())
          .map((option) => {
            const label = option.label.trim().replace(/\s+/g, ' ')

            return {
              label,
              value: option.value.trim(),
              variantTypeId: selectedVariant.variantTypeId,
            }
          }),
      ),
    )

    const uniqueNewVariantOptions = [
      ...new Map(
        newVariantOptions.map((option) => [
          getVariantOptionValueKey(option.variantTypeId, option.value),
          option,
        ]),
      ).values(),
    ].filter((option) => option.value)

    const createdVariantOptions = await Promise.all(
      uniqueNewVariantOptions.map((option) =>
        payload.create({
          collection: 'variantOptions',
          data: {
            variantType: option.variantTypeId,
            label: option.label,
            value: option.value,
          },
          req,
        }),
      ),
    )

    const createdVariantOptionsByValueKey = new Map(
      createdVariantOptions.map((option) => [
        getVariantOptionValueKey(
          typeof option.variantType === 'number' ? option.variantType : option.variantType.id,
          option.value,
        ),
        option.id,
      ]),
    )
    const createdVariantOptionsByLabelKey = new Map(
      createdVariantOptions.map((option) => [
        getVariantOptionLabelKey(
          typeof option.variantType === 'number' ? option.variantType : option.variantType.id,
          option.label,
        ),
        option.id,
      ]),
    )

    // ── 5. Create products sequentially to avoid concurrent local API writes ─
    const createdProducts: CreatedProductSummary[] = []
    let failedProductCount = 0

    for (const [index, product] of products.entries()) {
      try {
        const selectedVariants = product.selectedVariants.map((variant) => ({
          ...variant,
          options: variant.options
            .map((option) => {
              if (option.id) return option

              const optionId = createdVariantOptionsByValueKey.get(
                getVariantOptionValueKey(variant.variantTypeId, option.value),
              )

              return optionId ? { ...option, id: optionId } : null
            })
            .filter((option) => option !== null),
        }))
        const variantOptionIdsByLabelKey = new Map(
          selectedVariants.flatMap((variant) =>
            variant.options
              .filter((option) => typeof option.id === 'number')
              .map((option) => [
                getVariantOptionLabelKey(variant.variantTypeId, option.label),
                option.id as number,
              ]),
          ),
        )

        const createdProduct = await createProductFromGroup({
          parsedProduct: {
            ...product,
            selectedVariants,
            images: product.images.map((image) => {
              if (image.variantOptionId) return image
              if (!image.variantTypeId || !image.variantOptionLabel) return image

              const key = getVariantOptionLabelKey(image.variantTypeId, image.variantOptionLabel)

              return {
                ...image,
                variantOptionId:
                  variantOptionIdsByLabelKey.get(key) ??
                  createdVariantOptionsByLabelKey.get(key) ??
                  null,
              }
            }),
          },
          payload,
          req,
          serverUrl,
        })

        createdProducts.push(createdProduct)

        try {
          await sendTextMessage(
            phone,
            [
              `✅ Product ${index + 1}/${products.length} created successfully!\n`,
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
