import type { GlobalConfig } from 'payload'
import { link } from '@/fields/link'
import { revalidateTag } from 'next/cache'

export const Home: GlobalConfig = {
  slug: 'home',
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async () => {
        revalidateTag('global_home')
      },
    ],
  },
  fields: [
    {
      name: 'heroSlides',
      type: 'array',
      minRows: 1,
      labels: {
        singular: 'Slide',
        plural: 'Slides',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'subtitle',
          type: 'text',
          label: 'Subtitle / Badge',
          admin: {
            description: 'Small text above the title (e.g. "New Arrival", "Promo Code: SALE20")',
          },
        },
        {
          name: 'description',
          type: 'textarea',
        },
        {
          name: 'links',
          type: 'array',
          maxRows: 2,
          fields: [
            link({
              appearances: false,
            }),
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'contentAlign',
              type: 'select',
              defaultValue: 'left',
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                width: '50%',
              },
            },
            {
              name: 'theme',
              type: 'select',
              defaultValue: 'dark',
              options: [
                { label: 'Dark Text', value: 'dark' },
                { label: 'Light Text', value: 'light' },
              ],
              admin: {
                width: '50%',
                description: 'Choose "Light Text" if the background image is dark.',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'productSections',
      type: 'array',
      label: 'Product Sections',
      minRows: 0,
      labels: {
        singular: 'Section',
        plural: 'Sections',
      },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: {
            description:
              'Display title for this product section (e.g., "Featured Products", "Latest Arrivals")',
          },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          label: 'Type',
          options: [
            { label: 'Category', value: 'category' },
            { label: 'Featured', value: 'featured' },
            { label: 'Latest', value: 'latest' },
            { label: 'Hottest', value: 'hottest' },
          ],
          admin: {
            description: 'Choose how products should be selected for this section',
          },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'category',
            description: 'Select a category to display products from',
          },
        },
        {
          name: 'showViewAll',
          type: 'checkbox',
          defaultValue: true,
          label: 'Show "View All" Button',
          admin: {
            description: 'Display a button that links to the shop page with filters applied',
          },
        },
      ],
    },
  ],
}
