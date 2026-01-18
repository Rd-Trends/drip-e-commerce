import FilterDropdown from '@/components/filter/dropdown'
import { Skeleton } from '@/components/ui/skeleton'
import { sorting } from '@/lib/constants'
import { Suspense } from 'react'
import { getCachedCategoryList } from './lists'

async function CategoryDropdown() {
  const categories = await getCachedCategoryList()

  return (
    <FilterDropdown
      list={[{ title: 'All', path: '/shop' }, ...categories]}
      title="Categories"
      placeholder="Filter by "
      queryKey="category"
    />
  )
}

export const FilterDropdowns = () => {
  return (
    <div
      className={
        'w-full flex items-start justify-between gap-4 md:hidden py-3 px-4 ' +
        'border-b h-fit sticky top-16 bg-background/95 backdrop-blur-md z-50 '
      }
    >
      <Suspense fallback={<Skeleton className="flex-1 h-9 rounded-full" />}>
        <CategoryDropdown />
      </Suspense>
      <Suspense fallback={<Skeleton className="flex-1 h-9 rounded-full" />}>
        <FilterDropdown list={sorting} title="Sort by" placeholder="Sort by" />
      </Suspense>
    </div>
  )
}
