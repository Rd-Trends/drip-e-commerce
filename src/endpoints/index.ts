import { Endpoint } from 'payload'
import { initiatePaystackPaymentHandler } from './paystack/initiate'
import { confirmPaystackOrderHandler } from './paystack/confirm'
import { bulkCreateVariants } from './variants/bulk-create'
import { validateCouponHandler } from './coupons/validate'
import { getMetricsHandler } from './analytics/metrics'
import { getRevenueHandler } from './analytics/revenue'
import { getTopProductsHandler } from './analytics/top-products'
import { getLowInventoryHandler } from './analytics/low-inventory'
import { getRecentOrdersHandler } from './analytics/recent-orders'

export const endpoints: Endpoint[] = [
  {
    path: '/payments/paystack/initiate',
    method: 'post',
    handler: initiatePaystackPaymentHandler,
  },
  {
    path: '/payments/paystack/confirm-order',
    method: 'post',
    handler: confirmPaystackOrderHandler,
  },
  {
    path: '/variants-bulk-create',
    method: 'post',
    handler: bulkCreateVariants,
  },
  {
    path: '/validate-coupon',
    method: 'post',
    handler: validateCouponHandler,
  },
  {
    path: '/analytics/metrics',
    method: 'get',
    handler: getMetricsHandler,
  },
  {
    path: '/analytics/revenue',
    method: 'get',
    handler: getRevenueHandler,
  },
  {
    path: '/analytics/top-products',
    method: 'get',
    handler: getTopProductsHandler,
  },
  {
    path: '/analytics/low-inventory',
    method: 'get',
    handler: getLowInventoryHandler,
  },
  {
    path: '/analytics/recent-orders',
    method: 'get',
    handler: getRecentOrdersHandler,
  },
]
