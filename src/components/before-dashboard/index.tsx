import React from 'react'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

import { hasPermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'
import { BeforeDashboardClient, type DashboardPermissions } from './client'

export const BeforeDashboard: React.FC = async () => {
  const headersList = await getHeaders()
  const payload = await getPayload({ config: configPromise })
  const { user } = await payload.auth({ headers: headersList })

  const permissions: DashboardPermissions = {
    // High-level business intelligence — admins and roles granted analytics:view
    showMetrics: hasPermission(user, PERMISSIONS.ANALYTICS_VIEW),
    showRevenue: hasPermission(user, PERMISSIONS.ANALYTICS_VIEW),

    // Operational order data — order managers and above
    showRecentOrders: hasPermission(user, PERMISSIONS.ORDERS_READ),

    // Product / inventory data — content managers and order managers
    showTopProducts: hasPermission(user, PERMISSIONS.PRODUCTS_READ),
    showLowInventory: hasPermission(user, PERMISSIONS.PRODUCTS_READ),
  }

  // Nothing to show — don't render the dashboard shell at all
  const hasAnyAccess = Object.values(permissions).some(Boolean)
  if (!hasAnyAccess) return null

  return <BeforeDashboardClient permissions={permissions} />
}
