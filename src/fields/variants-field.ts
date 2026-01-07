import type { Field } from 'payload'

export const variantsFields: Field[] = [
  {
    name: 'enableVariants',
    type: 'checkbox',
    label: 'Enable variants',
  },
  {
    name: 'variantTypes',
    type: 'relationship',
    admin: {
      condition: ({ enableVariants }) => Boolean(enableVariants),
    },
    hasMany: true,
    label: 'Variant Types',
    relationTo: 'variantTypes',
  },
  {
    name: 'variants',
    type: 'join',
    admin: {
      condition: ({ enableVariants, variantTypes }) => {
        const enabledVariants = Boolean(enableVariants)
        const hasManyVariantTypes = Array.isArray(variantTypes) && variantTypes.length > 0

        return enabledVariants && hasManyVariantTypes
      },
      defaultColumns: ['title', 'options', 'inventory', 'prices', '_status'],
      disableListColumn: true,
      components: {
        afterInput: [{ path: '@/fields/ui/bulk-variant-create#BulkVariantCreator' }],
      },
    },
    collection: 'variants',
    label: 'Available variants',
    maxDepth: 2,
    defaultLimit: 100, //disables pagination, return all results
    on: 'product',
  },
]
