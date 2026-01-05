import { checkRole } from '@/access/utilities'
import { USER_ROLES } from '@/lib/constants'
import type { PayloadHandler } from 'payload'

interface BulkVariantRequest {
  productId: string
  variants: Array<{
    options: string[]
    priceInNGN: number
    inventory: number
    costPrice?: number
  }>
}

export const bulkCreateVariants: PayloadHandler = async (req) => {
  try {
    const body = await req.json?.()
    const { productId, variants } = (body || {}) as BulkVariantRequest

    // Verify user has permission to create variants
    if (!req.user) {
      return Response.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    if (!checkRole([USER_ROLES.ADMIN, USER_ROLES.CONTENT_MANAGER], req.user)) {
      return Response.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    // Validate request
    if (!productId || !variants || !Array.isArray(variants) || variants.length === 0) {
      return Response.json(
        { success: false, message: 'Invalid request: productId and variants array required' },
        { status: 400 },
      )
    }

    // Fetch the product to validate it exists and has variants enabled
    const product = await req.payload.findByID({
      collection: 'products',
      id: productId,
      depth: 0,
      draft: true,
      select: {
        enableVariants: true,
        variants: true,
      },
    })

    if (!product) {
      return Response.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    if (!product.enableVariants) {
      return Response.json(
        { success: false, message: 'Product does not have variants enabled' },
        { status: 400 },
      )
    }

    // Validate variant data
    for (const variant of variants) {
      if (!variant.options || !Array.isArray(variant.options) || variant.options.length === 0) {
        return Response.json(
          { success: false, message: 'Each variant must have at least one option' },
          { status: 400 },
        )
      }

      if (typeof variant.priceInNGN !== 'number' || variant.priceInNGN < 0) {
        return Response.json({ success: false, message: 'Invalid price value' }, { status: 400 })
      }

      if (typeof variant.inventory !== 'number' || variant.inventory < 0) {
        return Response.json(
          { success: false, message: 'Invalid inventory value' },
          { status: 400 },
        )
      }
    }

    // Fetch existing variants to check for duplicates
    const existingVariants = await req.payload.find({
      collection: 'variants',
      where: {
        product: {
          equals: productId,
        },
      },
      select: { id: true, options: true },
      depth: 1,
      limit: 1000,
    })

    const existingCombinations = new Set(
      existingVariants.docs.map((variant) => {
        const optionIds =
          variant.options?.map((opt) => (typeof opt === 'object' ? opt.id : opt)) || []
        return optionIds.sort().join('|')
      }),
    )

    // Filter out duplicate combinations
    const newVariants = variants.filter((variant) => {
      const combinationKey = [...variant.options].sort().join('|')
      return !existingCombinations.has(combinationKey)
    })

    if (newVariants.length === 0) {
      return Response.json(
        { success: false, message: 'All variant combinations already exist' },
        { status: 400 },
      )
    }

    // Create variants in batch
    const created = await Promise.all(
      newVariants.map((variant) =>
        req.payload.create({
          collection: 'variants',
          data: {
            product: parseInt(productId),
            options: variant.options.map((id) => parseInt(id)),
            inventory: variant.inventory,
            priceInNGN: variant.priceInNGN,
            costPrice: variant.costPrice,
            priceInNGNEnabled: true,
            _status: 'published',
          },
          req,
        }),
      ),
    )

    return Response.json({
      success: true,
      created: created.length,
      skipped: variants.length - newVariants.length,
      message: `Successfully created ${created.length} variants${variants.length - newVariants.length > 0 ? ` (${variants.length - newVariants.length} duplicates skipped)` : ''}`,
    })
  } catch (error) {
    console.error('Error in bulkCreateVariants:', error)
    return Response.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    )
  }
}
