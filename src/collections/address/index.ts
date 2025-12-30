import { createAddressesCollection } from '@payloadcms/plugin-ecommerce'
import { customerOnlyFieldAccess } from '@/access/customer-only-field-access'
import { isAdmin } from '@/access/is-admin'
import { isDocumentOwner } from '@/access/is-document-owner'
import { addressFields } from './fields'
import { CollectionConfig } from 'payload'
import { supportedCountries } from '@/lib/constants'

const defaultAddressesCollection = createAddressesCollection({
  access: {
    customerOnlyFieldAccess,
    isAdmin,
    isDocumentOwner,
    isAuthenticated: ({ req }) => !!req.user,
  },
  addressFields,
  customersSlug: 'users',
  supportedCountries,
})

export const Addresses: CollectionConfig = {
  ...defaultAddressesCollection,
  labels: {
    singular: 'Address',
    plural: 'Addresses',
  },
  admin: {
    ...defaultAddressesCollection?.admin,
    description: 'Customer addresses for shipping and billing purposes',
  },
}
