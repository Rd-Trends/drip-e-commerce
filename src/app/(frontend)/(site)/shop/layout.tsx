import { Suspense } from 'react'
import { FilterDropdowns } from './_components/dropdowns'
import { CategoryList, SortingList } from './_components/lists'
import { Search, SearchSkeleton } from './_components/search'

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full mx-auto container py-10 ">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Suspense fallback={<SearchSkeleton />}>
          <Search />
        </Suspense>
        <FilterDropdowns />
      </div>

      <div className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-4">
        <div className="w-full flex-none flex flex-col gap-4 md:gap-8 basis-1/5">
          <CategoryList />
          <SortingList />
        </div>
        <div className="min-h-screen w-full">{children}</div>
      </div>
    </div>
    // <div className="mx-auto flex max-w-(--breakpoint-2xl) flex-col md:gap-x-8 text-black md:flex-row dark:text-white md:pt-0">
    //   <FilterDropdowns />

    //   <div
    //     className={
    //       'order-first hidden md:block flex-none w-full md:max-w-40 pt-6 pl-8 ' +
    //       'md:sticky md:top-16 md:self-start md:h-fit'
    //     }
    //   >
    //     <CategoryList />
    //   </div>
    //   <main className="order-last min-h-screen w-full md:order-0 pt-4 md:pt-6 px-4 md:px-6 xl:px-10">
    //     {children}
    //   </main>
    //   <div
    //     className={
    //       'order-0 flex-none md:order-last hidden md:block w-full md:max-w-40 pt-6 pr-8 ' +
    //       'md:sticky md:top-16 md:self-start md:h-fit '
    //     }
    //   >
    //     <SortingList />
    //   </div>
    // </div>
  )
}
