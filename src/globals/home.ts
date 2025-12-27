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
      async ({ context }) => {
        if (!context.disableRevalidation) {
          revalidateTag('global_home')
        }
      },
    ],
    beforeChange: [
      async ({ data }) => {
        // Clear category field for non-category types
        if (data?.productSections) {
          data.productSections = data.productSections.map((section: any) => {
            if (section.type !== 'category' && section.category) {
              const { category, ...rest } = section
              return rest
            }
            return section
          })
        }
        return data
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
          name: 'badge',
          type: 'text',
          label: 'Badge',
          admin: {
            description:
              'Small text above the title in a badge (e.g. "New Arrival", "Use code: SAVE20")',
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
