import React from 'react'

export function RecentOrdersLoading() {
  return (
    <div className="analytics-section">
      <div className="section-header">
        <div className="skeleton" style={{ width: '180px', height: '24px' }} />
      </div>
      <div className="table-container">
        <div className="skeleton" style={{ width: '100%', height: '400px' }} />
      </div>
    </div>
  )
}
