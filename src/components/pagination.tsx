'use client'

import { useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { usePagination, DOTS } from '@/hooks/use-pagination'

export interface PaginationProps {
  /** Total number of pages */
  totalPages: number

  /** Current page number (1-indexed) */
  currentPage?: number

  /** Number of siblings on each side of current page, defaults to 1 */
  siblings?: number

  /** Number of boundary pages to show, defaults to 1 */
  boundaries?: number

  /** Custom onChange handler (optional, will use URL params by default) */
  onChange?: (page: number) => void

  /** Whether to use URL search params for pagination (default: true) */
  useSearchParams?: boolean

  /** Query parameter name for page number (default: 'page') */
  pageParamName?: string

  /** Custom class name for the root pagination element */
  className?: string

  /** Whether to show Previous/Next buttons (default: true) */
  showControls?: boolean

  /** Whether to scroll to top on page change (default: false) */
  scrollToTop?: boolean

  /** Scroll target selector or offset from top (default: 0) */
  scrollTarget?: string | number
}

export function Pagination({
  totalPages,
  currentPage: controlledPage,
  siblings = 1,
  boundaries = 1,
  onChange: controlledOnChange,
  useSearchParams: useUrlParams = true,
  pageParamName = 'page',
  className,
  showControls = true,
  scrollToTop = false,
  scrollTarget = 0,
}: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get current page from URL if not controlled
  const urlPage = Number(searchParams.get(pageParamName)) || 1
  const initialPage = controlledPage ?? urlPage

  const handlePageChange = useCallback(
    (page: number) => {
      // Call controlled onChange if provided
      if (controlledOnChange) {
        controlledOnChange(page)
      }

      // Update URL params if enabled
      if (useUrlParams) {
        const params = new URLSearchParams(searchParams.toString())
        if (page === 1) {
          params.delete(pageParamName)
        } else {
          params.set(pageParamName, String(page))
        }

        const queryString = params.toString()
        const url = queryString ? `${pathname}?${queryString}` : pathname
        router.push(url, { scroll: false })
      }

      // Handle scroll behavior
      if (scrollToTop) {
        if (typeof scrollTarget === 'string') {
          // Scroll to element with selector
          const element = document.querySelector(scrollTarget)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        } else {
          // Scroll to offset from top
          window.scrollTo({ top: scrollTarget, behavior: 'smooth' })
        }
      }
    },
    [
      controlledOnChange,
      useUrlParams,
      searchParams,
      pathname,
      pageParamName,
      router,
      scrollToTop,
      scrollTarget,
    ],
  )

  const pagination = usePagination({
    total: totalPages,
    page: initialPage,
    siblings,
    boundaries,
    onChange: handlePageChange,
  })

  const createPageUrl = (page: number) => {
    if (!useUrlParams) return '#'

    const params = new URLSearchParams(searchParams.toString())
    if (page === 1) {
      params.delete(pageParamName)
    } else {
      params.set(pageParamName, String(page))
    }

    const queryString = params.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }

     // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null
  }

  return (
    <PaginationRoot className={className}>
      <PaginationContent>
        {/* Previous Button */}
        {showControls && (
          <PaginationItem>
            <PaginationPrevious
              href={createPageUrl(pagination.active - 1)}
              onClick={(e) => {
                if (pagination.active === 1) {
                  e.preventDefault()
                  return
                }
                if (!useUrlParams) {
                  e.preventDefault()
                  pagination.previous()
                }
              }}
              className={
                pagination.active === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'
              }
            />
          </PaginationItem>
        )}

        {/* Page Numbers */}
        {pagination.range.map((page, index) => {
          if (page === DOTS) {
            return (
              <PaginationItem key={`dots-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }

          const pageNumber = page as number
          const isActive = pageNumber === pagination.active

          return (
            <PaginationItem key={pageNumber}>
              <PaginationLink
                href={createPageUrl(pageNumber)}
                isActive={isActive}
                onClick={(e) => {
                  if (!useUrlParams) {
                    e.preventDefault()
                    pagination.setPage(pageNumber)
                  }
                }}
                className="cursor-pointer"
                aria-label={`Go to page ${pageNumber}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          )
        })}

        {/* Next Button */}
        {showControls && (
          <PaginationItem>
            <PaginationNext
              href={createPageUrl(pagination.active + 1)}
              onClick={(e) => {
                if (pagination.active === totalPages) {
                  e.preventDefault()
                  return
                }
                if (!useUrlParams) {
                  e.preventDefault()
                  pagination.next()
                }
              }}
              className={
                pagination.active === totalPages
                  ? 'pointer-events-none opacity-50'
                  : 'cursor-pointer'
              }
            />
          </PaginationItem>
        )}
      </PaginationContent>
    </PaginationRoot>
  )
}
