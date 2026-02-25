import type { CollectionConfig } from 'payload'
import { canManageContent } from '@/access/can-manage-content'
import { revalidateAfterTypeChange, revalidateTypeDelete } from './hooks/revalidate-types'

export const VariantTypes: CollectionConfig = {
  slug: 'variantTypes',
  access: {
    create: canManageContent,
    delete: canManageContent,
    read: () => true,
    update: canManageContent,
  },
  admin: {
    group: false,
    useAsTitle: 'label',
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
