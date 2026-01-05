import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag } from 'next/cache'

import type { Category } from '@/payload-types'
import { queryKeys } from '@/lib/query-keys'

export const revalidateAfterChange: CollectionAfterChangeHook<Category> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    revalidateTag(queryKeys.revalidation.categories)

    // revalidate home product sections
    revalidateTag(queryKeys.revalidation.homeProductSection('category', doc.id))
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Category> = ({
  doc,
  req: { context },
}) => {
  if (!context.disableRevalidate) {
    revalidateTag(queryKeys.revalidation.categories)

    // revalidate home product sections
    revalidateTag(queryKeys.revalidation.homeProductSection('category', doc.id))
  }

  return doc
}
