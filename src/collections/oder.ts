import { createOrdersCollection } from '@payloadcms/plugin-ecommerce'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { currenciesConfig } from '@/lib/constants'
import { addressFields } from './address/fields'

export const Orders = createOrdersCollection({
  access: { isAdmin, adminOnlyFieldAccess, isDocumentOwner },
  enableVariants: true,
  currenciesConfig,
  customersSlug: 'users',
  productsSlug: 'products',
  transactionsSlug: 'transactions',
  variantsSlug: 'variants',
  addressFields,
})
