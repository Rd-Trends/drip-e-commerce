import { amountField, createOrdersCollection, currencyField } from '@payloadcms/plugin-ecommerce'
import { adminOnlyFieldAccess } from '@/access/adminOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { currenciesConfig } from '@/lib/constants'
import { addressFields } from './address/fields'
import { CollectionConfig } from 'payload'

const defaultOrdersCollection = createOrdersCollection({
  access: { isAdmin, adminOnlyFieldAccess, isDocumentOwner },
  enableVariants: true,
  customersSlug: 'users',
  productsSlug: 'products',
  transactionsSlug: 'transactions',
  variantsSlug: 'variants',
  addressFields,
})

export const Orders: CollectionConfig = {
  ...defaultOrdersCollection,
  fields: [
    ...defaultOrdersCollection.fields,
    currencyField({ currenciesConfig }),
    {
      type: 'row',
      fields: [
        amountField({
          currenciesConfig,
          overrides: {
            name: 'subtotal',
            label: 'Subtotal',
            admin: { description: 'Order subtotal before shipping' },
          },
        }),
        amountField({
          currenciesConfig,
          overrides: {
            name: 'shippingFee',
            label: 'Shipping Fee',
            admin: { description: 'Shipping fee for this order' },
          },
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        amountField({
          currenciesConfig,
          overrides: {
            name: 'tax',
            label: 'Tax',
            admin: { description: 'Tax amount for this order' },
          },
        }),
        amountField({
          currenciesConfig,
          overrides: {
            name: 'discount',
            label: 'Discount',
            admin: { description: 'Discount amount for this order' },
          },
        }),
      ],
    },
    amountField({
      currenciesConfig,
      overrides: {
        name: 'grandTotal',
        label: 'Grand Total',
        admin: {
          description: 'Final total amount (subtotal + shipping + tax - discount) for this order',
        },
      },
    }),
  ],
}
