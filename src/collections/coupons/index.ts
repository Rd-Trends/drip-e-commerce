import type { CollectionConfig } from 'payload'
import { amountField } from '@payloadcms/plugin-ecommerce'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'
import { currenciesConfig } from '@/lib/constants'
import type { Coupon } from '@/payload-types'

export const Coupons: CollectionConfig = {
  slug: 'coupons',
  access: {
    create: requirePermission(PERMISSIONS.COUPONS_WRITE),
    read: requirePermission(PERMISSIONS.COUPONS_READ),
    update: requirePermission(PERMISSIONS.COUPONS_WRITE),
    delete: requirePermission(PERMISSIONS.COUPONS_WRITE),
  },
  admin: {
    useAsTitle: 'code',
    defaultColumns: ['code', 'type', 'value', 'fixedAmount', 'active', 'validUntil', 'updatedAt'],
    group: 'Shop',
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description:
          'Unique coupon code (e.g., SAVE20, NEWYEAR2025). Will be converted to uppercase.',
      },
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (typeof value === 'string') {
              return value.toUpperCase().trim()
            }
            return value
          },
        ],
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Percentage', value: 'percentage' },
        { label: 'Fixed Amount', value: 'fixed' },
        { label: 'Free Shipping', value: 'free-shipping' },
      ],
      admin: {
        description: 'Type of discount to apply',
      },
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Discount value (percentage: 1-100, fixed: amount in Naira)',
        condition: (data) => data.type === 'percentage',
      },
      validate: (value: unknown, { data }: { data: Partial<Coupon> }) => {
        if (typeof value !== 'number') return true
        if (data.type === 'percentage' && (value < 0 || value > 100)) {
          return 'Percentage value must be between 0 and 100'
        }
        if (value <= 0) {
          return 'Value must be greater than 0'
        }
        return true
      },
    },
    amountField({
      currenciesConfig,
      overrides: {
        name: 'fixedAmount',
        label: 'Fixed Discount Amount',
        required: true,
        admin: {
          description: 'Fixed discount amount in Naira',
          condition: (data) => data.type === 'fixed',
        },
      },
    }),
    {
      type: 'row',
      fields: [
        amountField({
          currenciesConfig,
          overrides: {
            name: 'minPurchaseAmount',
            label: 'Minimum Purchase',
            admin: {
              description: 'Minimum cart subtotal required to use this coupon',
            },
          },
        }),
        amountField({
          currenciesConfig,
          overrides: {
            name: 'maxDiscountAmount',
            label: 'Maximum Discount',
            admin: {
              description: 'Maximum discount amount (for percentage coupons)',
              condition: (data) => data.type === 'percentage',
            },
          },
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'validFrom',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            description: 'Date and time when coupon becomes valid',
          },
        },
        {
          name: 'validUntil',
          type: 'date',
          required: true,
          admin: {
            date: {
              pickerAppearance: 'dayAndTime',
            },
            description: 'Date and time when coupon expires',
          },
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Enable or disable this coupon',
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'usageLimit',
          type: 'number',
          min: 0,
          admin: {
            description:
              'Total number of times this coupon can be used (leave empty for unlimited)',
            position: 'sidebar',
          },
        },
        {
          name: 'maxUsesPerUser',
          type: 'number',
          min: 0,
          defaultValue: 1,
          admin: {
            description: 'Maximum times a single customer can use this coupon',
            position: 'sidebar',
          },
        },
      ],
    },
    {
      name: 'usageSummary',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: {
            path: '@/fields/ui/coupon-usage-field#CouponUsageSummaryField',
          },
        },
      },
      label: 'Usage',
    },
    {
      name: 'applicableCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Restrict coupon to specific categories (leave empty for all products)',
      },
    },
    {
      name: 'applicableProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      admin: {
        description: 'Restrict coupon to specific products (leave empty for all products)',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Internal notes or public description for this coupon',
      },
    },
  ],
}
