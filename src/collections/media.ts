import type { CollectionConfig } from 'payload'
import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export const Media: CollectionConfig = {
  admin: {
    group: 'Content',
    defaultColumns: ['filename', 'alt', 'mimeType', 'filesize', 'updatedAt'],
  },
  slug: 'media',
  access: {
    create: requirePermission(PERMISSIONS.MEDIA_MANAGE),
    read: () => true,
    update: requirePermission(PERMISSIONS.MEDIA_MANAGE),
    delete: requirePermission(PERMISSIONS.MEDIA_MANAGE),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()]
        },
      }),
    },
  ],
  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
  },
}
