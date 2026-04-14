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
import { AdminActionButton } from '@/components/ui/admin-action-button'
import { FolderOpen } from 'lucide-react'
import { Pagination } from '@/components/pagination'
import type { Metadata } from 'next'
import { Suspense } from 'react'

const CATEGORIES_PER_PAGE = 24

type SearchParams = Record<string, string | string[] | undefined>

type Props = {
  searchParams: Promise<SearchParams>
}

export const metadata: Metadata = {
  title: 'Shop by Category',
  description:
    'Explore all fashion categories at Drip. Browse clothing, accessories, footwear, and more. Find your perfect style organized by product type.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}/categories`,
  },
}

export default async function CategoriesPage({ searchParams }: Props) {
  const { page } = await searchParams
  const currentPage = Number(page) || 1

  return (
    <Section paddingY="xs" className="mb-20">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shop by Category</h1>
          <p className="text-muted-foreground">
            Explore our collection by browsing through all available categories
          </p>
        </div>

        <Suspense fallback={<CategoryListSkeleton />}>
          <CategoryList currentPage={currentPage} />
        </Suspense>
      </Container>
    </Section>
  )
}

async function CategoryList({ currentPage }: { currentPage: number }) {
  const { categories, totalPages } = await getCachedCategories(currentPage)

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
        <EmptyContent>
          <AdminActionButton
            permission="canManageCategories"
            href="/admin/collections/categories/create"
          >
            Create Category
          </AdminActionButton>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6 lg:gap-6">
        {categories.map((category) => {
          return <CategoryCard key={category.id} category={category} />
        })}
      </div>

      {totalPages > 1 && (
        <Pagination className="mt-12" totalPages={totalPages} currentPage={currentPage} />
      )}
    </>
  )
}

const getCachedCategories = unstable_cache(
  async (page: number) => {
    const payload = await getPayload({ config: configPromise })

    // Fetch paginated categories
    const result = await payload.find({
      collection: 'categories',
      sort: 'title',
      limit: CATEGORIES_PER_PAGE,
      page,
    })

    const { docs: categories = [], totalPages } = result

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

    return {
      categories: categoriesWithCounts,
      totalPages,
    }
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
