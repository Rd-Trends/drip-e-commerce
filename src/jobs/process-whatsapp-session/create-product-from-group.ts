/**
 * Creates a single draft product from one AI-extracted product payload.
 * Variant option lookup and slug uniqueness are handled deterministically here,
 * outside the model. New variant options are created by the parent job before
 * product creation starts.
 */

import { nanoid } from 'nanoid'
import type { BasePayload, PayloadRequest } from 'payload'
import type { ParsedSessionProduct } from '@/lib/ai/ai'
import { textToLexical, type CreatedProductSummary } from '@/lib/whatsapp/utils'
import { slugify } from '@/utils/slugify'

const SELLING_PRICE_MARKUP = 1.4

type SelectedVariant = ParsedSessionProduct['selectedVariants'][number]
type ParsedVariantOption = SelectedVariant['options'][number]
type ResolvedVariantOption = ParsedVariantOption & { id: number }

function isAmount(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function toKobo(amountInNGN: number): number {
  return Math.round(amountInNGN * 100)
}

function maxAmount(values: Array<number | null | undefined>): number | null {
  const amounts = values.filter(isAmount)
  return amounts.length > 0 ? Math.max(...amounts) : null
}

function markedUpSellingPrice(costPriceInNGN: number): number {
  return costPriceInNGN * SELLING_PRICE_MARKUP
}

function getProductPricing(parsedProduct: ParsedSessionProduct): {
  costPriceInNGN: number
  sellingPriceInNGN: number
} {
  const optionCostPrices = parsedProduct.selectedVariants.flatMap((variant) =>
    variant.options.map((option) => option.costPriceInNGN),
  )
  const optionSellingPrices = parsedProduct.selectedVariants.flatMap((variant) =>
    variant.options.map((option) => option.sellingPriceInNGN),
  )
  const costPriceInNGN = maxAmount([parsedProduct.costPriceInNGN, ...optionCostPrices]) ?? 0
  const sellingPriceInNGN =
    maxAmount([
      parsedProduct.sellingPriceInNGN,
      costPriceInNGN > 0 ? markedUpSellingPrice(costPriceInNGN) : null,
      ...optionSellingPrices,
    ]) ?? 0

  return {
    costPriceInNGN,
    sellingPriceInNGN,
  }
}

function getVariantCombinationPricing(options: ResolvedVariantOption[]): {
  costPrice: number
  price: number
} {
  const variantCostPriceInNGN = maxAmount(options.map((option) => option.costPriceInNGN)) ?? 0
  const variantSellingPriceInNGN =
    maxAmount([
      variantCostPriceInNGN > 0 ? markedUpSellingPrice(variantCostPriceInNGN) : null,
      ...options.map((option) => option.sellingPriceInNGN),
    ]) ?? 0

  return {
    costPrice: toKobo(variantCostPriceInNGN),
    price: toKobo(variantSellingPriceInNGN),
  }
}

export async function createProductFromGroup(params: {
  parsedProduct: ParsedSessionProduct
  payload: BasePayload
  req: PayloadRequest
  serverUrl: string
}): Promise<CreatedProductSummary> {
  const { parsedProduct, payload, req, serverUrl } = params

  const productPricing = getProductPricing(parsedProduct)
  const costPrice = toKobo(productPricing.costPriceInNGN)
  const price = toKobo(productPricing.sellingPriceInNGN)

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

  const createProduct = (slug: string) =>
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
          : { costPrice, inventory: parsedProduct.inventory ?? 1 }),
        categories: parsedProduct.categories.map((category) => category.id),
        _status: 'published',
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

  let product: Awaited<ReturnType<typeof createProduct>> | undefined

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      product = await createProduct(attempt === 0 ? initialSlug : `${initialSlug}-${nanoid(4)}`)
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
      item.options.filter(
        (option): option is ResolvedVariantOption => typeof option.id === 'number',
      ),
    )

    const combinations = optionArrays.reduce<ResolvedVariantOption[][]>(
      (acc, array) => acc.flatMap((combo) => array.map((option) => [...combo, option])),
      [[]],
    )
    const defaultInventory = Math.min(
      ...selectedVariants.map((variant) => variant.inventoryPerOption),
    )

    await Promise.all(
      combinations.map((combo) => {
        const variantPricing = getVariantCombinationPricing(combo)

        return payload.create({
          collection: 'variants',
          data: {
            product: product.id,
            options: combo.map((option) => option.id),
            inventory: defaultInventory,
            priceInNGN: variantPricing.price,
            priceInNGNEnabled: true,
            costPrice: variantPricing.costPrice,
            _status: 'published',
          },
          req,
        })
      }),
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
