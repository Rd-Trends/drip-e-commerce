import { isAdmin } from '@/access/isAdmin'
import { currenciesConfig } from '@/lib/constants'
import { createTransactionsCollection } from '@payloadcms/plugin-ecommerce'
import { addressFields } from './address/fields'
import { paystackAdapter } from '@/plugins/paystack'

export const Transactions = createTransactionsCollection({
  access: { isAdmin },
  enableVariants: true,
  currenciesConfig,
  addressFields,
  productsSlug: 'products',
  variantsSlug: 'variants',
  customersSlug: 'users',
  cartsSlug: 'carts',
  ordersSlug: 'orders',
  paymentMethods: [paystackAdapter({ secretKey: process.env.PAYSTACK_SECRET_KEY || '' })],
})
