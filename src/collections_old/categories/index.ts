import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { revalidateAfterChange, revalidateDelete } from './hooks/revalidate'
import { canManageContent } from '@/access/can-manage-content'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: canManageContent,
    read: () => true,
    update: canManageContent,
    delete: canManageContent,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateDelete],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      filterOptions: {
        mimeType: { contains: 'image' },
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
