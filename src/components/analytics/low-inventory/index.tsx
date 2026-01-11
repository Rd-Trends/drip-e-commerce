'use client'

import React, { useEffect, useState } from 'react'
import { Pagination } from '@payloadcms/ui'
import { AlertTriangle } from 'lucide-react'

interface InventoryItem {
  id: string
  name: string
  type: 'product' | 'variant'
  inventory: number
}

interface LowInventoryResponse {
  docs: InventoryItem[]
  totalDocs: number
}

export function LowInventory() {
  const [data, setData] = useState<LowInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const fetchLowInventory = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.append('threshold', '10')

        const response = await fetch(`/api/analytics/low-inventory?${params.toString()}`, {
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch low inventory')
        }

        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load low inventory')
      } finally {
        setLoading(false)
      }
    }

    fetchLowInventory()
  }, [])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  if (loading) {
    return <LowInventoryLoading />
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
          <h3 className="analytics-section-title">
            <AlertTriangle className="icon-warning" size={20} />
            Low Inventory Alerts
          </h3>
        </div>
        <div className="empty-state">
          <p>All products have healthy inventory levels!</p>
        </div>
      </div>
    )
  }

  // Client-side pagination
  const totalPages = Math.ceil(data.totalDocs / itemsPerPage)
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedDocs = data.docs.slice(startIndex, endIndex)
  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return (
    <div className="analytics-section">
      <div className="analytics-section-header">
        <h3 className="analytics-section-title">
          <AlertTriangle className="icon-warning" size={20} />
          Low Inventory Alerts
        </h3>
      </div>
      <div className="table-container">
        <table className="analytics-table">
          <thead>
            <tr>
              <th>Product/Variant</th>
              <th>Type</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDocs.map((item) => (
              <tr key={item.id}>
                <td>
                  <a
                    href={`/admin/collections/${item.type === 'product' ? 'products' : 'variants'}/${item.id}`}
                    className="table-link"
                  >
                    {item.name}
                  </a>
                </td>
                <td>
                  <span className="badge badge-default">{item.type}</span>
                </td>
                <td>
                  <span
                    className={`badge ${item.inventory <= 5 ? 'badge-error' : 'badge-warning'}`}
                  >
                    {item.inventory} units
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination-wrapper">
          <Pagination
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            page={page}
            totalPages={totalPages}
            onChange={handlePageChange}
            limit={itemsPerPage}
          />
        </div>
      )}
    </div>
  )
}

function LowInventoryLoading() {
  return (
    <div className="analytics-section">
      <div className="section-header">
        <div className="skeleton" style={{ width: '180px', height: '24px' }} />
      </div>
      <div className="table-container">
        <div className="skeleton" style={{ width: '100%', height: '200px' }} />
      </div>
    </div>
  )
}
