import type { Product } from '@/payload-types'

export function resolveMediaUrl(url: string, baseUrl: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `${baseUrl}${url}`.replace(/([^:]\/)\/+/g, '$1')
}

export function getProductImageUrl(product: Pick<Product, 'gallery'>, baseUrl: string): string | undefined
export function getProductImageUrl(product: Pick<Product, 'gallery'>, baseUrl: string, fallback: string): string
export function getProductImageUrl(
  product: Pick<Product, 'gallery'>,
  baseUrl: string,
  fallback?: string,
): string | undefined {
  const firstImage = product.gallery?.[0]?.image
  if (firstImage && typeof firstImage === 'object' && firstImage.url) {
    return resolveMediaUrl(firstImage.url, baseUrl)
  }
  return fallback
}
