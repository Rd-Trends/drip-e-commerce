import { isAdmin } from '@/access/is-admin'
import { currenciesConfig } from '@/lib/constants'
import { createTransactionsCollection } from '@payloadcms/plugin-ecommerce'
import { addressFields } from './address/fields'

export const Transactions = createTransactionsCollection({
  access: { isAdmin },
  enableVariants: true,
  currenciesConfig,
  addressFields,
  productsSlug: 'products',
  variantsSlug: 'variants',
  customersSlug: 'users',
  cartsSlug: 'carts',
  ordersSlug: 'orders',
  paymentMethods: [
    // @ts-ignore
    {
      name: 'paystack',
      label: 'Paystack',
      group: {
        name: 'paystack',
        type: 'group',
        admin: {
          condition: (data) => {
            const path = 'paymentMethod'

            return data?.[path] === 'paystack'
          },
        },
        fields: [
          {
            name: 'customerId',
            type: 'number',
            label: 'Paystack Customer ID',
          },
          {
            name: 'reference',
            type: 'text',
            label: 'Paystack Payment Reference',
          },
        ],
      },
    },
  ],
})
