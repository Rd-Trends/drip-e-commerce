import { isAdmin } from '@/access/isAdmin'
import { createVariantOptionsCollection } from '@payloadcms/plugin-ecommerce'
import { CollectionConfig } from 'payload'

const defaultCollection = createVariantOptionsCollection({
  access: { isAdmin, publicAccess: () => true },
  variantTypesSlug: 'variantTypes',
})

export const VariantOptions: CollectionConfig = {
  ...defaultCollection,
  labels: {
    singular: 'Variant Option',
    plural: 'Variant Options',
  },
  admin: {
    ...defaultCollection?.admin,
    description: 'Options for product variants',
  },
}
