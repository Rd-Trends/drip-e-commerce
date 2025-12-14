import { isAdmin } from '@/access/isAdmin'
import { createVariantTypesCollection } from '@payloadcms/plugin-ecommerce'
import { CollectionConfig } from 'payload'

const defaultCollection = createVariantTypesCollection({
  access: { isAdmin, publicAccess: () => true },
  variantOptionsSlug: 'variantOptions',
})

export const VariantTypes: CollectionConfig = {
  ...defaultCollection,
  labels: {
    singular: 'Variant Type',
    plural: 'Variant Types',
  },
  admin: {
    ...defaultCollection?.admin,
    description: 'Types of product variants',
  },
}
