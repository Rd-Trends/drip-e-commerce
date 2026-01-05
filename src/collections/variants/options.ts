import type { CollectionConfig } from 'payload'
import { canManageContent } from '@/access/can-manage-content'

export const VariantOptions: CollectionConfig = {
  slug: 'variantOptions',
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
  fields: [
    {
      name: 'variantType',
      type: 'relationship',
      relationTo: 'variantTypes',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'value',
      type: 'text',
      required: true,
      admin: {
        description: 'should be defaulted or dynamic based on label',
      },
    },
  ],
  labels: {
    plural: 'Variant Options',
    singular: 'Variant Option',
  },
  trash: true,
}
