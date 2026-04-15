/**
 * Creates a single draft product (with optional variants) from an AI-parsed
 * image group. Designed to be called from the `processWhatsappSession` job
 * so that each product group can be processed independently.
 */

import { nanoid } from 'nanoid'
import type { BasePayload, PayloadRequest } from 'payload'
import { parseProductFromMessage } from '@/lib/ai/ai'
import type { Category } from '@/lib/ai/ai'
import { textToLexical, type CreatedProductSummary } from '@/lib/whatsapp/utils'

export async function createProductFromGroup(params: {
  groupImages: Array<{ id: number; url: string }>
  allText: string
  categories: Category[]
  payload: BasePayload
  req: PayloadRequest
  serverUrl: string
}): Promise<CreatedProductSummary> {
  const { groupImages, allText, categories, payload, req, serverUrl } = params

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

  // Retry with a suffixed slug on unique-constraint collision
  // (parallel groups may race on the same AI-generated slug)
  const createDraftProduct = (slug: string) =>
    payload.create({
      collection: 'products',
      draft: true,
      data: {
        title: parsed.title,
        slug,
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

  let product: Awaited<ReturnType<typeof createDraftProduct>> | undefined
  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      product = await createDraftProduct(
        attempt === 0 ? parsed.slug : `${parsed.slug}-${nanoid(3)}`,
      )
      break
    } catch (err) {
      const isSlugConflict =
        err instanceof Error &&
        (err.message.includes('duplicate') || err.message.includes('unique'))
      if (!isSlugConflict || attempt >= 2) throw err
    }
  }

  if (!product) throw new Error('Product creation failed after slug retries')

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

  // Update media alt text in parallel (non-blocking)
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

  const adminUrl = `${serverUrl}/admin/collections/products/${product.id}`
  const categoryNames = parsed.categories.map((c) => c.name).join(', ')
  const variantInfo = needsVariants
    ? parsed.selectedVariants
        .map(
          (v) =>
            `📏 ${v.variantTypeName}: ${v.options.map((o) => o.label).join(', ')} (${v.inventoryPerOption} each)`,
        )
        .join('\n')
    : `📦 Inventory: ${parsed.inventory ?? 1}`

  return {
    title: product.title,
    costPrice,
    price,
    variantInfo,
    categoryCount: parsed.categories.length,
    categoryNames,
    adminUrl,
  }
}
