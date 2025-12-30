'use client'

import { Package } from 'lucide-react'
import { LinkButton } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

interface ProductListEmptyProps {
  searchQuery?: string
  categories?: number[]
}

export function NoProductFound({ searchQuery, categories }: ProductListEmptyProps) {
  const getTitle = () => {
    if (searchQuery) return 'No Products Found'
    if (!!categories?.length) return 'No Matching Products'
    return 'No Products Yet'
  }

  const getDescription = () => {
    if (searchQuery && !!categories?.length) {
      return `No products match "${searchQuery}" with your current filters. Try adjusting your search or filters.`
    }
    if (searchQuery) {
      return `No products match "${searchQuery}". Try a different search term or add your first product.`
    }
    if (!!categories?.length) {
      return 'No products match your selected filters. Try adjusting your filter criteria or clearing them.'
    }
    return "Sorry we haven't added any products yet. Get started by adding your first product to the catalog."
  }

  const showClearButton = searchQuery || !!categories?.length

  return (
    <Empty className="my-16">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Package />
        </EmptyMedia>
        <EmptyTitle>{getTitle()}</EmptyTitle>
        <EmptyDescription>{getDescription()}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          {showClearButton && (
            <LinkButton href="/shop" variant="outline">
              Clear{' '}
              {searchQuery && !!categories?.length
                ? 'All'
                : !!categories?.length
                  ? 'Filters'
                  : 'Search'}
            </LinkButton>
          )}
        </div>
      </EmptyContent>
    </Empty>
  )
}
