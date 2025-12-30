import Link from 'next/link'
import Container from '@/components/layout/container'
import { Section } from '@/components/layout/section'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { queryKeys } from '@/lib/query-keys'

export const metadata = {
  title: 'Shop by Category',
  description: 'Browse all product categories and find what you are looking for.',
}

export default async function CategoriesPage() {
  const categories = await getCachedCategories()

  return (
    <Section paddingY="xs">
      <Container>
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Shop by Category</h1>
          <p className="text-muted-foreground">
            Explore our collection by browsing through all available categories
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No categories available</h2>
            <p className="text-muted-foreground">Check back later for updates</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 lg:gap-6">
            {categories.map((category) => {
              return (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="text-sm md:text-base hover:underline underline-offset-4"
                >
                  {category.title}{' '}
                  {category.productCount !== undefined && `(${category.productCount})`}
                </Link>
              )
            })}
          </div>
        )}
      </Container>
    </Section>
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
