import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { VariantOption } from '@/payload-types'
import { revalidateProductsByID } from './revalidate-products-by-id'

const getRelatedProductIDs = async ({
  payload,
  optionID,
}: {
  payload: BasePayload
  optionID: number
}) => {
  const { docs: variants } = await payload.find({
    collection: 'variants',
    depth: 0,
    limit: 0,
    pagination: false,
    where: {
      options: {
        contains: optionID,
      },
    },
    select: {
      product: true,
    },
  })

  return variants
    .map((variant) => typeof variant.product === 'number' ? variant.product : variant.product?.id)
    .filter((product): product is number => typeof product === 'number')
}

export const revalidateAfterOptionChange: CollectionAfterChangeHook<VariantOption> = async ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    const productIDs = await getRelatedProductIDs({ payload, optionID: doc.id })
    await revalidateProductsByID({ payload, productIDs })
  }

  return doc
}

export const revalidateOptionDelete: CollectionAfterDeleteHook<VariantOption> = async ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    const productIDs = await getRelatedProductIDs({ payload, optionID: doc.id })
    await revalidateProductsByID({ payload, productIDs })
  }

  return doc
}
