import { CollectionSlug, File, getPayload } from 'payload'
import config from '@payload-config'
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

async function main() {
  try {
    const payload = await getPayload({ config })

    payload.logger.info('Clearing existing data...')

    // Clear home global first to remove references to media
    await payload.updateGlobal({
      slug: 'home',
      data: { heroSlides: [], productSections: [] },
      context: { disableRevalidation: true },
    })

    for (const collection of collections) {
      await payload.delete({ collection, where: {}, context: { disableRevalidation: true } })
      if (payload.collections[collection].config.versions) {
        await payload.db.deleteVersions({ collection, where: {} })
      }
    }

    if (process.env.IS_LOCAL) {
      payload.logger.info('Seeding admin user...')
      payload.create({
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
          context: { disableRevalidation: true },
        }),
      ),
    )

    payload.logger.info('Seeding variants...')
    for (const variantdData of variantsSeedData) {
      const variantType = await payload.create({
        collection: 'variantTypes',
        data: { label: variantdData.label, name: variantdData.name },
      })

      await Promise.all(
        variantdData.options.map((option) => {
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
      loadLocalImage('public/media/tshirt-black.png'),
      loadLocalImage('public/media/tshirt-white.png'),
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
      context: { disableRevalidation: true },
    })
    await payload.updateGlobal({
      slug: 'shipping-config',
      data: shippingConfigSeedData,
      context: { disableRevalidation: true },
    })
  } catch (error) {
    console.error(JSON.stringify(error))
    process.exit(1)
  }

  process.exit(0)
}

// async function fetchFileByURL(url: string): Promise<File> {
//   const res = await fetch(url, {
//     credentials: 'include',
//     method: 'GET',
//   })

//   if (!res.ok) {
//     throw new Error(`Failed to fetch file from ${url}, status: ${res.status}`)
//   }

//   const data = await res.arrayBuffer()

//   return {
//     name: url.split('/').pop() || `file-${Date.now()}`,
//     data: Buffer.from(data),
//     mimetype: `image/${url.split('.').pop()}`,
//     size: data.byteLength,
//   }
// }

async function loadLocalImage(filePath: string): Promise<File> {
  const fs = await import('fs/promises')
  const path = await import('path')

  const absolutePath = path.join(process.cwd(), filePath)
  const data = await fs.readFile(absolutePath)
  const fileName = path.basename(filePath)
  const extension = path.extname(filePath).slice(1)

  return {
    name: fileName,
    data,
    mimetype: `image/${extension}`,
    size: data.byteLength,
  }
}

await main()
