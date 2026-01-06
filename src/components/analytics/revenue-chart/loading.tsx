import React from 'react'

export function RevenueLoading() {
  return (
    <div className="chart-container">
      <div className="chart-header">
        <div className="skeleton" style={{ width: '200px', height: '24px' }} />
        <div className="skeleton" style={{ width: '120px', height: '36px' }} />
      </div>
      <div className="chart-body">
        <div className="skeleton" style={{ width: '100%', height: '350px' }} />
      </div>
    </div>
  )
}
