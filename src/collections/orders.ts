import type { CollectionConfig } from 'payload'
import { isAdmin } from '@/access/is-admin'
import { isDocumentOwner } from '@/access/is-document-owner'
import { adminOnlyFieldAccess } from '@/access/admin-only-field-access'
import { addressFields } from '@/fields/adress-fields'
import { accessOR } from '@/access/utilities'
import { cartItemsField } from '../fields/cart-item-field'
import { amountField } from '../fields/ammount-field'
import { currencyField } from '../fields/currency-field'
import { nanoid } from 'nanoid'
import { currenciesConfig } from '@/lib/constants'

export const Orders: CollectionConfig = {
  slug: 'orders',
  access: {
    create: isAdmin,
    delete: isAdmin,
    read: accessOR(isAdmin, isDocumentOwner),
    update: isAdmin,
  },
  admin: {
    group: 'Shop',
    useAsTitle: 'createdAt',
    description: 'Customer orders',
  },
  fields: [
    {
      name: 'id',
      type: 'text',
      admin: { hidden: true },
      hooks: {
        beforeChange: [
          ({ operation }) => {
            if (operation === 'create') {
              return nanoid(12)
            }
          },
        ],
      },
    },
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
          ],
          label: 'Order Details',
        },
        {
          fields: [
            {
              name: 'shippingAddress',
              type: 'group',
              fields: addressFields,
              label: 'Shipping Address',
            },
          ],
          label: 'Shipping',
        },
      ],
    },
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
      name: 'coupon',
      type: 'relationship',
      relationTo: 'coupons',
      label: 'Coupon',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'couponCode',
      type: 'text',
      label: 'Coupon Code Snapshot',
      admin: {
        description: 'Immutable coupon code captured when the order was placed',
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'transactions',
      type: 'relationship',
      relationTo: 'transactions',
      hasMany: true,
      label: 'Transactions',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'processing',
      label: 'Status',
      admin: {
        position: 'sidebar',
      },
      options: [
        {
          label: 'Processing',
          value: 'processing',
        },
        {
          label: 'Shipped',
          value: 'shipped',
        },
        {
          label: 'Completed',
          value: 'completed',
        },
        {
          label: 'Cancelled',
          value: 'cancelled',
        },
        {
          label: 'Refunded',
          value: 'refunded',
        },
      ],
    },
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
  timestamps: true,
  labels: {
    plural: 'Orders',
    singular: 'Order',
  },
}
