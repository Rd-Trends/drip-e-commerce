import { FilterDropdowns } from './_components/dropdowns'
import { CategoryList, SortingList, FeaturedList } from './_components/lists'
import Section from '@/components/layout/section'
import Container from '@/components/layout/container'
import { Fragment, Suspense } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ScrollToTop } from './_components/scroll-to-top'

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <Fragment>
      <Suspense>
        <ScrollToTop />
      </Suspense>
      <FilterDropdowns />

      <Section paddingY="none">
        <Container className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-4">
          <ScrollArea className="w-full h-[calc(100lvh-var(--navbar-height)-var(--banner-height))] py-6 hidden md:block basis-1/5">
            <div className="flex flex-col gap-8 pb-20">
              <FeaturedList />
              <SortingList />
              <CategoryList />
            </div>
          </ScrollArea>
          <div className="min-h-screen w-full py-6 md:py-8 pb-20">{children}</div>
        </Container>
      </Section>
    </Fragment>
  )
}
