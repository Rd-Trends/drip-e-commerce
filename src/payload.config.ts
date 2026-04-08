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
import { resendAdapter } from '@payloadcms/email-resend'

import { plugins } from './plugins'
import { Categories } from '@/collections/categories'
import { Coupons } from '@/collections/coupons'
import { Media } from '@/collections/media'
import { Users } from '@/collections/users'
import { Addresses } from '@/collections/addresses'
import { Products } from '@/collections/products'
import { VariantTypes } from '@/collections/variants/types'
import { VariantOptions } from '@/collections/variants/options'
import { Variants } from '@/collections/variants'
import { Carts } from '@/collections/carts'
import { Orders } from '@/collections/orders'
import { Transactions } from '@/collections/transactions'
import { ecommerceTranslationsEN } from './translations/en'
import { Header } from './globals/header'
import { Footer } from './globals/footer'
import { Home } from './globals/home'
import { ShippingConfig } from './globals/shipping-config'
import { Banner } from './globals/banner'
import { endpoints } from './endpoints'
import { Pages } from './collections/pages'
import { WhatsappSessions } from '@/collections/whatsapp-sessions'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below and the import `BeforeDashboard` statement on line 15.
      beforeDashboard: ['@/components/before-dashboard#BeforeDashboard'],
      graphics: {
        Icon: '@/components/logo#AdminLogoIcon',
        Logo: '@/components/logo#AdminLogo',
      },
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
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
    Pages,
    WhatsappSessions,
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
  endpoints,
  plugins,
  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'drip-fashion@drip.ng',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Drip Fashion',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  sharp,
})
