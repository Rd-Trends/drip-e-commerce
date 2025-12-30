import Link from 'next/link'
import { Tag } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Section } from '@/components/layout/section'
import Container from '@/components/layout/container'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { Suspense } from 'react'
import { queryKeys } from '@/lib/query-keys'

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
    <ScrollArea className="w-full whitespace-nowrap rounded-md border-none">
      <div className="flex w-max min-w-full space-x-4 p-1">
        {categories.map((category) => {
          return (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="xl:flex-1 flex flex-col items-center gap-2 group xl:border rounded-xl p-4"
            >
              <div className="size-16 xl:size-24 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors overflow-hidden">
                <Tag className="size-6 xl:size-8 text-muted-foreground group-hover:text-primary" />
              </div>
              <span className="text-xs xl:text-base font-medium">{category.title}</span>
            </Link>
          )
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function CategoriesListSkeleton() {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border-none">
      <div className="flex w-max min-w-full space-x-4 p-1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div
            key={i}
            className="xl:flex-1 flex flex-col items-center gap-2 xl:border rounded-xl p-4"
          >
            <div className="size-16 xl:size-24 rounded-full bg-muted animate-pulse" />
            <div className="h-3 xl:h-4 w-12 xl:w-16 bg-muted rounded animate-pulse" />
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

      return categories
    },
    ['categories_section'],
    {
      tags: [queryKeys.revalidation.categories],
    },
  )
