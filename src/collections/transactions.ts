import type { CollectionConfig } from 'payload'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'
import { addressFields } from '@/fields/adress-fields'
import { cartItemsField } from '../fields/cart-item-field'
import { statusField } from '../fields/status-field'
import { amountField } from '../fields/ammount-field'
import { currencyField } from '../fields/currency-field'
import { currenciesConfig } from '@/lib/constants'

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  access: {
    /** Only users with TRANSACTIONS_WRITE (admins) can create or delete transaction records. */
    create: requirePermission(PERMISSIONS.TRANSACTIONS_WRITE),
    delete: requirePermission(PERMISSIONS.TRANSACTIONS_WRITE),
    /** TRANSACTIONS_READ holders (admins + order managers) can view transactions. */
    read: requirePermission(PERMISSIONS.TRANSACTIONS_READ),
    update: requirePermission(PERMISSIONS.TRANSACTIONS_WRITE),
  },
  admin: {
    group: 'Shop',
    defaultColumns: ['createdAt', 'customer', 'customerEmail', 'order', 'paymentMethod', 'amount', 'status'],
    description: 'Payment transactions',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            cartItemsField({
              enableVariants: true,
              overrides: {
                name: 'items',
                label: 'Items',
                labels: {
                  plural: 'Items',
                  singular: 'Item',
                },
              },
            }),
            {
              name: 'paymentMethod',
              type: 'select',
              label: 'Payment Method',
              options: [
                {
                  label: 'Paystack',
                  value: 'paystack',
                },
              ],
              defaultValue: 'paystack',
            },
            {
              name: 'paystack',
              type: 'group',
              admin: {
                condition: (data) => data?.paymentMethod === 'paystack',
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
              label: 'Paystack Details',
            },
          ],
          label: 'Transaction Details',
        },
        {
          fields: [
            {
              name: 'billingAddress',
              type: 'group',
              fields: addressFields,
              label: 'Billing Address',
              required: true,
            },
          ],
          label: 'Billing',
        },
      ],
    },
    statusField({
      overrides: {
        admin: {
          position: 'sidebar',
        },
      },
    }),
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      label: 'Customer',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'customerEmail',
      type: 'email',
      label: 'Customer Email',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      label: 'Order',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'cart',
      type: 'relationship',
      relationTo: 'carts',
      label: 'Cart',
      admin: {
        position: 'sidebar',
      },
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [
        amountField({
          currenciesConfig,
        }),
        currencyField({
          currenciesConfig,
        }),
      ],
    },
  ],
  timestamps: true,
  labels: {
    plural: 'Transactions',
    singular: 'Transaction',
  },
}
