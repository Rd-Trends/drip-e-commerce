import type { CollectionSlug, File, Payload, PayloadRequest } from 'payload'
import { homeGlobal } from './home'
import { categoriesSeedData } from './categories'
import { variantsSeedData } from './variants'
import { shippingConfigSeedData } from './shipping-config'

const collections: CollectionSlug[] = [
  'categories',
  'media',
  'addresses',
  'products',
  'variants',
  'coupons',
  'pages',
  'forms',
  'form-submissions',
  'variantOptions',
  'variantTypes',
  'variants',
  'carts',
  'transactions',
  'orders',
]

const navGlobals = ['header', 'footer'] as const

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Seeding database...')
  payload.logger.info('Clearing existing data...')

  // Clear home global first to remove references to media
  await payload.updateGlobal({
    slug: 'home',
    data: { heroSlides: [], productSections: [] },
  })
  await Promise.all(
    navGlobals.map((global) =>
      payload.updateGlobal({
        slug: global,
        data: {
          navItems: [],
        },
        depth: 0,
        context: {
          disableRevalidate: true,
        },
      }),
    ),
  )

  for (const collection of collections) {
    await payload.db.deleteMany({ collection, req, where: {} })
    if (payload.collections[collection].config.versions) {
      await payload.db.deleteVersions({ collection, req, where: {} })
    }
  }

  if (process.env.IS_LOCAL) {
    payload.logger.info('Seeding admin user...')
    await payload.create({
      collection: 'users',
      data: {
        name: 'Admin User',
        email: 'admin@drip.com',
        password: 'admin123',
        roles: ['admin'],
      },
    })
  }

  payload.logger.info('Seeding categories...')
  await Promise.all(
    categoriesSeedData.map((categoryData) =>
      payload.create({
        collection: 'categories',
        data: {
          title: categoryData.title,
          slug: categoryData.slug,
        },
      }),
    ),
  )

  payload.logger.info('Seeding variants...')
  for (const variantData of variantsSeedData) {
    const variantType = await payload.create({
      collection: 'variantTypes',
      data: { label: variantData.label, name: variantData.name },
    })

    await Promise.all(
      variantData.options.map((option) => {
        return payload.create({
          collection: 'variantOptions',
          data: {
            label: option.label,
            value: option.value,
            variantType: variantType.id,
          },
        })
      }),
    )
  }

  payload.logger.info('Seeding media...')
  const [tshirtBlack, tshirtWhite] = await Promise.all([
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/tshirt-black.png',
    ),
    fetchFileByURL(
      'https://raw.githubusercontent.com/payloadcms/payload/refs/heads/main/templates/ecommerce/src/endpoints/seed/tshirt-white.png',
    ),
  ])
  const [uploadedBlackImage] = await Promise.all([
    payload.create({
      collection: 'media',
      data: { alt: 'Black T-Shirt' },
      file: tshirtBlack,
    }),
    payload.create({
      collection: 'media',
      data: { alt: 'White T-Shirt' },
      file: tshirtWhite,
    }),
  ])

  payload.logger.info('Seeding globals...')
  await payload.updateGlobal({
    slug: 'home',
    data: homeGlobal({ heroImage: uploadedBlackImage }),
  })
  await payload.updateGlobal({
    slug: 'shipping-config',
    data: shippingConfigSeedData,
  })

  payload.logger.info('Seeded database successfully!')
}

async function fetchFileByURL(url: string): Promise<File> {
  const res = await fetch(url, {
    credentials: 'include',
    method: 'GET',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
  }

  const data = await res.arrayBuffer()

  return {
    name: url.split('/').pop() || `file-${Date.now()}`,
    data: Buffer.from(data),
    mimetype: `image/${url.split('.').pop()}`,
    size: data.byteLength,
  }
}
