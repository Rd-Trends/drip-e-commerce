import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { currenciesConfig } from '@/lib/constants'
import { createCartsCollection } from '@payloadcms/plugin-ecommerce'
import { CollectionConfig } from 'payload'

const defaultCollection = createCartsCollection({
  access: {
    isAdmin,
    isDocumentOwner,
    isAuthenticated: ({ req }) => !!req.user,
  },
  enableVariants: true,
  allowGuestCarts: true,
  customersSlug: 'users',
  productsSlug: 'products',
  variantsSlug: 'variants',
  currenciesConfig,
})

export const Carts: CollectionConfig = {
  ...defaultCollection,
  labels: {
    singular: 'Shopping Cart',
    plural: 'Shopping Carts',
  },
  admin: {
    ...defaultCollection?.admin,
    description: 'Customer shopping carts',
  },
}
