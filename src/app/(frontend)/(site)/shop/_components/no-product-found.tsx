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
import { usePermissions } from '@/hooks/use-access'

interface ProductListEmptyProps {
  searchQuery?: string
  categories?: number[]
}

export function NoProductFound({ searchQuery, categories }: ProductListEmptyProps) {
  const { canWriteProducts, isLoading } = usePermissions()
  const hasSelectedCategories = !!categories?.length
  const canCreateProduct = !isLoading && canWriteProducts

  const getTitle = () => {
    if (searchQuery) return 'No Products Found'
    if (hasSelectedCategories) return 'No Matching Products'
    return 'No Products Yet'
  }

  const getDescription = () => {
    if (searchQuery && hasSelectedCategories) {
      return `No products match "${searchQuery}" with your current filters. Try adjusting your search or filters.`
    }
    if (searchQuery) {
      return canCreateProduct
        ? `No products match "${searchQuery}". Try a different search term or add a new product.`
        : `No products match "${searchQuery}". Try a different search term.`
    }
    if (hasSelectedCategories) {
      return 'No products match your selected filters. Try adjusting your filter criteria or clearing them.'
    }
    return canCreateProduct
      ? 'No products have been added yet. Add the first product to the catalog.'
      : "We're getting our collection ready. Please check back soon."
  }

  const showClearButton = Boolean(searchQuery || hasSelectedCategories)

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
            <LinkButton href="/shop" variant="outline" scrollToTop>
              Clear{' '}
              {searchQuery && hasSelectedCategories
                ? 'All'
                : hasSelectedCategories
                  ? 'Filters'
                  : 'Search'}
            </LinkButton>
          )}
          {canCreateProduct && (
            <LinkButton href="/admin/collections/products/create" variant="default">
              Create Product
            </LinkButton>
          )}
        </div>
      </EmptyContent>
    </Empty>
  )
}
