import { revalidateTag } from 'next/cache'
import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Content',
  },
  hooks: {
    afterChange: [
      async ({ context }) => {
        if (!context.disableRevalidation) {
          revalidateTag('categories')
        }
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField({
      position: undefined,
    }),
  ],
}
