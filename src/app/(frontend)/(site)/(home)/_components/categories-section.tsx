import Link from 'next/link'
import Image from 'next/image'
import { Tag } from 'lucide-react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Section } from '@/components/layout/section'
import Container from '@/components/layout/container'
import { Category, Media } from '@/payload-types'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { Suspense } from 'react'

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
      <div className="flex w-max space-x-4 p-1">
        {categories.map((category) => {
          const categoryImage = typeof category.image === 'object' ? category.image : null

          return (
            <Link
              key={category.id}
              href={`/shop?category=${category.slug}`}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors overflow-hidden">
                {categoryImage?.url ? (
                  <Image
                    src={categoryImage.url}
                    alt={categoryImage.alt || category.title}
                    width={64}
                    height={64}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform"
                  />
                ) : (
                  <Tag className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                )}
              </div>
              <span className="text-xs font-medium">{category.title}</span>
            </Link>
          )
        })}
        {/* Fallback if no categories */}
        {categories.length === 0 &&
          ['Shirts', 'Pants', 'Dresses', 'Jackets', 'Shoes'].map((cat) => (
            <div key={cat} className="flex flex-col items-center gap-2">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Tag className="h-6 w-6 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium">{cat}</span>
            </div>
          ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  )
}

function CategoriesListSkeleton() {
  return (
    <ScrollArea className="w-full whitespace-nowrap rounded-md border-none">
      <div className="flex w-max space-x-4 p-1">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="h-16 w-16 rounded-full bg-muted animate-pulse" />
            <div className="h-3 w-12 bg-muted rounded animate-pulse" />
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
        depth: 1, // Populate the image relationship
        limit: 8,
      })

      return categories
    },
    ['categories_section'],
    {
      tags: ['categories'],
    },
  )
