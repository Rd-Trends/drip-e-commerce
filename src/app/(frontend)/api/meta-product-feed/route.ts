import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Product, Variant } from '@/payload-types'
import { resolveMediaUrl } from '@/utils/get-product-image-url'

// Revalidate the feed every hour
export const revalidate = 3600

const BRAND = 'Drip'
const DEFAULT_CATEGORY = 'Apparel &amp; Accessories &gt; Clothing'

/** Escape characters that are invalid in XML text nodes (outside of CDATA). */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** Convert kobo → naira and format for Meta's catalog feed (e.g. "5000.00 NGN") */
function formatPrice(amountInKobo: number): string {
  const naira = amountInKobo / 100
  return `${naira.toFixed(2)} NGN`
}

/** Recursively extract plain text from a Payload Lexical rich-text node tree. */
function lexicalToText(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as Record<string, unknown>).root
  if (!root) return ''

  function extractText(node: unknown): string {
    if (!node || typeof node !== 'object') return ''
    const n = node as Record<string, unknown>
    if (n.type === 'text' && typeof n.text === 'string') return n.text
    if (Array.isArray(n.children)) {
      return (n.children as unknown[]).map(extractText).join(' ')
    }
    return ''
  }

  return extractText(root).replace(/\s+/g, ' ').trim()
}

/**
 * Resolve the best image URL for a product or variant.
 * For variant items, tries to find a gallery image tagged to the variant's color option first.
 */
function getImageUrl(baseUrl: string, product: Product, colorOptionId?: number): string {
  const gallery = product.gallery ?? []

  if (colorOptionId) {
    const variantImage = gallery.find((item) => {
      const optionId =
        typeof item.variantOption === 'object' ? item.variantOption?.id : item.variantOption
      return optionId === colorOptionId
    })
    if (variantImage && typeof variantImage.image === 'object' && variantImage.image?.url) {
      return resolveMediaUrl(variantImage.image.url, baseUrl)
    }
  }

  const firstImage = gallery[0]
  if (firstImage && typeof firstImage.image === 'object' && firstImage.image?.url) {
    return resolveMediaUrl(firstImage.image.url, baseUrl)
  }

  return ''
}

/** Extract category titles from a populated product, joined as a product type string. */
function getProductType(product: Product): string {
  const cats = (product.categories ?? []).filter(
    (c) => typeof c === 'object',
  ) as import('@/payload-types').Category[]
  return cats.map((c) => c.title).join(' > ')
}

/** Build an XML <item> for a product. For variant products, derives stock and price from variants. */
function buildSimpleItem(baseUrl: string, product: Product): string {
  const link = escapeXml(`${baseUrl}/products/${product.slug}`)
  const imageUrl = getImageUrl(baseUrl, product)
  const description = lexicalToText(product.description) || product.title
  const productType = getProductType(product)

  let availability: string
  let price: string

  if (product.enableVariants && product.variants?.docs?.length) {
    const variantDocs = (product.variants.docs as (Variant | number)[]).filter(
      (v): v is Variant => typeof v === 'object',
    )
    const inStock = variantDocs.some((v) => (v.inventory ?? 0) > 0)
    availability = inStock ? 'in stock' : 'out of stock'

    // Use the lowest variant price; fall back to the product-level price
    const variantPrices = variantDocs
      .map((v) => v.priceInNGN ?? product.priceInNGN ?? 0)
      .filter((p) => p > 0)
    const lowestPrice =
      variantPrices.length > 0 ? Math.min(...variantPrices) : (product.priceInNGN ?? 0)
    price = formatPrice(lowestPrice)
  } else {
    availability = (product.inventory ?? 0) > 0 ? 'in stock' : 'out of stock'
    price = formatPrice(product.priceInNGN ?? 0)
  }

  return `    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.title}]]></g:title>
      <g:description><![CDATA[${description}]]></g:description>
      <g:link>${link}</g:link>${imageUrl ? `\n      <g:image_link>${escapeXml(imageUrl)}</g:image_link>` : ''}
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${BRAND}</g:brand>
      <g:google_product_category>${DEFAULT_CATEGORY}</g:google_product_category>${productType ? `\n      <g:product_type><![CDATA[${productType}]]></g:product_type>` : ''}
    </item>`
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 3,
    limit: 500,
    pagination: false,
    where: {
      _status: { equals: 'published' },
    },
  })

  const items: string[] = []

  for (const product of result.docs) {
    items.push(buildSimpleItem(baseUrl, product))
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Drip - Fashion Store</title>
    <link>${baseUrl}</link>
    <description>Shop the latest fashion trends at Drip. Classic and flashy styles that make a statement.</description>
${items.join('\n')}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
