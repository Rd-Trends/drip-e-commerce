import type { CollectionConfig } from 'payload'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'
import { revalidateAfterTypeChange, revalidateTypeDelete } from './hooks/revalidate-types'

export const VariantTypes: CollectionConfig = {
  slug: 'variantTypes',
  access: {
    create: requirePermission(PERMISSIONS.VARIANTS_MANAGE),
    delete: requirePermission(PERMISSIONS.VARIANTS_MANAGE),
    read: () => true,
    update: requirePermission(PERMISSIONS.VARIANTS_MANAGE),
  },
  admin: {
    group: false,
    useAsTitle: 'label',
    defaultColumns: ['label', 'name', 'updatedAt'],
  },
  hooks: {
    afterChange: [revalidateAfterTypeChange],
    afterDelete: [revalidateTypeDelete],
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'options',
      type: 'join',
      collection: 'variantOptions',
      maxDepth: 2,
      defaultLimit: 0, //disables pagination, return all results
      on: 'variantType',
      orderable: true,
    },
  ],
  labels: {
    plural: 'Variant Types',
    singular: 'Variant Type',
  },
  trash: true,
}
