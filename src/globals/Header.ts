import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateTag } from 'next/cache'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // ensure all urls are parsed properly
        if (data.navItems) {
          data.navItems = data.navItems.map((item: any) => {
            let url: string = item.link.url?.trim()?.toLowerCase() || ''
            if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
              url = `/${url}`
            }

            return {
              ...item,
              link: {
                ...item.link,
                url: url.replace(/\/\/+/g, '/'),
              },
            }
          })
        }
      },
    ],
    afterChange: [
      async ({ req }) => {
        revalidateTag('global_header')
      },
    ],
  },
}
