import { adminOrPublishedStatus } from '@/access/admin-or-published-status'
import { isAdmin } from '@/access/is-admin'
import { currenciesConfig } from '@/lib/constants'
import { createVariantsCollection } from '@payloadcms/plugin-ecommerce'
import { CollectionConfig } from 'payload'

const defaultCollection = createVariantsCollection({
  access: { isAdmin, adminOrPublishedStatus },
  currenciesConfig,
  inventory: {
    fieldName: 'inventory',
  },
  productsSlug: 'products',
  variantOptionsSlug: 'variantOptions',
})

export const Variants: CollectionConfig = {
  ...defaultCollection,
  labels: {
    singular: 'Variant',
    plural: 'Variants',
  },
  admin: {
    ...defaultCollection?.admin,
    description: 'Product variants available for purchase in the store',
  },
}
