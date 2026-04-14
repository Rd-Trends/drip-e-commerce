import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'
import { queryKeys } from '@/lib/query-keys'
import { revalidateTag } from 'next/cache'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: requirePermission(PERMISSIONS.FOOTER_MANAGE),
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
    afterChange: [
      async ({ context }) => {
        if (!context.disableRevalidation) {
          revalidateTag(queryKeys.revalidation.global('footer'))
        }
      },
    ],
  },
}
