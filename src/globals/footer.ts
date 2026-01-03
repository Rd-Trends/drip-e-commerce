import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { canManageContent } from '@/access/can-manage-content'

export const Footer: GlobalConfig = {
  slug: 'footer',
  access: {
    read: () => true,
    update: canManageContent,
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
}
