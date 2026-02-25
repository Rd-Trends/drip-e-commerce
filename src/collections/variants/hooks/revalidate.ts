import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag } from 'next/cache'
import type { BasePayload } from 'payload'

import type { Variant } from '@/payload-types'
import { queryKeys } from '@/lib/query-keys'

const getProductID = (product?: Variant['product']) => {
  if (!product) return null
  return typeof product === 'number' ? product : product.id
}

const revalidateProductByID = async ({
  payload,
  productID,
}: {
  payload: BasePayload
  productID: number
}) => {
  const product = await payload.findByID({
    collection: 'products',
    id: productID,
    depth: 0,
    select: {
      slug: true,
    },
  })

  if (product?.slug) {
    revalidateTag(queryKeys.revalidation.product(product.slug))
  }
}

export const revalidateAfterChange: CollectionAfterChangeHook<Variant> = async ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    const isPublished = doc._status === 'published'
    const wasPublished = previousDoc?._status === 'published'

    if (isPublished || wasPublished) {
      const currentProductID = getProductID(doc.product)
      const previousProductID = getProductID(previousDoc?.product)

      if (currentProductID) {
        await revalidateProductByID({ payload, productID: currentProductID })
      }

      if (previousProductID && previousProductID !== currentProductID) {
        await revalidateProductByID({ payload, productID: previousProductID })
      }
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Variant> = async ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    const productID = getProductID(doc.product)

    if (productID) {
      await revalidateProductByID({ payload, productID })
    }
  }

  return doc
}
