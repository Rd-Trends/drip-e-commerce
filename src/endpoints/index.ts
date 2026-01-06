import { Endpoint } from 'payload'
import { initiatePaystackPaymentHandler } from './paystack/initiate'
import { confirmPaystackOrderHandler } from './paystack/confirm'
import { bulkCreateVariants } from './variants/bulk-create'

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
]
