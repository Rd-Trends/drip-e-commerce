import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag } from 'next/cache'

import type { Product } from '@/payload-types'
import { queryKeys } from '@/lib/query-keys'

export const revalidateAfterChange: CollectionAfterChangeHook<Product> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      revalidateTag(queryKeys.revalidation.products)
      revalidateTag(queryKeys.revalidation.product(doc.slug))
    }

    // revalidate home product sections
    revalidateTag(queryKeys.revalidation.homeProductSections)
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Product> = ({ doc, req: { context } }) => {
  if (!context.disableRevalidate) {
    revalidateTag(queryKeys.revalidation.products)
    revalidateTag(queryKeys.revalidation.product(doc.slug))
    // revalidate home product sections
    revalidateTag(queryKeys.revalidation.homeProductSections)
  }

  return doc
}
