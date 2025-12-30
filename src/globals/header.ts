import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateTag } from 'next/cache'
import { Header as THeader } from '@/payload-types'

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
      async ({ data }: { data: THeader }) => {
        // ensure all urls are parsed properly
        if (data.navItems) {
          data.navItems = data.navItems.map((item) => {
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
      async () => {
        revalidateTag('global_header')
      },
    ],
  },
}
