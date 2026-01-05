import { canManageContent } from '@/access/can-manage-content'
import { createVariantOptionsCollection } from '@payloadcms/plugin-ecommerce'
import { CollectionConfig } from 'payload'

const defaultCollection = createVariantOptionsCollection({
  access: { isAdmin: canManageContent, publicAccess: () => true },
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
