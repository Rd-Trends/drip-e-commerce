import { seoPlugin } from '@payloadcms/plugin-seo'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { Plugin } from 'payload'
import { Product } from '@/payload-types'
import { s3Storage } from '@payloadcms/storage-s3'
import { getServerSideURL } from '@/utils/get-url'

const generateTitle: GenerateTitle<Product> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Payload Ecommerce Template` : 'Payload Ecommerce Template'
}

const generateURL: GenerateURL<Product> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

const isLocal = process.env.IS_LOCAL === 'true'

export const plugins: Plugin[] = [
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  ...(isLocal
    ? []
    : [
        s3Storage({
          collections: {
            media: true,
          },
          bucket: process.env.S3_BUCKET!,
          config: {
            forcePathStyle: true,
            credentials: {
              accessKeyId: process.env.S3_ACCESS_KEY_ID!,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
            },
            region: process.env.S3_REGION!,
            endpoint: process.env.S3_ENDPOINT!,
          },
        }),
      ]),
]
