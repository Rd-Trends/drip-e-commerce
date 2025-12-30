import { Endpoint } from 'payload'
import { initiatePaystackPaymentHandler } from './paystack/initiate'
import { confirmPaystackOrderHandler } from './paystack/confirm'
import { analyticsOverviewHandler } from './analytics/overview'
import { revenueAnalyticsHandler } from './analytics/revenue'
import { productAnalyticsHandler } from './analytics/products'
import { orderStatusAnalyticsHandler } from './analytics/order-status'
import { couponAnalyticsHandler } from './analytics/coupon'

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
    path: '/analytics/overview',
    method: 'get',
    handler: analyticsOverviewHandler,
  },
  {
    path: '/analytics/revenue',
    method: 'get',
    handler: revenueAnalyticsHandler,
  },
  {
    path: '/analytics/products',
    method: 'get',
    handler: productAnalyticsHandler,
  },
  {
    path: '/analytics/orders',
    method: 'get',
    handler: orderStatusAnalyticsHandler,
  },
  {
    path: '/analytics/coupons',
    method: 'get',
    handler: couponAnalyticsHandler,
  },
]
