import type { BasePayload, CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { VariantType } from '@/payload-types'
import { revalidateProductsByID } from './revalidate-products-by-id'

const getRelatedProductIDs = async ({
  payload,
  typeID,
}: {
  payload: BasePayload
  typeID: number
}) => {
  const { docs: products } = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 0,
    pagination: false,
    where: {
      variantTypes: {
        contains: typeID,
      },
    },
  })

  return products.map((product) => product.id)
}

export const revalidateAfterTypeChange: CollectionAfterChangeHook<VariantType> = async ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    const productIDs = await getRelatedProductIDs({ payload, typeID: doc.id })
    await revalidateProductsByID({ payload, productIDs })
  }

  return doc
}

export const revalidateTypeDelete: CollectionAfterDeleteHook<VariantType> = async ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    const productIDs = await getRelatedProductIDs({ payload, typeID: doc.id })
    await revalidateProductsByID({ payload, productIDs })
  }

  return doc
}
