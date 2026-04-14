import type { CollectionConfig } from 'payload'
import { permissionOrOwner } from '@/access/utilities'
import { addressFields } from '@/fields/adress-fields'
import { NIGERIAN_STATES } from '@/lib/nigerian-states'
import { beforeChange } from './hooks/before-change'
import { PERMISSIONS } from '@/lib/permissions'

export const Addresses: CollectionConfig = {
  slug: 'addresses',
  access: {
    /**
     * Any authenticated user can create an address for themselves.
     * The beforeChange hook enforces the customer field for non-staff.
     */
    create: ({ req }) => !!req.user,
    /**
     * ORDERS_READ holders (order managers, admins) see all addresses.
     * Customers see only addresses where customer === user.id.
     */
    delete: permissionOrOwner(PERMISSIONS.ORDERS_WRITE),
    read: permissionOrOwner(PERMISSIONS.ORDERS_READ),
    update: permissionOrOwner(PERMISSIONS.ORDERS_WRITE),
  },
  admin: {
    group: 'Users',
    defaultColumns: ['customer', 'addressLine1', 'city', 'state', 'phone', 'updatedAt'],
    useAsTitle: 'addressLine1',
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
