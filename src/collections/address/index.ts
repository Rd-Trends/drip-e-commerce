import { createAddressesCollection } from '@payloadcms/plugin-ecommerce'
import { customerOnlyFieldAccess } from '@/access/customerOnlyFieldAccess'
import { isAdmin } from '@/access/isAdmin'
import { isDocumentOwner } from '@/access/isDocumentOwner'
import { CountryType } from '@payloadcms/plugin-ecommerce/types'
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
