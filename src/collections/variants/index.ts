import type { CollectionConfig } from 'payload'
import { canManageContent } from '@/access/can-manage-content'
import { canManageContentOrPublishedStatus } from '@/access/can-manage-content-or-published-status'
import { adminOnlyFieldAccess } from '@/access/admin-only-field-access'
import { pricesField } from '../../fields/prices-field'
import { inventoryField } from '../../fields/inventory-field'
import { currenciesConfig } from '@/lib/constants'
import { validateOptions } from './hooks/validate-options'
import { variantsCollectionBeforeChange } from './hooks/before-change'
import { amountField } from '@/fields/ammount-field'

export const Variants: CollectionConfig = {
  slug: 'variants',
  access: {
    create: canManageContent,
    delete: canManageContent,
    read: canManageContentOrPublishedStatus,
    update: canManageContent,
  },
  admin: {
    group: false,
    useAsTitle: 'title',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        description:
          'Used for administrative purposes, not shown to customers. This is populated by default.',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'options',
      type: 'relationship',
      relationTo: 'variantOptions',
      hasMany: true,
      required: true,
      label: 'Variant options',
      admin: {
        components: {
          Field: {
            path: '/src/fields/ui/variant-option-selector#VariantOptionsSelector',
          },
        },
      },
      validate: validateOptions,
    },
    inventoryField(),
    ...pricesField({
      currenciesConfig,
      conditionalPath: '',
    }),
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
          description: "Cost price for this product, this won't be shown to customers (admin only)",
          condition: (data) => {
            return data?.enableVariants !== true
          },
        },
      },
    }),
  ],
  labels: {
    plural: 'Variants',
    singular: 'Variant',
  },
  hooks: {
    beforeChange: [variantsCollectionBeforeChange],
  },
  trash: true,
  versions: {
    drafts: {
      autosave: true,
    },
  },
}
