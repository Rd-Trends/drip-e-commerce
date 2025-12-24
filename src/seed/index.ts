import { getPayload } from 'payload'
import config from '@payload-config'
import type { Media, Product, User } from '@/payload-types'
import fs from 'fs'
import path from 'path'

type PayloadClient = Awaited<ReturnType<typeof getPayload>>
type RichTextValue = NonNullable<Product['description']>

// Helper to create placeholder images
const createPlaceholderImage = async (
  payload: PayloadClient,
  name: string,
  color: string,
): Promise<Media['id']> => {
  // Create a simple SVG placeholder
  const svg = `<svg width="800" height="800" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="800" fill="${color}"/>
    <text x="50%" y="50%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">${name}</text>
  </svg>`

  const mediaDir = path.resolve(process.cwd(), 'public/media')
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true })
  }

  const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.svg`
  const filepath = path.join(mediaDir, filename)
  fs.writeFileSync(filepath, svg)

  const media = (await payload.create({
    collection: 'media',
    data: {
      alt: name,
    },
    filePath: filepath,
  })) as Media

  return media.id
}

// Helper to create lexical rich text
const createLexicalContent = (text: string): RichTextValue =>
  ({
    root: {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [
            {
              type: 'text',
              version: 1,
              text,
              format: 0,
              style: '',
              detail: 0,
              mode: 'normal',
            },
          ],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }) as RichTextValue

const seed = async () => {
  const payload = await getPayload({ config })

  console.log('🌱 Starting database seeding...\n')

  try {
    // Check if admin user already exists
    const existingUsers = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: 'admin@drip.com',
        },
      },
    })

    let adminUser: User

    if (existingUsers.docs.length > 0) {
      console.log('⚠️  Admin user already exists, skipping creation')
      adminUser = existingUsers.docs[0]
    } else {
      // Create admin user
      adminUser = await payload.create({
        collection: 'users',
        data: {
          email: 'admin@drip.com',
          password: 'password123',
          roles: ['admin'],
        },
      })
      console.log('✓ Admin user created (email: admin@drip.com, password: password123)')
    }

    // Create categories
    console.log('\n📁 Creating categories...')
    const menCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Men',
        slug: 'men',
      },
    })

    const womenCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Women',
        slug: 'women',
      },
    })

    const accessoriesCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Accessories',
        slug: 'accessories',
      },
    })

    const shoesCategory = await payload.create({
      collection: 'categories',
      data: {
        title: 'Shoes',
        slug: 'shoes',
      },
    })

    console.log('✓ 4 categories created: Men, Women, Accessories, Shoes')

    // Create media/placeholder images
    console.log('\n🖼️  Creating placeholder images...')
    const tshirtImage = await createPlaceholderImage(payload, 'T-Shirt', '#3498db')
    const jeansImage = await createPlaceholderImage(payload, 'Jeans', '#2c3e50')
    const jacketImage = await createPlaceholderImage(payload, 'Jacket', '#34495e')
    const dressImage = await createPlaceholderImage(payload, 'Dress', '#e74c3c')
    const bagImage = await createPlaceholderImage(payload, 'Bag', '#95a5a6')
    const sneakersImage = await createPlaceholderImage(payload, 'Sneakers', '#f39c12')
    console.log('✓ Placeholder images created')

    // Create variant types and options
    console.log('\n🎨 Creating variant types and options...')

    // Size variant type
    const sizeType = await payload.create({
      collection: 'variantTypes',
      data: {
        label: 'Size',
        name: 'size',
      },
    })

    const sizeOptions = await Promise.all([
      payload.create({
        collection: 'variantOptions',
        data: {
          label: 'Small',
          value: 'small',
          variantType: sizeType.id,
        },
      }),
      payload.create({
        collection: 'variantOptions',
        data: {
          label: 'Medium',
          value: 'medium',
          variantType: sizeType.id,
        },
      }),
      payload.create({
        collection: 'variantOptions',
        data: {
          label: 'Large',
          value: 'large',
          variantType: sizeType.id,
        },
      }),
      payload.create({
        collection: 'variantOptions',
        data: {
          label: 'X-Large',
          value: 'x-large',
          variantType: sizeType.id,
        },
      }),
    ])

    // Color variant type
    const colorType = await payload.create({
      collection: 'variantTypes',
      data: {
        label: 'Color',
        name: 'color',
      },
    })

    const colorOptions = await Promise.all([
      payload.create({
        collection: 'variantOptions',
        data: {
          label: 'White',
          value: 'white',
          variantType: colorType.id,
        },
      }),
      payload.create({
        collection: 'variantOptions',
        data: {
          label: 'Black',
          value: 'black',
          variantType: colorType.id,
        },
      }),
      payload.create({
        collection: 'variantOptions',
        data: {
          label: 'Blue',
          value: 'blue',
          variantType: colorType.id,
        },
      }),
      payload.create({
        collection: 'variantOptions',
        data: {
          label: 'Red',
          value: 'red',
          variantType: colorType.id,
        },
      }),
    ])

    console.log('✓ Variant types and options created')

    // Create simple products (no variants)
    console.log('\n👕 Creating simple products...')

    const simpleProducts = [
      {
        title: 'Crossbody Bag',
        slug: 'crossbody-bag',
        priceInNGN: 8500,
        inventory: 40,
        _status: 'published' as const,
        categories: [accessoriesCategory.id, womenCategory.id],
        description: createLexicalContent(
          'Stylish crossbody bag with adjustable strap. Perfect for everyday use and special occasions.',
        ),
        enableVariants: false,
        gallery: [
          {
            image: bagImage,
          },
        ],
      },
      {
        title: 'Sneakers - Urban Style',
        slug: 'urban-sneakers',
        priceInNGN: 18000,
        inventory: 35,
        _status: 'published' as const,
        categories: [shoesCategory.id, menCategory.id],
        description: createLexicalContent(
          'Comfortable urban sneakers with modern design. Great for everyday wear and light activities.',
        ),
        enableVariants: false,
        gallery: [
          {
            image: sneakersImage,
          },
        ],
      },
      {
        title: 'Leather Jacket',
        slug: 'leather-jacket',
        priceInNGN: 45000,
        inventory: 15,
        _status: 'published' as const,
        categories: [menCategory.id],
        description: createLexicalContent(
          'Premium leather jacket with a sleek design. Perfect for cooler weather and statement looks.',
        ),
        enableVariants: false,
        gallery: [
          {
            image: jacketImage,
          },
        ],
      },
    ]

    for (const productData of simpleProducts) {
      await payload.create({
        collection: 'products',
        data: productData,
      })
    }

    console.log(`✓ ${simpleProducts.length} simple products created`)

    // Create products with variants
    console.log('\n🎯 Creating products with variants...')

    // T-Shirt with Size and Color variants
    const tshirtProduct = await payload.create({
      collection: 'products',
      data: {
        title: 'Classic Cotton T-Shirt',
        slug: 'classic-cotton-tshirt',
        _status: 'published' as const,
        categories: [menCategory.id, womenCategory.id],
        description: createLexicalContent(
          'Premium cotton t-shirt available in multiple sizes and colors. Soft, comfortable, and perfect for everyday wear.',
        ),
        enableVariants: true,
        variantTypes: [sizeType.id, colorType.id],
        gallery: [
          {
            image: tshirtImage,
          },
        ],
      },
    })

    // Create variants for t-shirt (Small White, Medium White, Large Black, etc.)
    const tshirtVariants = [
      {
        options: [sizeOptions[0].id, colorOptions[0].id], // Small White
        priceInNGN: 5500,
        inventory: 20,
      },
      {
        options: [sizeOptions[1].id, colorOptions[0].id], // Medium White
        priceInNGN: 5500,
        inventory: 25,
      },
      {
        options: [sizeOptions[2].id, colorOptions[1].id], // Large Black
        priceInNGN: 6000,
        inventory: 15,
      },
      {
        options: [sizeOptions[3].id, colorOptions[2].id], // X-Large Blue
        priceInNGN: 6500,
        inventory: 10,
      },
    ]

    for (const variantData of tshirtVariants) {
      await payload.create({
        collection: 'variants',
        data: {
          ...variantData,
          product: tshirtProduct.id,
        },
      })
    }

    // Denim Jeans with Size variants
    const jeansProduct = await payload.create({
      collection: 'products',
      data: {
        title: 'Premium Denim Jeans',
        slug: 'premium-denim-jeans',
        _status: 'published' as const,
        categories: [menCategory.id, womenCategory.id],
        description: createLexicalContent(
          'High-quality denim jeans with a modern fit. Durable, stylish, and available in multiple sizes.',
        ),
        enableVariants: true,
        variantTypes: [sizeType.id],
        gallery: [
          {
            image: jeansImage,
          },
        ],
      },
    })

    // Create variants for jeans
    const jeansVariants = [
      {
        options: [sizeOptions[0].id], // Small
        priceInNGN: 14000,
        inventory: 12,
      },
      {
        options: [sizeOptions[1].id], // Medium
        priceInNGN: 15000,
        inventory: 18,
      },
      {
        options: [sizeOptions[2].id], // Large
        priceInNGN: 15000,
        inventory: 15,
      },
      {
        options: [sizeOptions[3].id], // X-Large
        priceInNGN: 16000,
        inventory: 8,
      },
    ]

    for (const variantData of jeansVariants) {
      await payload.create({
        collection: 'variants',
        data: {
          ...variantData,
          product: jeansProduct.id,
        },
      })
    }

    // Summer Dress with Size and Color variants
    const dressProduct = await payload.create({
      collection: 'products',
      data: {
        title: 'Floral Summer Dress',
        slug: 'floral-summer-dress',
        _status: 'published' as const,
        categories: [womenCategory.id],
        description: createLexicalContent(
          'Light and breezy floral dress perfect for summer days. Features a flattering silhouette in multiple sizes and colors.',
        ),
        enableVariants: true,
        variantTypes: [sizeType.id, colorType.id],
        gallery: [
          {
            image: dressImage,
          },
        ],
      },
    })

    // Create variants for dress
    const dressVariants = [
      {
        options: [sizeOptions[0].id, colorOptions[3].id], // Small Red
        priceInNGN: 12000,
        inventory: 10,
      },
      {
        options: [sizeOptions[1].id, colorOptions[2].id], // Medium Blue
        priceInNGN: 12000,
        inventory: 15,
      },
      {
        options: [sizeOptions[2].id, colorOptions[0].id], // Large White
        priceInNGN: 13000,
        inventory: 8,
      },
    ]

    for (const variantData of dressVariants) {
      await payload.create({
        collection: 'variants',
        data: {
          ...variantData,
          product: dressProduct.id,
        },
      })
    }

    console.log('✓ 3 products with variants created')

    // Configure Header Global
    console.log('\n🔗 Configuring header navigation...')
    await payload.updateGlobal({
      slug: 'header',
      data: {
        navItems: [
          {
            link: {
              label: 'Shop',
              url: '/shop',
            },
          },
          {
            link: {
              label: 'Men',
              url: '/categories?category=men',
            },
          },
          {
            link: {
              label: 'Women',
              url: '/categories?category=women',
            },
          },
          {
            link: {
              label: 'Accessories',
              url: '/categories?category=accessories',
            },
          },
        ],
      },
    })
    console.log('✓ Header navigation configured')

    // Configure Footer Global
    console.log('\n🦶 Configuring footer navigation...')
    await payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              label: 'About Us',
              url: '/about',
            },
          },
          {
            link: {
              label: 'Contact',
              url: '/contact',
            },
          },
          {
            link: {
              label: 'FAQs',
              url: '/faqs',
            },
          },
          {
            link: {
              label: 'Shipping & Returns',
              url: '/shipping',
            },
          },
        ],
      },
    })
    console.log('✓ Footer navigation configured')

    console.log('\n✅ Database seeding completed successfully!\n')
    console.log('📊 Summary:')
    console.log(`   - Users: 1 admin`)
    console.log(`   - Categories: 4`)
    console.log(`   - Media: 6 placeholder images`)
    console.log(`   - Variant Types: 2 (Size, Color)`)
    console.log(`   - Variant Options: 8`)
    console.log(`   - Simple Products: ${simpleProducts.length}`)
    console.log(`   - Products with Variants: 3`)
    console.log(`   - Total Variants: 11`)
    console.log(`   - Globals: Header & Footer configured`)
    console.log('\n🔐 Login credentials:')
    console.log('   Email: admin@drip.com')
    console.log('   Password: password123')
    console.log('\n🚀 Start the dev server with: pnpm dev')
    console.log('   Visit: http://localhost:3000/admin\n')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    process.exit(0)
  }
}

seed()
