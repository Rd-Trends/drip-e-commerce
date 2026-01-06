import { Product } from '@/payload-types'
import { ProductGridItem } from '@/components/product/grid-item'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

type RelatedProductsSectionProps = {
  product: Product
  limit?: number
}

export async function RelatedProductsSection({ product, limit = 8 }: RelatedProductsSectionProps) {
  const payload = await getPayload({ config: configPromise })

  // Get manually specified related products
  const manualRelatedProductIds = new Set<string | number>()
  const manualRelatedProducts: Product[] = []

  if (product.relatedProducts?.length) {
    for (const relatedProduct of product.relatedProducts) {
      if (typeof relatedProduct === 'object') {
        manualRelatedProducts.push(relatedProduct)
        manualRelatedProductIds.add(relatedProduct.id)
      } else {
        manualRelatedProductIds.add(relatedProduct)
      }
    }
  }

  // Extract category IDs from the current product
  const categoryIds: (string | number)[] = []
  if (product.categories?.length) {
    for (const category of product.categories) {
      if (typeof category === 'object') {
        categoryIds.push(category.id)
      } else {
        categoryIds.push(category)
      }
    }
  }

  // Calculate how many more products we need to fetch
  const remainingLimit = limit - manualRelatedProducts.length

  let categoryRelatedProducts: Product[] = []

  // Only fetch category-based products if we need more
  if (remainingLimit > 0 && categoryIds.length > 0) {
    // Build exclusion list: current product + manually related products
    const excludeIds = [product.id, ...Array.from(manualRelatedProductIds)]

    const result = await payload.find({
      collection: 'products',
      depth: 1,
      draft: false,
      limit: remainingLimit,
      where: {
        and: [
          {
            _status: {
              equals: 'published',
            },
          },
          {
            categories: {
              in: categoryIds,
            },
          },
          {
            id: {
              not_in: excludeIds,
            },
          },
        ],
      },
    })

    categoryRelatedProducts = result.docs as Product[]
  }

  // Combine manual and category-based products
  const allRelatedProducts = [...manualRelatedProducts, ...categoryRelatedProducts]

  if (allRelatedProducts.length === 0) {
    return null
  }

  return (
    <div className="py-8">
      <h2 className="mb-4 text-2xl font-bold">Related Products</h2>
      <section className="grid grid-cols-2 gap-2 gap-y-6 md:gap-6 lg:grid-cols-3">
        {allRelatedProducts.map((relatedProduct) => {
          return <ProductGridItem key={relatedProduct.id} product={relatedProduct} />
        })}
      </section>
    </div>
  )
}
