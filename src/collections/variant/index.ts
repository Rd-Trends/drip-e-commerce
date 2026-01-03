import { adminOnlyFieldAccess } from '@/access/admin-only-field-access'
import { adminOrPublishedStatus } from '@/access/admin-or-published-status'
import { canManageContent } from '@/access/can-manage-content'
import { currenciesConfig } from '@/lib/constants'
import { amountField, createVariantsCollection } from '@payloadcms/plugin-ecommerce'
import { CollectionConfig } from 'payload'

const defaultCollection = createVariantsCollection({
  access: { isAdmin: canManageContent, adminOrPublishedStatus },
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
  fields: [
    ...(defaultCollection?.fields || []),
    amountField({
      currenciesConfig,
      overrides: {
        name: 'costPrice',
        label: 'Cost Price (₦)',
        required: false,
        access: {
          read: adminOnlyFieldAccess,
          create: adminOnlyFieldAccess,
          update: adminOnlyFieldAccess,
        },
        admin: {
          description: 'Cost price for this variant (admin only)',
        },
      },
    }),
  ],
}
