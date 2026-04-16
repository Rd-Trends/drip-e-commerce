/**
 * Creates a single draft product from one AI-extracted product payload.
 * Variant option lookup and slug uniqueness are handled deterministically here,
 * outside the model. New variant options are created by the parent job before
 * product creation starts.
 */

import { nanoid } from 'nanoid'
import type { BasePayload, PayloadRequest } from 'payload'
import type { ParsedSessionProduct, VariantCatalogOption, VariantCatalogType } from '@/lib/ai/ai'
import { textToLexical, type CreatedProductSummary } from '@/lib/whatsapp/utils'
import { slugify } from '@/utils/slugify'

export async function createProductFromGroup(params: {
  parsedProduct: ParsedSessionProduct
  payload: BasePayload
  req: PayloadRequest
  serverUrl: string
}): Promise<CreatedProductSummary> {
  const { parsedProduct, payload, req, serverUrl } = params

  const costPrice = (parsedProduct.costPriceInNGN ?? 0) * 100 // In Kobo
  const price = (parsedProduct.sellingPriceInNGN ?? 0) * 100 // In Kobo

  let initialSlug = slugify(parsedProduct.title)
  const existingProduct = await payload.find({
    collection: 'products',
    where: { slug: { equals: initialSlug } },
    limit: 1,
    pagination: false,
    req,
  })

  if (existingProduct.docs.length > 0) {
    initialSlug = `${initialSlug}-${nanoid(6)}`
  }

  const selectedVariants = parsedProduct.selectedVariants
  const variantTypeIds = Array.from(new Set(selectedVariants.map((item) => item.variantTypeId)))
  const enableVariants = variantTypeIds.length > 0

  const createDraftProduct = (slug: string) =>
    payload.create({
      collection: 'products',
      draft: true,
      data: {
        title: parsedProduct.title,
        slug,
        description: textToLexical(parsedProduct.description),
        priceInNGN: price,
        priceInNGNEnabled: true,
        enableVariants,
        ...(enableVariants
          ? { variantTypes: variantTypeIds }
          : { inventory: parsedProduct.inventory ?? 1 }),
        categories: parsedProduct.categories.map((category) => category.id),
        _status: 'draft',
        isFeatured: parsedProduct.isFeatured,
        gallery: parsedProduct.images.map((image) => ({
          image: image.id,
          variantOption: image.variantOptionId ?? undefined,
        })),
        meta: {
          title: parsedProduct.title,
          description: parsedProduct.metaDescription,
          image: parsedProduct.images[0]?.id ?? null,
        },
      },
      req,
    })

  let product: Awaited<ReturnType<typeof createDraftProduct>> | undefined

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      product = await createDraftProduct(
        attempt === 0 ? initialSlug : `${initialSlug}-${nanoid(4)}`,
      )
      break
    } catch (err) {
      const isSlugConflict =
        err instanceof Error &&
        (err.message.includes('duplicate') || err.message.includes('unique'))

      if (!isSlugConflict || attempt >= 2) {
        throw err
      }
    }
  }

  if (!product) {
    throw new Error('Product creation failed after slug retries')
  }

  if (enableVariants) {
    const optionArrays = selectedVariants.map((item) =>
      item.options.map((option) => option.id).filter((id) => id !== null),
    )

    const combinations = optionArrays.reduce<number[][]>(
      (acc, array) => acc.flatMap((combo) => array.map((optionId) => [...combo, optionId])),
      [[]],
    )
    const defaultInventory = Math.min(
      ...selectedVariants.map((variant) => variant.inventoryPerOption),
    )

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
            costPrice,
            _status: 'published',
          },
          req,
        }),
      ),
    )
  }

  await Promise.all(
    parsedProduct.images
      .filter((image) => Boolean(image.altText.trim()))
      .map((image) =>
        payload.update({
          collection: 'media',
          id: image.id,
          data: { alt: image.altText.trim() },
          req,
        }),
      ),
  )

  const adminUrl = `${serverUrl}/admin/collections/products/${product.id}`
  const categoryNames = parsedProduct.categories.map((category) => category.name).join(', ')
  const variantInfo = enableVariants
    ? selectedVariants
        .map(
          (variant) =>
            `📏 ${variant.variantTypeName}: ${variant.options.map((option) => option.label).join(', ')} (${variant.inventoryPerOption} each)`,
        )
        .join('\n')
    : `📦 Inventory: ${parsedProduct.inventory ?? 1}`

  return {
    title: product.title,
    costPrice,
    price,
    variantInfo,
    categoryCount: parsedProduct.categories.length,
    categoryNames,
    adminUrl,
  }
}
