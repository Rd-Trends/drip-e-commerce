'use client'

import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Pagination } from '@payloadcms/ui'
import { PaginatedDocs } from 'payload'
import { formatCurrency } from '@/utils/format-currency'
import { queryKeys } from '@/lib/query-keys'
import { buildTimelineParams, analyticsFetcher } from '../utils'
import type { TimelineRange } from '../timeline-filter'

interface ProductData {
  id: string
  title: string
  revenue: number
  quantity: number
}

type TopProductsResponse = PaginatedDocs<ProductData>

interface TopProductsProps {
  timelineRange: TimelineRange
}

export function TopProducts({ timelineRange }: TopProductsProps) {
  const [page, setPage] = useState(1)

  const params = buildTimelineParams(timelineRange)
  params.append('page', page.toString())
  params.append('limit', '10')

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.analytics.topProducts(params.toString(), page),
    queryFn: () =>
      analyticsFetcher<TopProductsResponse>(`/api/analytics/top-products?${params.toString()}`),
    placeholderData: (prev: TopProductsResponse | undefined) => prev,
  })

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  if (isLoading) {
    return <TopProductsLoading />
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error.message}</p>
        <button className="error-state__retry" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    )
  }

  if (!data || data.docs.length === 0) {
    return (
      <div className="analytics-section">
        <div className="analytics-section-header">
          <h3 className="analytics-section-title">Top Selling Products</h3>
        </div>
        <div className="empty-state">
          <p>No product data available for this period</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-section">
      <div className="analytics-section-header">
        <h3 className="analytics-section-title">Top Selling Products</h3>
      </div>
      <div className="table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Product</th>
              <th>Units Sold</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {data.docs.map((product, index) => (
              <tr key={product.id}>
                <td>{((data?.page ?? 1) - 1) * 10 + index + 1}</td>
                <td>
                  <a href={`/admin/collections/products/${product.id}`} className="table-link">
                    {product.title}
                  </a>
                </td>
                <td>{product.quantity}</td>
                <td>{formatCurrency(product.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalPages > 1 && (
        <div className="pagination-wrapper">
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={handlePageChange}
            hasNextPage={data.hasNextPage}
            hasPrevPage={data.hasPrevPage}
          />
        </div>
      )}
    </div>
  )
}

function TopProductsLoading() {
  return (
    <div className="analytics-section">
      <div className="analytics-section-header">
        <div className="skeleton skeleton--md" />
      </div>
      <div className="table-container">
        <div className="skeleton skeleton--full" />
      </div>
    </div>
  )
}
