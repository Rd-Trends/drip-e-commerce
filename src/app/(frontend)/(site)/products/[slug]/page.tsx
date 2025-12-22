import type { Media, Product } from '@/payload-types'

import { Gallery } from '@/components/product/gallery'
import { ProductDescription } from '@/components/product/product-description'
import { ShippingTimeline } from '@/components/product/shipping-timeline'
import { SizeGuide } from '@/components/product/size-guide'
import { Button } from '@/components/ui/button'
import { Section } from '@/components/layout/section'
import { Container } from '@/components/layout/container'
import { StickyAddToCart } from '@/components/cart/sticky-add-to-cart'
import configPromise from '@payload-config'
import { ChevronLeftIcon } from 'lucide-react'
import { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React, { Suspense } from 'react'
import { GridTileImage } from '@/components/grid/tile'

type Args = {
  params: Promise<{
    slug: string
  }>
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery = product.gallery?.filter((item) => typeof item.image === 'object') || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const canIndex = product._status === 'published'

  const seoImage = metaImage || (gallery.length ? (gallery[0]?.image as Media) : undefined)

  return {
    description: product.meta?.description || '',
    openGraph: seoImage?.url
      ? {
          images: [
            {
              alt: seoImage?.alt,
              height: seoImage.height!,
              url: seoImage?.url,
              width: seoImage.width!,
            },
          ],
        }
      : null,
    robots: {
      follow: canIndex,
      googleBot: {
        follow: canIndex,
        index: canIndex,
      },
      index: canIndex,
    },
    title: product.meta?.title || product.title,
  }
}

export default async function ProductPage({ params }: Args) {
  const { slug } = await params
  const product = await queryProductBySlug({ slug })

  if (!product) return notFound()

  const gallery =
    product.gallery
      ?.filter((item) => typeof item.image === 'object')
      .map((item) => ({
        ...item,
        image: item.image as Media,
      })) || []

  const metaImage = typeof product.meta?.image === 'object' ? product.meta?.image : undefined
  const hasStock = product.enableVariants
    ? product?.variants?.docs?.some((variant) => {
        if (typeof variant !== 'object') return false
        return variant.inventory && variant?.inventory > 0
      })
    : product.inventory! > 0

  let price = product.priceInNGN

  if (product.enableVariants && product?.variants?.docs?.length) {
    price = product?.variants?.docs?.reduce((acc, variant) => {
      if (typeof variant === 'object' && variant?.priceInNGN && acc && variant?.priceInNGN > acc) {
        return variant.priceInNGN
      }
      return acc
    }, price)
  }

  const productJsonLd = {
    name: product.title,
    '@context': 'https://schema.org',
    '@type': 'Product',
    description: product.description,
    image: metaImage?.url,
    offers: {
      '@type': 'AggregateOffer',
      availability: hasStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      price: price,
      priceCurrency: 'NGN',
    },
  }

  const relatedProducts =
    product.relatedProducts?.filter((relatedProduct) => typeof relatedProduct === 'object') ?? []

  return (
    <React.Fragment>
      <script
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
        type="application/ld+json"
      />
      <Section paddingY="xs">
        <Container>
          <Button asChild variant="ghost" className="mb-4">
            <Link href="/shop">
              <ChevronLeftIcon />
              All products
            </Link>
          </Button>
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-8">
            <div className="h-full w-full basis-full lg:basis-1/2 lg:sticky lg:top-14">
              <Suspense
                fallback={
                  <div className="relative aspect-square h-full max-h-137.5 w-full overflow-hidden" />
                }
              >
                {Boolean(gallery?.length) && (
                  <Gallery gallery={gallery} variantTypes={product.variantTypes} />
                )}
              </Suspense>
            </div>

            <div className="basis-full lg:basis-1/2 lg:sticky lg:top-14">
              <ProductDescription product={product} />
            </div>
          </div>
        </Container>
      </Section>

      {/* Shipping Timeline & Size Guide */}
      <Section paddingY="md">
        <Container>
          <div className="grid gap-6 lg:grid-cols-2">
            <ShippingTimeline />
            <SizeGuide />
          </div>
        </Container>
      </Section>

      {/* Related Products */}
      {relatedProducts.length ? (
        <Section paddingY="none">
          <Container>
            <RelatedProducts products={relatedProducts} />
          </Container>
        </Section>
      ) : null}

      {/* Sticky Add to Cart - Mobile Only */}
      <Suspense fallback={null}>
        <StickyAddToCart product={product} />
      </Suspense>
    </React.Fragment>
  )
}

function RelatedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <ul className="flex w-full gap-4 overflow-x-auto pt-1">
        {products.map((product) => (
          <li
            className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5"
            key={product.id}
          >
            <Link className="relative h-full w-full" href={`/products/${product.slug}`}>
              <GridTileImage
                label={{
                  amount: product.priceInNGN!,
                  title: product.title,
                }}
                media={product.meta?.image as Media}
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

const queryProductBySlug = async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'products',
    depth: 3,
    draft,
    limit: 1,
    overrideAccess: draft,
    pagination: false,
    where: {
      and: [
        {
          slug: {
            equals: slug,
          },
        },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    populate: {
      variants: {
        title: true,
        priceInNGN: true,
        inventory: true,
        options: true,
      },
    },
  })

  return result.docs?.[0] || null
}
