'use client'

import React, { useState, useEffect } from 'react'
import { RevenueChart } from './charts/revenue-chart'
import { OrderStatusChart } from './charts/order-status-chart'
import { TopProductsTable } from './charts/top-products-table'
import { TopCouponsTable } from './charts/top-coupons-table'
import { RecentOrdersTable } from './charts/recent-orders-table'
import { LowInventoryAlert } from './charts/low-inventory-alert'

interface RevenueData {
  date: string
  revenue: number
  orders: number
  averageOrderValue: number
}

interface ProductData {
  id: string
  title: string
  revenue: number
  quantity: number
}

interface OrderStatusData {
  processing: number
  completed: number
  cancelled: number
  refunded: number
}

interface RecentOrder {
  id: string
  orderNumber: number
  total: number
  status: string
  customerEmail: string
  createdAt: string
}

interface CouponData {
  code: string
  discountType: string
  discountValue: number
  currentUses: number
  maxUses?: number
  usageRate: number
}

interface InventoryItem {
  id: string
  name: string
  type: string
  inventory: number
}

export function AnalyticsClient() {
  const [period, setPeriod] = useState('30')
  const [groupBy, setGroupBy] = useState('day')
  const [activeTab, setActiveTab] = useState('products')
  const [revenueData, setRevenueData] = useState<RevenueData[]>([])
  const [productData, setProductData] = useState<ProductData[]>([])
  const [orderStatusData, setOrderStatusData] = useState<OrderStatusData | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [couponData, setCouponData] = useState<CouponData[]>([])
  const [lowInventory, setLowInventory] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalyticsData()
  }, [period, groupBy])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

      // Fetch revenue data
      const revenueRes = await fetch(
        `${baseUrl}/api/analytics/revenue?period=${period}&groupBy=${groupBy}`,
      )
      if (revenueRes.ok) {
        const revenueJson = await revenueRes.json()
        setRevenueData(revenueJson.data || [])
      }

      // Fetch product data
      const productRes = await fetch(`${baseUrl}/api/analytics/products?period=${period}&limit=10`)
      if (productRes.ok) {
        const productJson = await productRes.json()
        setProductData(productJson.topProducts || [])
        setLowInventory(productJson.lowInventoryItems || [])
      }

      // Fetch order status data
      const orderStatusRes = await fetch(`${baseUrl}/api/analytics/orders?period=${period}`)
      if (orderStatusRes.ok) {
        const orderStatusJson = await orderStatusRes.json()
        setOrderStatusData(orderStatusJson.statusDistribution || null)
        setRecentOrders(orderStatusJson.recentOrders || [])
      }

      // Fetch coupon data
      const couponRes = await fetch(`${baseUrl}/api/analytics/coupons`)
      if (couponRes.ok) {
        const couponJson = await couponRes.json()
        setCouponData(couponJson.topCoupons || [])
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="analytics-content">
      {/* Period Selector */}
      <div className="analytics-filters">
        <div className="filter-controls">
          <div className="filter-group">
            <label className="filter-label">Period:</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="filter-select"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Group by:</label>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              className="filter-select"
            >
              <option value="day">Day</option>
              <option value="month">Month</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {/* Revenue Chart */}
          <div className="chart-card">
            <div className="chart-card-header">
              <h3 className="chart-card-title">Revenue Overview</h3>
              <p className="chart-card-description">Revenue and order trends over time</p>
            </div>
            <div className="chart-card-content">
              <RevenueChart data={revenueData} />
            </div>
          </div>

          {/* Tabs for different views */}
          <div className="analytics-tabs">
            <div className="tabs-header">
              <button
                className={`tab-trigger ${activeTab === 'products' ? 'active' : ''}`}
                onClick={() => setActiveTab('products')}
              >
                Products
              </button>
              <button
                className={`tab-trigger ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                Orders
              </button>
              <button
                className={`tab-trigger ${activeTab === 'coupons' ? 'active' : ''}`}
                onClick={() => setActiveTab('coupons')}
              >
                Coupons
              </button>
              <button
                className={`tab-trigger ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                Inventory
              </button>
            </div>

            <div className="tabs-content">
              {activeTab === 'products' && (
                <div className="tab-panel">
                  <div className="chart-card">
                    <div className="chart-card-header">
                      <h3 className="chart-card-title">Top Selling Products</h3>
                      <p className="chart-card-description">Best performing products by revenue</p>
                    </div>
                    <div className="chart-card-content">
                      <TopProductsTable products={productData} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="tab-panel">
                  <div className="charts-grid">
                    <div className="chart-card">
                      <div className="chart-card-header">
                        <h3 className="chart-card-title">Order Status Distribution</h3>
                        <p className="chart-card-description">
                          Orders by status in selected period
                        </p>
                      </div>
                      <div className="chart-card-content">
                        {orderStatusData && <OrderStatusChart data={orderStatusData} />}
                      </div>
                    </div>

                    <div className="chart-card">
                      <div className="chart-card-header">
                        <h3 className="chart-card-title">Recent Orders</h3>
                        <p className="chart-card-description">Latest orders placed</p>
                      </div>
                      <div className="chart-card-content">
                        <RecentOrdersTable orders={recentOrders} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'coupons' && (
                <div className="tab-panel">
                  <div className="chart-card">
                    <div className="chart-card-header">
                      <h3 className="chart-card-title">Coupon Performance</h3>
                      <p className="chart-card-description">Most used discount codes</p>
                    </div>
                    <div className="chart-card-content">
                      <TopCouponsTable coupons={couponData} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="tab-panel">
                  <div className="chart-card">
                    <div className="chart-card-header">
                      <h3 className="chart-card-title">Low Inventory Alert</h3>
                      <p className="chart-card-description">
                        Products running low on stock (≤10 items)
                      </p>
                    </div>
                    <div className="chart-card-content">
                      <LowInventoryAlert items={lowInventory} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
