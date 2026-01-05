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
    },
    collection: 'variants',
    label: 'Available variants',
    maxDepth: 2,
    on: 'product',
  },
]
