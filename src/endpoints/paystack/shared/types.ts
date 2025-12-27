import { Address } from '@/payload-types'

export type PaystackTransactionMetadata = {
  cartId: number
  cartItemsSnapshot: Array<{
    product: number
    quantity: number
    variant?: number
  }>
  shippingAddress?: Address
  billingAddress?: Address
  taxAmount: number
  shippingAmount: number
  subtotalAmount: number
  discountAmount?: number
  couponId?: number
}
