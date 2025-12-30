
import configPromise from '@payload-config'
import { getPayload, Where } from 'payload'
import { Section } from '@/components/layout/section'
import Container from '@/components/layout/container'
import { Category, Home } from '@/payload-types'
import { ProductGridItem, ProductGridItemSkeleton } from '@/components/product/grid-item'
import { LinkButton } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { unstable_cache } from 'next/cache'
import { Suspense } from 'react'

type SectionType = NonNullable<Home['productSections']>[number]['type']

type ProductSectionProps = {
  title: string
  showViewAll?: boolean
  type: SectionType
  category?: Category | number
}

export function ProductSection({ title, showViewAll = true, type, category }: ProductSectionProps) {
  const categoryID = typeof category === 'number' ? category : category?.id
  const categorySlug = typeof category === 'number' ? '' : category?.slug

  return (
    <Section paddingY="sm">
      <Container>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          {showViewAll && (
            <LinkButton
              href={getViewAllLink(type, categorySlug)}
              variant="ghost"
              size="sm"
              className="group"
            >
              View All
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </LinkButton>
          )}
        </div>

        <Suspense fallback={<ProductListSkeleton />}>
          <ProductList type={type} categoryID={categoryID} />
        </Suspense>
      </Container>
    </Section>
  )
}

async function ProductList({ type, categoryID }: { type: SectionType; categoryID?: number }) {
  const products = await getCachedProductsByType(type, categoryID)()

  return (
    <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 gap-y-6 md:gap-6">
      {products.map((product) => {
        return <ProductGridItem key={product.id} product={product} />
      })}
    </section>
  )
}

function ProductListSkeleton() {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 gap-y-6 md:gap-6">
      {[1, 2, 3, 4].map((product) => {
        return <ProductGridItemSkeleton key={product} />
      })}
    </section>
  )
}

const getViewAllLink = (type: SectionType, categorySlug?: string) => {
  switch (type) {
    case 'category':
      return categorySlug ? `/shop?category=${categorySlug}` : '/shop'
    case 'featured':
      return '/shop?featured=true'
    case 'latest':
      return '/shop?sort=latest'
    case 'hottest':
      return '/shop?sort=hottest'
    default:
      return '/shop'
  }
}

const getCachedProductsByType = (type: SectionType, categoryID?: number) =>
  unstable_cache(
    async () => {
      return getProductsByType(type, categoryID)
    },
    [type, ...(categoryID ? [String(categoryID)] : [])],
    {
      tags: [
        'products_section',
        ...(!!categoryID
          ? [`products_section_${type}_${categoryID}`]
          : [`products_section_${type}`]),
      ],
    },
  )

export const getProductsByType = async (type: SectionType, categoryID?: number) => {
  const payload = await getPayload({ config: configPromise })

  const query: Where = {
    _status: { equals: 'published' },
  }
  let sort = '-createdAt'

  switch (type) {
    case 'featured': {
      query.isFeatured = { equals: true }
      break
    }
    case 'latest': {
      sort = '-createdAt'
      break
    }
    case 'hottest': {
      break
    }
    case 'category': {
      if (categoryID) {
        query.categories = { contains: categoryID }
      }
    }
  }

  const { docs: products = [] } = await payload.find({
    collection: 'products',
    limit: 4,
    where: query,
    sort,
  })

  return products
}
