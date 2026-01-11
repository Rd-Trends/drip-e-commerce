import type { CollectionConfig } from 'payload'
import { canManageOrders } from '@/access/can-manage-orders'
import { isDocumentOwner } from '@/access/is-document-owner'
import { addressFields } from '@/fields/adress-fields'
import { accessOR } from '@/access/utilities'
import { NIGERIAN_STATES } from '@/lib/nigerian-states'
import { beforeChange } from './hooks/before-change'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  access: {
    create: ({ req }) => !!req.user,
    delete: accessOR(canManageOrders, isDocumentOwner),
    read: accessOR(canManageOrders, isDocumentOwner),
    update: accessOR(canManageOrders, isDocumentOwner),
  },
  admin: {
    group: 'Users',
    defaultColumns: ['customer', 'addressLine1', 'city', 'state'],
    useAsTitle: 'createdAt',
    description: 'Customer addresses for shipping and billing purposes',
    hidden: true,
  },
  hooks: {
    beforeChange: [beforeChange],
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    ...addressFields.filter((field) => {
      if ('name' in field) {
        return field.name !== 'country' && field.name !== 'state'
      }
      return true
    }),
    {
      name: 'state',
      type: 'select',
      label: 'State',
      required: true,
      options: NIGERIAN_STATES,
    },
    {
      name: 'country',
      type: 'select',
      required: true,
      defaultValue: 'NG',
      options: [
        {
          label: 'Nigeria',
          value: 'NG',
        },
      ],
    },
  ],
}
