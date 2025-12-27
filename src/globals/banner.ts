import type { GlobalConfig } from 'payload'
import { revalidateTag } from 'next/cache'
import { adminOnly } from '@/access/adminOnly'
import { link } from '@/fields/link'

export const Banner: GlobalConfig = {
  slug: 'banner',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    {
      name: 'isEnabled',
      type: 'checkbox',
      label: 'Enable Banner',
      defaultValue: false,
      admin: {
        description: 'Toggle to show or hide the banner across the site',
      },
    },
    {
      name: 'text',
      type: 'textarea',
      label: 'Banner Text',
      required: true,
      admin: {
        description: 'The message to display in the banner',
        condition: (data) => data.isEnabled,
      },
    },
    {
      name: 'variant',
      type: 'select',
      label: 'Banner Style',
      required: true,
      defaultValue: 'info',
      options: [
        {
          label: 'Info (Blue)',
          value: 'info',
        },
        {
          label: 'Success (Green)',
          value: 'success',
        },
        {
          label: 'Warning (Yellow)',
          value: 'warning',
        },
        {
          label: 'Promo (Purple)',
          value: 'promo',
        },
      ],
      admin: {
        description: 'Choose the color scheme for the banner',
        condition: (data) => data.isEnabled,
      },
    },
    {
      name: 'isDismissible',
      type: 'checkbox',
      label: 'Allow Users to Dismiss',
      defaultValue: false,
      admin: {
        description:
          'If enabled, users can close the banner. It will stay hidden until the banner content changes.',
        condition: (data) => data.isEnabled,
      },
    },
    {
      name: 'showLink',
      type: 'checkbox',
      label: 'Show Call-to-Action Link',
      defaultValue: false,
      admin: {
        condition: (data) => data.isEnabled,
      },
    },
    link({
      appearances: false,
      overrides: {
        admin: {
          condition: (data: any) => data.isEnabled && data.showLink,
        },
      },
    }),
  ],
  hooks: {
    afterChange: [
      async () => {
        revalidateTag('global_banner')
      },
    ],
  },
}
