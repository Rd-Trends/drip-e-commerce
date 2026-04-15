/**
 * Creates a single draft product from one AI-extracted product payload.
 * Variant option creation and slug uniqueness are handled deterministically here,
 * outside the model.
 */

import { nanoid } from 'nanoid'
import type { BasePayload, PayloadRequest } from 'payload'
import type { ParsedSessionProduct, VariantCatalogOption, VariantCatalogType } from '@/lib/ai/ai'
import { textToLexical, type CreatedProductSummary } from '@/lib/whatsapp/utils'

type ResolvedVariantOption = {
  id: number
  label: string
}

type ResolvedVariant = {
  inventoryPerOption: number
  options: ResolvedVariantOption[]
  variantTypeId: number
  variantTypeName: string
}

function normalizeKey(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeOptionLabel(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function findOptionInCatalog(
  variantType: VariantCatalogType,
  candidate: { id: number | null; label: string | null | undefined },
): VariantCatalogOption | undefined {
  if (candidate.id != null) {
    const optionById = variantType.options.find((option) => option.id === candidate.id)
    if (optionById) return optionById
  }

  const normalizedLabel = normalizeKey(candidate.label ?? '')
  if (!normalizedLabel) return undefined

  return variantType.options.find(
    (option) =>
      normalizeKey(option.label) === normalizedLabel || normalizeKey(option.value) === normalizedLabel,
  )
}

async function ensureVariantTypeOptionsLoaded(params: {
  payload: BasePayload
  req: PayloadRequest
  variantType: VariantCatalogType
}): Promise<void> {
  const { payload, req, variantType } = params

  if (variantType.optionsLoaded) {
    return
  }

  const result = await payload.find({
    collection: 'variantOptions',
    where: { variantType: { equals: variantType.id } },
    limit: 0,
    pagination: false,
    req,
  })

  variantType.options = result.docs.map((option) => ({
    id: option.id,
    label: option.label,
    value: option.value,
  }))
  variantType.optionsLoaded = true
}

async function resolveVariantOption(params: {
  candidate: { id: number | null; label: string | null | undefined }
  payload: BasePayload
  req: PayloadRequest
  variantType: VariantCatalogType
}): Promise<ResolvedVariantOption> {
  const { candidate, payload, req, variantType } = params

  await ensureVariantTypeOptionsLoaded({ payload, req, variantType })

  const existing = findOptionInCatalog(variantType, candidate)
  if (existing) {
    return { id: existing.id, label: existing.label }
  }

  const cleanLabel = normalizeOptionLabel(candidate.label ?? '')
  if (!cleanLabel) {
    throw new Error(`Missing option label for variant type ${variantType.label}`)
  }

  const created = await payload.create({
    collection: 'variantOptions',
    data: {
      variantType: variantType.id,
      label: cleanLabel,
      value: normalizeKey(cleanLabel),
    },
    req,
  })

  variantType.options.push({
    id: created.id,
    label: created.label,
    value: created.value,
  })

  return { id: created.id, label: created.label }
}

async function resolveSelectedVariants(params: {
  payload: BasePayload
  parsedProduct: ParsedSessionProduct
  req: PayloadRequest
  variantCatalog: VariantCatalogType[]
}): Promise<ResolvedVariant[]> {
  const { payload, parsedProduct, req, variantCatalog } = params
  const variantCatalogById = new Map(variantCatalog.map((variantType) => [variantType.id, variantType]))
  const resolvedByType = new Map<number, ResolvedVariant>()

  for (const selectedVariant of parsedProduct.selectedVariants) {
    const variantType = variantCatalogById.get(selectedVariant.variantTypeId)
    if (!variantType) {
      throw new Error(`Unknown variant type ID ${selectedVariant.variantTypeId} returned by AI`)
    }

    const current =
      resolvedByType.get(selectedVariant.variantTypeId) ??
      ({
        inventoryPerOption: selectedVariant.inventoryPerOption,
        options: [],
        variantTypeId: selectedVariant.variantTypeId,
        variantTypeName: variantType.label,
      } satisfies ResolvedVariant)

    current.inventoryPerOption = Math.min(current.inventoryPerOption, selectedVariant.inventoryPerOption)

    for (const option of selectedVariant.options) {
      const resolvedOption = await resolveVariantOption({
        candidate: option,
        payload,
        req,
        variantType,
      })

      if (!current.options.some((existing) => existing.id === resolvedOption.id)) {
        current.options.push(resolvedOption)
      }
    }

    if (current.options.length > 0) {
      resolvedByType.set(selectedVariant.variantTypeId, current)
    }
  }

  return [...resolvedByType.values()]
}

async function buildImageVariantMap(params: {
  imageVariantTypeIds: Set<number>
  parsedProduct: ParsedSessionProduct
  payload: BasePayload
  req: PayloadRequest
  variantCatalog: VariantCatalogType[]
}): Promise<Map<number, number>> {
  const { imageVariantTypeIds, parsedProduct, payload, req, variantCatalog } = params
  const variantCatalogById = new Map(variantCatalog.map((variantType) => [variantType.id, variantType]))
  const imageVariantMap = new Map<number, number>()

  for (const image of parsedProduct.images) {
    if (image.variantTypeId == null || !imageVariantTypeIds.has(image.variantTypeId)) {
      continue
    }

    if (image.variantOptionId == null && !image.variantOptionLabel?.trim()) {
      continue
    }

    const variantType = variantCatalogById.get(image.variantTypeId)
    if (!variantType) continue

    const resolvedOption = await resolveVariantOption({
      candidate: {
        id: image.variantOptionId,
        label: image.variantOptionLabel,
      },
      payload,
      req,
      variantType,
    })

    imageVariantMap.set(image.id, resolvedOption.id)
  }

  return imageVariantMap
}

async function slugExists(payload: BasePayload, slug: string, req: PayloadRequest): Promise<boolean> {
  const existing = await payload.find({
    collection: 'products',
    where: { slug: { equals: slug } },
    limit: 1,
    pagination: false,
    req,
  })

  return existing.docs.length > 0
}

async function generateUniqueSlug(
  payload: BasePayload,
  req: PayloadRequest,
  title: string,
): Promise<string> {
  const baseSlug = normalizeKey(title) || `product-${nanoid(6)}`

  if (!(await slugExists(payload, baseSlug, req))) {
    return baseSlug
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = `${baseSlug}-${nanoid(4)}`
    if (!(await slugExists(payload, candidate, req))) {
      return candidate
    }
  }

  return `${baseSlug}-${nanoid(6)}`
}

export async function createProductFromGroup(params: {
  parsedProduct: ParsedSessionProduct
  payload: BasePayload
  req: PayloadRequest
  serverUrl: string
  variantCatalog: VariantCatalogType[]
}): Promise<CreatedProductSummary> {
  const { parsedProduct, payload, req, serverUrl, variantCatalog } = params

  const costPrice = (parsedProduct.costPriceInNGN ?? 0) * 100
  const price = (parsedProduct.sellingPriceInNGN ?? 0) * 100

  const resolvedVariants = await resolveSelectedVariants({
    payload,
    parsedProduct,
    req,
    variantCatalog,
  })

  const needsVariants = resolvedVariants.length > 0
  const imageVariantTypeIds = new Set(resolvedVariants.map((variant) => variant.variantTypeId))
  const imageVariantMap = await buildImageVariantMap({
    imageVariantTypeIds,
    parsedProduct,
    payload,
    req,
    variantCatalog,
  })

  const variantTypeIds = [...new Set(resolvedVariants.map((variant) => variant.variantTypeId))]
  const initialSlug = await generateUniqueSlug(payload, req, parsedProduct.title)

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
        enableVariants: needsVariants,
        ...(needsVariants ? { variantTypes: variantTypeIds } : {}),
        ...(!needsVariants ? { inventory: parsedProduct.inventory ?? 1 } : {}),
        categories: parsedProduct.categories.map((category) => category.id),
        _status: 'draft',
        isFeatured: parsedProduct.isFeatured,
        gallery: parsedProduct.images.map((image) => ({
          image: image.id,
          ...(imageVariantMap.has(image.id) ? { variantOption: imageVariantMap.get(image.id) } : {}),
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
      product = await createDraftProduct(attempt === 0 ? initialSlug : `${initialSlug}-${nanoid(4)}`)
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

  if (needsVariants) {
    const optionArrays = resolvedVariants.map((variant) => variant.options.map((option) => option.id))
    const combinations = optionArrays.reduce<number[][]>(
      (acc, array) => acc.flatMap((combo) => array.map((optionId) => [...combo, optionId])),
      [[]],
    )
    const defaultInventory = Math.min(...resolvedVariants.map((variant) => variant.inventoryPerOption))

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
  const variantInfo = needsVariants
    ? resolvedVariants
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
