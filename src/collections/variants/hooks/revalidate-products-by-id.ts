import { revalidateTag } from 'next/cache'
import type { BasePayload } from 'payload'

import { queryKeys } from '@/lib/query-keys'

export const revalidateProductsByID = async ({
  payload,
  productIDs,
}: {
  payload: BasePayload
  productIDs: number[]
}) => {
  const uniqueProductIDs = [...new Set(productIDs)]

  if (!uniqueProductIDs.length) return

  const { docs: products } = await payload.find({
    collection: 'products',
    depth: 0,
    limit: 0,
    pagination: false,
    where: {
      id: {
        in: uniqueProductIDs,
      },
    },
    select: {
      slug: true,
    },
  })

  if (products.length > 0) {
    revalidateTag(queryKeys.revalidation.products)
  }

  for (const product of products) {
    if (product.slug) {
      revalidateTag(queryKeys.revalidation.product(product.slug))
    }
  }
}
