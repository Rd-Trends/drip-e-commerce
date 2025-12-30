import { FilterDropdowns } from './_components/dropdowns'
import { CategoryList, SortingList } from './_components/lists'
import Section from '@/components/layout/section'
import Container from '@/components/layout/container'

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <FilterDropdowns />

      <Section paddingY="xs">
        <Container className="flex flex-col md:flex-row items-start justify-between gap-16 md:gap-4">
          <div className="w-full hidden md:flex flex-col gap-4 md:gap-8 basis-1/5">
            <CategoryList />
            <SortingList />
          </div>
          <div className="min-h-screen w-full">{children}</div>
        </Container>
      </Section>
    </div>
  )
}
