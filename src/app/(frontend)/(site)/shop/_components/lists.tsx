import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Suspense } from 'react'
import { FilterList, FilterListLoader } from '@/components/filter/list'
import { sorting } from '@/lib/constants'
import { unstable_cache } from 'next/cache'
import { queryKeys } from '@/lib/query-keys'

async function Categories() {
  const categories = await getCachedCategoryList()

  return (
    <FilterList
      list={[{ title: 'All', path: '/shop' }, ...categories]}
      title="Categories"
      queryKey="category"
    />
  )
}

export function CategoryList() {
  return (
    <Suspense fallback={<FilterListLoader title="Categories" />}>
      <Categories />
    </Suspense>
  )
}

export function SortingList() {
  return (
    <Suspense fallback={<FilterListLoader title="Sort by" />}>
      <FilterList list={sorting} title="Sort by" />
    </Suspense>
  )
}

const featuredOptions = [
  { title: 'All Products', path: '/shop' },
  { title: 'Featured Only', slug: 'true' },
]

export function FeaturedList() {
  return (
    <Suspense fallback={<FilterListLoader title="Featured" />}>
      <FilterList list={featuredOptions} title="Featured" queryKey="featured" />
    </Suspense>
  )
}

export const getCachedCategoryList = unstable_cache(
  async () => {
    const payload = await getPayload({ config: configPromise })

    const categories = await payload.find({
      collection: 'categories',
      sort: 'title',
      limit: 0,
      pagination: false,
    })

    return categories.docs || []
  },
  ['category_filter_list'],
  {
    tags: [queryKeys.revalidation.categories],
    revalidate: 3600,
  },
)
