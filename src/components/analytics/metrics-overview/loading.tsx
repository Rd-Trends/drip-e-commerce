import React from 'react'

export function MetricsLoading() {
  return (
    <div className="metrics-grid">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="metric-card loading">
          <div className="metric-header">
            <div className="metric-icon-wrapper skeleton" />
            <div className="metric-growth skeleton" style={{ width: '60px', height: '20px' }} />
          </div>
          <div className="metric-content">
            <div
              className="skeleton"
              style={{ width: '120px', height: '36px', marginBottom: '8px' }}
            />
            <div className="skeleton" style={{ width: '80px', height: '16px' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
