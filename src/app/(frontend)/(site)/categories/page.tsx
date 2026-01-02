import Container from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { queryKeys } from '@/lib/query-keys'
import { CategoryCard, CategoryCardSkeleton } from '@/components/grid/category-card'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { FolderOpen } from 'lucide-react'

import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Shop by Category',
  description:
    'Explore all fashion categories at Drip. Browse clothing, accessories, footwear, and more. Find your perfect style organized by product type.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/categories`,
  },
}

export default function CategoriesPage() {
  return (
    <Section paddingY="xs" className="pb-20">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shop by Category</h1>
          <p className="text-muted-foreground">
            Explore our collection by browsing through all available categories
          </p>
        </div>

        <Suspense fallback={<CategoryListSkeleton />}>
          <CategoryList />
        </Suspense>
      </Container>
    </Section>
  )
}

async function CategoryList() {
  const categories = await getCachedCategories()

  if (!categories || categories.length === 0) {
    return (
      <Empty className="my-16">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FolderOpen className="h-12 w-12" />
          </EmptyMedia>
          <EmptyTitle>No categories found</EmptyTitle>
          <EmptyDescription>There are no categories available at the moment.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6 lg:gap-6">
      {categories.map((category) => {
        return <CategoryCard key={category.id} category={category} />
      })}
    </div>
  )
}

const getCachedCategories = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    // Fetch all categories
    const { docs: categories = [] } = await payload.find({
      collection: 'categories',
      sort: 'title',
      pagination: false,
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
  ['all_categories_page'],
  {
    tags: [queryKeys.revalidation.categories],
  },
)

function CategoryListSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6 lg:gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  )
}
