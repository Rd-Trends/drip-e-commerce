import type { CollectionConfig } from 'payload'
import { canManageOrders } from '@/access/can-manage-orders'
import { isDocumentOwner } from '@/access/is-document-owner'
import { accessOR } from '@/access/utilities'
import { hasCartSecretAccess } from './hooks/has-cart-secret-access'
import { cartItemsField } from '../../fields/cart-item-field'
import { beforeChangeCart } from './hooks/before-change'
import { amountField } from '../../fields/ammount-field'
import { currenciesConfig } from '@/lib/constants'
import { currencyField } from '../../fields/currency-field'

export const Carts: CollectionConfig = {
  slug: 'carts',
  access: {
    create: () => true, // Allow authenticated users and guest users
    delete: accessOR(canManageOrders, isDocumentOwner, hasCartSecretAccess(true)),
    read: accessOR(canManageOrders, isDocumentOwner, hasCartSecretAccess(true)),
    update: accessOR(canManageOrders, isDocumentOwner, hasCartSecretAccess(true)),
  },
  admin: {
    group: 'Shop',
    useAsTitle: 'createdAt',
    description: 'Customer shopping carts',
  },
  fields: [
    cartItemsField({
      enableVariants: true,
      overrides: {
        label: 'Items',
        labels: {
          plural: 'Items',
          singular: 'Item',
        },
      },
    }),
    {
      name: 'secret',
      type: 'text',
      access: {
        create: () => false, // Users can't set it manually
        read: () => false, // Never readable via field access (only through afterRead hook)
        update: () => false, // Users can't update it
      },
      admin: {
        hidden: true,
        position: 'sidebar',
        readOnly: true,
      },
      index: true,
      label: 'Cart Secret',
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      label: 'Customer',
      admin: {
        description: 'Leave empty for guest carts',
      },
    },
    {
      name: 'purchasedAt',
      type: 'date',
      label: 'Purchased At',
      admin: {
        description: 'Timestamp when this cart was converted to an order',
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Purchased',
          value: 'purchased',
        },
        {
          label: 'Abandoned',
          value: 'abandoned',
        },
      ],
      defaultValue: 'active',
    },
    {
      type: 'row',
      admin: { position: 'sidebar' },
      fields: [
        amountField({
          currenciesConfig,
          overrides: {
            name: 'subtotal',
            label: 'Subtotal',
          },
        }),
        currencyField({
          currenciesConfig,
        }),
      ],
    },
  ],
  timestamps: true,
  hooks: {
    afterRead: [
      ({ doc, req }) => {
        // Include secret only if this was just created (stored in context by beforeChange)
        if (req.context?.newCartSecret) {
          doc.secret = req.context.newCartSecret
        }
        // Secret is otherwise never exposed (field access is locked)
        return doc
      },
    ],
    beforeChange: [beforeChangeCart],
  },
  labels: {
    plural: 'Carts',
    singular: 'Cart',
  },
}
