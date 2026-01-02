import Link from 'next/link'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Section } from '@/components/layout/section'
import Container from '@/components/layout/container'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { Suspense } from 'react'
import { queryKeys } from '@/lib/query-keys'
import { CategoryCard, CategoryCardSkeleton } from '@/components/grid/category-card'

export function CategoriesSection() {
  return (
    <Section paddingY="sm">
      <Container>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Categories</h2>
          <Link href="/categories" className="text-sm text-primary hover:underline">
            See All
          </Link>
        </div>
        <Suspense fallback={<CategoriesListSkeleton />}>
          <CategoriesList />
        </Suspense>
      </Container>
    </Section>
  )
}

async function CategoriesList() {
  const categories = await getCachedCategories()()

  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max space-x-4 pb-4">
        {categories.map((category) => {
          return (
            <div key={category.id} className="w-38">
              <CategoryCard category={category} />
            </div>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function CategoriesListSkeleton() {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex w-max space-x-4 pb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="w-38">
            <CategoryCardSkeleton />
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

const getCachedCategories = () =>
  unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise })

      const { docs: categories = [] } = await payload.find({
        collection: 'categories',
        sort: 'title',
        limit: 8,
      })

      // Fetch product counts for each category
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const { totalDocs } = await payload.find({
            collection: 'products',
            where: {
              and: [
                {
                  _status: {
                    equals: 'published',
                  },
                },
                {
                  categories: {
                    contains: category.id,
                  },
                },
              ],
            },
            limit: 0, // We only need the count
          })

          return {
            ...category,
            productCount: totalDocs,
          }
        }),
      )

      return categoriesWithCounts
    },
    ['categories_section'],
    {
      tags: [queryKeys.revalidation.categories],
    },
  )
