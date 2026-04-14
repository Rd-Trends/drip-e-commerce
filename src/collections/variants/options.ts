import type { CollectionConfig } from 'payload'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'
import { revalidateAfterOptionChange, revalidateOptionDelete } from './hooks/revalidate-options'

export const VariantOptions: CollectionConfig = {
  slug: 'variantOptions',
  access: {
    create: requirePermission(PERMISSIONS.VARIANTS_MANAGE),
    delete: requirePermission(PERMISSIONS.VARIANTS_MANAGE),
    read: () => true,
    update: requirePermission(PERMISSIONS.VARIANTS_MANAGE),
  },
  admin: {
    group: false,
    useAsTitle: 'label',
    defaultColumns: ['label', 'value', 'variantType', 'updatedAt'],
  },
  hooks: {
    afterChange: [revalidateAfterOptionChange],
    afterDelete: [revalidateOptionDelete],
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
