import { postgresAdapter } from '@payloadcms/db-postgres'
import {
  BoldFeature,
  EXPERIMENTAL_TableFeature,
  IndentFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

import { Categories } from '@/collections/categories'
import { Coupons } from '@/collections/coupons'
import { Media } from '@/collections/media'
import { Users } from '@/collections/users'
import { plugins } from './plugins'
import { Addresses } from './collections/address'
import { Products } from './collections/products'
import { VariantTypes } from './collections/variant/type'
import { VariantOptions } from './collections/variant/option'
import { Variants } from './collections/variant'
import { Carts } from './collections/cart'
import { Orders } from './collections/oder'
import { Transactions } from './collections/transaction'
import { ecommerceTranslationsEN } from './translations/en'
import { initiatePaystackPaymentHandler } from './endpoints/paystack/initiate'
import { confirmPaystackOrderHandler } from './endpoints/paystack/confirm'
import { Header } from './globals/header'
import { Footer } from './globals/footer'
import { Home } from './globals/home'
import { ShippingConfig } from './globals/shipping-config'
import { Banner } from './globals/banner'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {},
    user: Users.slug,
  },
  collections: [
    Users,
    Categories,
    Coupons,
    Media,
    Addresses,
    Products,
    Variants,
    VariantTypes,
    VariantOptions,
    Carts,
    Orders,
    Transactions,
  ],
  globals: [Header, Footer, Home, ShippingConfig, Banner],
  i18n: {
    translations: {
      en: ecommerceTranslationsEN,
    },
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  editor: lexicalEditor({
    features: () => {
      return [
        UnderlineFeature(),
        BoldFeature(),
        ItalicFeature(),
        OrderedListFeature(),
        UnorderedListFeature(),
        LinkFeature({
          // enabledCollections: ['pages'],
          fields: ({ defaultFields }) => {
            const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
              if ('name' in field && field.name === 'url') return false
              return true
            })

            return [
              ...defaultFieldsWithoutUrl,
              {
                name: 'url',
                type: 'text',
                admin: {
                  condition: ({ linkType }) => linkType !== 'internal',
                },
                label: ({ t }) => t('fields:enterURL'),
                required: true,
              },
            ]
          },
        }),
        IndentFeature(),
        EXPERIMENTAL_TableFeature(),
      ]
    },
  }),
  //email: nodemailerAdapter(),
  endpoints: [
    {
      path: '/payments/paystack/initiate',
      method: 'post',
      handler: initiatePaystackPaymentHandler,
    },
    {
      path: '/payments/paystack/confirm-order',
      method: 'post',
      handler: confirmPaystackOrderHandler,
    },
  ],
  plugins,
  email: nodemailerAdapter(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
})
