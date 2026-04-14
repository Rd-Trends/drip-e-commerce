import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateTag } from 'next/cache'
import { Header as THeader } from '@/payload-types'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'
import { queryKeys } from '@/lib/query-keys'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
    update: requirePermission(PERMISSIONS.HEADER_MANAGE),
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
      async ({ context }) => {
        if (!context.disableRevalidation) {
          revalidateTag(queryKeys.revalidation.global('header'))
        }
      },
    ],
  },
}
