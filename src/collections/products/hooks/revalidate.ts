import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag } from 'next/cache'

import type { Product } from '@/payload-types'
import { queryKeys } from '@/lib/query-keys'

export const revalidateAfterChange: CollectionAfterChangeHook<Product> = ({
  doc,
  previousDoc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    const isPublished = doc._status === 'published'
    const wasPublished = previousDoc?._status === 'published'

    if (isPublished || wasPublished) {
      revalidateTag(queryKeys.revalidation.products)
      revalidateTag(queryKeys.revalidation.homeProductSections)
      revalidateTag(queryKeys.revalidation.categories)

      if (doc.slug) {
        revalidateTag(queryKeys.revalidation.product(doc.slug))
      }

      if (previousDoc?.slug && previousDoc.slug !== doc.slug) {
        revalidateTag(queryKeys.revalidation.product(previousDoc.slug))
      }
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Product> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag(queryKeys.revalidation.products)
    revalidateTag(queryKeys.revalidation.product(doc.slug))
    revalidateTag(queryKeys.revalidation.homeProductSections)
    revalidateTag(queryKeys.revalidation.categories)
  }

  return doc
}
