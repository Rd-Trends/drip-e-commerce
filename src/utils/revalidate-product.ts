import { revalidateTag } from 'next/cache'

/**
 * Revalidate cached product data
 * Call this in Payload hooks when a product is updated
 */
export function revalidateProduct(slug: string) {
  revalidateTag(`product-${slug}`)
  revalidateTag('products')
}

/**
 * Revalidate all products cache
 * Call this when you need to refresh all product listings
 */
export function revalidateAllProducts() {
  revalidateTag('products')
}
