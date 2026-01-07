import { ProductGridItem } from '@/components/product/grid-item'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Fragment } from 'react'
import { NoProductFound } from './_components/no-product-found'
import { Pagination } from '@/components/pagination'
import type { Metadata } from 'next'

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

  return {
    title: 'Shop All Products',
    description: !category
      ? 'Browse our complete collection of fashion items. Filter by category, sort by price, and find your perfect style. Quality clothing and accessories with fast shipping in Nigeria.'
      : `Browse our collection of ${categoryName} items. Find your perfect style with quality clothing and accessories, all available with fast shipping in Nigeria.`,
    alternates: {
      canonical: category ? `${shopUrl}?category=${category}` : shopUrl,
    },
  }
}

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category, page } = await searchParams
  const currentPage = Number(page) || 1
  const payload = await getPayload({ config: configPromise })

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
    ...(sort ? { sort } : { sort: 'title' }),
    ...(searchValue || category
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
