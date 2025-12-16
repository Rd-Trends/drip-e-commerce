import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { Suspense } from 'react'
import { FilterList, FilterListLoader } from '@/components/filter/list'
import { sorting } from '@/lib/constants'

async function Categories() {
  const payload = await getPayload({ config: configPromise })

  const categories = await payload.find({
    collection: 'categories',
    sort: 'title',
  })

  return (
    <FilterList
      list={[{ title: 'All', path: '/shop' }, ...categories.docs]}
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
