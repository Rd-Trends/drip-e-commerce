import configPromise from '@payload-config'
import { getPayload } from 'payload'
import type { Product, Variant, VariantOption, VariantType } from '@/payload-types'

// Revalidate the feed every hour
export const revalidate = 3600

const BRAND = 'Drip'
const DEFAULT_CATEGORY = 'Apparel & Accessories > Clothing'

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
      const url = variantImage.image.url
      return url.startsWith('http') ? url : `${baseUrl}${url}`
    }
  }

  const firstImage = gallery[0]
  if (firstImage && typeof firstImage.image === 'object' && firstImage.image?.url) {
    const url = firstImage.image.url
    return url.startsWith('http') ? url : `${baseUrl}${url}`
  }

  return ''
}

/** Build an XML <item> for a simple (non-variant) product. */
function buildSimpleItem(baseUrl: string, product: Product): string {
  const link = `${baseUrl}/products/${product.slug}`
  const imageUrl = getImageUrl(baseUrl, product)
  const description = lexicalToText(product.description) || product.title
  const availability = (product.inventory ?? 0) > 0 ? 'in stock' : 'out of stock'
  const price = formatPrice(product.priceInNGN ?? 0)

  return `    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.title}]]></g:title>
      <g:description><![CDATA[${description}]]></g:description>
      <g:link>${link}</g:link>${imageUrl ? `\n      <g:image_link>${imageUrl}</g:image_link>` : ''}
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${BRAND}</g:brand>
      <g:google_product_category>${DEFAULT_CATEGORY}</g:google_product_category>
    </item>`
}

/** Build an XML <item> for a single variant of a product. */
function buildVariantItem(baseUrl: string, product: Product, variant: Variant): string {
  const link = `${baseUrl}/products/${product.slug}`

  // Collect populated variant options
  const options = variant.options.filter((opt) => typeof opt === 'object') as VariantOption[]

  let color: string | undefined
  let size: string | undefined
  let colorOptionId: number | undefined

  for (const option of options) {
    if (typeof option.variantType === 'object') {
      const typeName = (option.variantType as VariantType).name.toLowerCase()
      if (typeName === 'color' || typeName === 'colour') {
        color = option.label
        colorOptionId = option.id
      } else if (typeName === 'size') {
        size = option.label
      }
    }
  }

  const imageUrl = getImageUrl(baseUrl, product, colorOptionId)
  const optionLabels = options.map((o) => o.label).join(' / ')
  const variantTitle = optionLabels ? `${product.title} - ${optionLabels}` : product.title
  const description = lexicalToText(product.description) || product.title
  const availability = (variant.inventory ?? 0) > 0 ? 'in stock' : 'out of stock'
  const price = formatPrice(variant.priceInNGN ?? product.priceInNGN ?? 0)

  return `    <item>
      <g:id>${product.id}-${variant.id}</g:id>
      <g:item_group_id>${product.id}</g:item_group_id>
      <g:title><![CDATA[${variantTitle}]]></g:title>
      <g:description><![CDATA[${description}]]></g:description>
      <g:link>${link}</g:link>${imageUrl ? `\n      <g:image_link>${imageUrl}</g:image_link>` : ''}
      <g:condition>new</g:condition>
      <g:availability>${availability}</g:availability>
      <g:price>${price}</g:price>
      <g:brand>${BRAND}</g:brand>
      <g:google_product_category>${DEFAULT_CATEGORY}</g:google_product_category>${color ? `\n      <g:color><![CDATA[${color}]]></g:color>` : ''}${size ? `\n      <g:size><![CDATA[${size}]]></g:size>` : ''}
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
    populate: {
      variants: {
        priceInNGN: true,
        inventory: true,
        options: true,
      },
    } as Record<string, unknown>,
  })

  const items: string[] = []

  for (const product of result.docs) {
    if (product.enableVariants && product.variants?.docs?.length) {
      for (const variant of product.variants.docs) {
        if (typeof variant === 'object') {
          items.push(buildVariantItem(baseUrl, product, variant as Variant))
        }
      }
    } else {
      items.push(buildSimpleItem(baseUrl, product))
    }
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
