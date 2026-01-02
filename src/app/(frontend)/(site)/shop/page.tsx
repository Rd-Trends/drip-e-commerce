import { ProductGridItem } from '@/components/product/grid-item'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Fragment } from 'react'
import { NoProductFound } from './_components/no-product-found'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  return {
    title: 'Shop All Products',
    description:
      'Browse our complete collection of fashion items. Filter by category, sort by price, and find your perfect style. Quality clothing and accessories with fast shipping in Nigeria.',
    alternates: {
      canonical: `${baseUrl}/shop`,
    },
  }
}

type SearchParams = { [key: string]: string | string[] | undefined }

type Props = {
  searchParams: Promise<SearchParams>
}

export default async function ShopPage({ searchParams }: Props) {
  const { q: searchValue, sort, category } = await searchParams
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
    select: {
      title: true,
      slug: true,
      gallery: true,
      categories: true,
      priceInNGN: true,
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

  const resultsText = products.docs.length > 1 ? 'results' : 'result'

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
        <section className="grid grid-cols-2 lg:grid-cols-3 gap-2 gap-y-6 md:gap-6">
          {products.docs.map((product) => {
            return <ProductGridItem key={product.id} product={product} />
          })}
        </section>
      ) : null}
    </Fragment>
  )
}
