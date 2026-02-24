import { ProductGridItem } from '@/components/product/grid-item'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Fragment } from 'react'
import { NoProductFound } from './_components/no-product-found'
import { Pagination } from '@/components/pagination'
import { sorting, defaultSort } from '@/lib/constants'
import type { Metadata } from 'next'
import { mergeOpenGraph } from '@/utils/merge-open-graph'

const PRODUCTS_PER_PAGE = 18

type SearchParams = Record<string, string | string[] | undefined>

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}): Promise<Metadata> {
  const params = await searchParams
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  const shopUrl = `${baseUrl}/shop`

  const category = Array.isArray(params.category) ? params.category[0] : params.category
  const categoryName = category
    ?.split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const canonicalUrl = category ? `${shopUrl}?category=${category}` : shopUrl
  const pageTitle = !category ? 'Shop All Products' : `Shop ${categoryName} Collection`
  const pageDescription = !category
    ? 'Browse our complete collection of fashion items. Filter by category, sort by price, and find your perfect style. Quality clothing and accessories with fast shipping in Nigeria.'
    : `Browse our collection of ${categoryName} items. Find your perfect style with quality clothing and accessories, all available with fast shipping in Nigeria.`

  return {
    title: pageTitle,
    description: pageDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: mergeOpenGraph({
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
    }),
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: ['/og-image.jpg'],
    },
  }
}

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category, page, featured } = await searchParams
  const currentPage = Number(page) || 1
  const payload = await getPayload({ config: configPromise })

  // Map URL-friendly sort param to Payload sort value
  const sortOption = sort ? sorting.find((item) => item.slug === sort) : defaultSort
  const sortValue = sortOption?.sortValue || defaultSort.sortValue

  // Check if we should filter by featured products
  const isFeaturedFilter = featured === 'true'

  // If category slug(s) is provided, find the category ID(s)
  let categoryIds: number[] = []
  if (category) {
    const categorySlugs = Array.isArray(category) ? category : [category]
    const categoryDocs = await payload.find({
      collection: 'categories',
      where: {
        slug: {
          in: categorySlugs,
        },
      },
      limit: categorySlugs.length,
    })
    categoryIds = categoryDocs.docs.map((doc) => doc.id)
  }

  const products = await payload.find({
    collection: 'products',
    draft: false,
    overrideAccess: false,
    limit: PRODUCTS_PER_PAGE,
    page: currentPage,
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInNGN: true,
      isFeatured: true,
    },
    sort: sortValue,
    ...(searchValue || category || isFeaturedFilter
      ? {
          where: {
            and: [
              {
                _status: {
                  equals: 'published',
                },
              },
              ...(searchValue
                ? [
                    {
                      or: [
                        {
                          title: {
                            like: searchValue,
                          },
                        },
                        {
                          'meta.description': {
                            like: searchValue,
                          },
                        },
                      ],
                    },
                  ]
                : []),
              ...(categoryIds.length > 0
                ? [
                    {
                      categories: {
                        in: categoryIds,
                      },
                    },
                  ]
                : []),
              ...(isFeaturedFilter
                ? [
                    {
                      isFeatured: {
                        equals: true,
                      },
                    },
                  ]
                : []),
            ],
          },
        }
      : {}),
  })

  const resultsText = products.totalDocs > 1 ? 'results' : 'result'
  const totalPages = products.totalPages

  return (
    <Fragment>
      {!!searchValue && !!products.docs?.length && (
        <p className="mb-4">
          {`Showing ${products.docs.length} ${resultsText} for `}
          <span className="font-bold">&quot;{searchValue}&quot;</span>
        </p>
      )}

      {!searchValue && products.docs?.length === 0 && (
        <NoProductFound searchQuery={searchValue as string} categories={categoryIds} />
      )}

      {products?.docs.length > 0 ? (
        <>
          <section className="grid grid-cols-2 lg:grid-cols-3 gap-2 gap-y-6 md:gap-6">
            {products.docs.map((product) => {
              return <ProductGridItem key={product.id} product={product} />
            })}
          </section>

          {/* Pagination */}

          <Pagination
            className="mt-12"
            totalPages={totalPages}
            currentPage={currentPage}
            scrollToTop
            scrollTarget={0}
          />
        </>
      ) : null}
    </Fragment>
  )
}
