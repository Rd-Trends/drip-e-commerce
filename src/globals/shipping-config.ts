import type { GlobalConfig } from 'payload'

import { revalidateTag } from 'next/cache'
import { adminOnly } from '@/access/admin-only'
import { NIGERIAN_STATES } from '@/lib/nigerian-states'
import { currenciesConfig } from '@/lib/constants'
import { amountField } from '@/fields/ammount-field'
import { queryKeys } from '@/lib/query-keys'

export const ShippingConfig: GlobalConfig = {
  slug: 'shipping-config',
  access: {
    read: () => true,
    update: adminOnly,
  },
  fields: [
    amountField({
      currenciesConfig,
      overrides: {
        name: 'defaultFee',
        required: true,
        defaultValue: 150000,
        label: 'Default Shipping Fee (₦)',
        admin: {
          description: 'Default shipping fee when state is not found or disabled.',
        },
      },
    }),
    {
      name: 'states',
      type: 'array',
      label: 'State Shipping Fees',
      required: true,
      admin: {
        description: 'Configure shipping fees for each Nigerian state',
        initCollapsed: false,
      },
      fields: [
        {
          name: 'state',
          type: 'select',
          label: 'State',
          required: true,
          options: NIGERIAN_STATES,
          admin: {
            description: 'Select a Nigerian state',
          },
        },
        amountField({
          currenciesConfig,
          overrides: {
            name: 'fee',
            label: 'Shipping Fee (₦)',
            admin: { description: 'Shipping fee for this state' },
          },
        }),
        {
          name: 'enabled',
          type: 'checkbox',
          label: 'Enabled',
          defaultValue: true,
          admin: {
            description: 'Enable or disable shipping to this state',
          },
        },
      ],
    },
    amountField({
      currenciesConfig,
      overrides: {
        name: 'freeShippingThreshold',
        label: 'Free Shipping Threshold (₦)',
        admin: {
          description:
            'Order subtotal amount in Naira above which shipping is free. Leave empty to disable free shipping.',
        },
      },
    }),
    {
      name: 'taxRate',
      type: 'number',
      label: 'Tax Rate (%)',
      required: true,
      defaultValue: 7.5,
      min: 0,
      max: 100,
      admin: {
        description:
          'VAT/Tax rate as a percentage (e.g., 7.5 for 7.5%). Default is 7.5% for Nigerian VAT.',
        step: 0.1,
      },
      validate: (value: unknown) => {
        if (typeof value !== 'number' || value < 0 || value > 100) {
          return 'Tax rate must be between 0 and 100'
        }
        return true
      },
    },
  ],
  hooks: {
    afterChange: [
      async ({ context }) => {
        if (!context.disableRevalidation) {
          revalidateTag(queryKeys.revalidation.global('shipping-config'))
        }
      },
    ],
  },
}
