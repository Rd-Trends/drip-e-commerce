import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'
import { revalidateAfterChange, revalidateDelete } from './hooks/revalidate'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
    read: () => true,
    update: requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
    delete: requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
    defaultColumns: ['title', 'slug', 'image', 'updatedAt'],
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
