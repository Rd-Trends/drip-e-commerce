import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { revalidateTag } from 'next/cache'

import type { Variant } from '@/payload-types'
import { queryKeys } from '@/lib/query-keys'

export const revalidateAfterChange: CollectionAfterChangeHook<Variant> = async ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    if (doc._status === 'published') {
      const product = await payload.findByID({
        collection: 'products',
        id: typeof doc.product === 'number' ? doc.product : doc.product.id,
        depth: 0,
        select: {
          slug: true,
        },
      })
      revalidateTag(queryKeys.revalidation.product(product.slug))
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Variant> = async ({
  doc,
  req: { context, payload },
}) => {
  if (!context.disableRevalidate) {
    const product = await payload.findByID({
      collection: 'products',
      id: typeof doc.product === 'number' ? doc.product : doc.product.id,
      depth: 0,
      select: {
        slug: true,
      },
    })
    revalidateTag(queryKeys.revalidation.product(product.slug))
  }

  return doc
}
