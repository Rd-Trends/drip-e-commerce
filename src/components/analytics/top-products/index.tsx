'use client'

import React, { useEffect, useState } from 'react'
import { Pagination } from '@payloadcms/ui'
import { PaginatedDocs } from 'payload'
import { formatCurrency } from '@/utils/format-currency'
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
  const [data, setData] = useState<TopProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true)
      setError(null)

      try {
        // Build query params
        const params = new URLSearchParams()

        if (timelineRange.period && timelineRange.period !== 'custom') {
          const periodMap = { '24h': '1', '7d': '7', '30d': '30' }
          params.append('period', periodMap[timelineRange.period] || '30')
        } else if (timelineRange.startDate && timelineRange.endDate) {
          params.append('startDate', timelineRange.startDate.toISOString())
          params.append('endDate', timelineRange.endDate.toISOString())
        } else {
          params.append('period', '30')
        }

        params.append('page', page.toString())
        params.append('limit', '10')

        const response = await fetch(`/api/analytics/top-products?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch top products')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load top products')
      } finally {
        setLoading(false)
      }
    }

    fetchTopProducts()
  }, [timelineRange, page])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  if (loading) {
    return <TopProductsLoading />
  }

  if (error) {
    return (
      <div className="error-state">
        <p>Error: {error}</p>
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
                <td>{index + 1}</td>
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
      <div className="section-header">
        <div className="skeleton" style={{ width: '180px', height: '24px' }} />
      </div>
      <div className="table-container">
        <div className="skeleton" style={{ width: '100%', height: '300px' }} />
      </div>
    </div>
  )
}
