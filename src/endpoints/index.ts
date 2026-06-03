import { Endpoint } from 'payload'
import { initiatePaystackPaymentHandler } from './paystack/initiate'
import { confirmPaystackOrderHandler } from './paystack/confirm'
// import { paystackWebhookHandler } from './paystack/webhook'
import { bulkCreateVariants } from './variants/bulk-create'
import { validateCouponHandler } from './coupons/validate'
import { mergeGuestCartHandler } from './carts/merge-guest-cart'
import { getMetricsHandler } from './analytics/metrics'
import { getRevenueHandler } from './analytics/revenue'
import { getTopProductsHandler } from './analytics/top-products'
import { getLowInventoryHandler } from './analytics/low-inventory'
import { getRecentOrdersHandler } from './analytics/recent-orders'
import { unsubscribeHandler } from './unsubscribe'

export const endpoints: Endpoint[] = [
  {
    path: '/unsubscribe',
    method: 'get',
    handler: unsubscribeHandler,
  },
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
  // {
  //   path: '/payments/paystack/webhook',
  //   method: 'post',
  //   handler: paystackWebhookHandler,
  // },
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
    path: '/merge-guest-cart',
    method: 'post',
    handler: mergeGuestCartHandler,
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
