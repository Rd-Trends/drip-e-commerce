import type { PayloadHandler } from 'payload'
import { checkRole } from '@/access/utilities'
import { subDays } from 'date-fns'

export const productAnalyticsHandler: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user || !checkRole(['admin'], user)) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }

  try {
    const period = (req.query?.period || '30') as string
    const limit = parseInt((req.query?.limit as string) || '10')

    const endDate = new Date()
    const startDate = subDays(endDate, parseInt(period))

    // Fetch completed orders with items
    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: {
        status: { equals: 'completed' },
        createdAt: { greater_than_equal: startDate.toISOString() },
      },
      limit: 10000,
    })

    // Aggregate product sales
    const productSales = new Map<
      string,
      { id: string; title: string; revenue: number; quantity: number }
    >()

    for (const order of orders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (!item.product) continue

          const productId =
            typeof item.product === 'number' ? String(item.product) : String(item.product.id)
          const productTitle = typeof item.product === 'number' ? 'Unknown' : item.product.title

          const existing = productSales.get(productId) || {
            id: productId,
            title: productTitle,
            revenue: 0,
            quantity: 0,
          }

          // Calculate revenue from order total proportionally
          const itemTotal = (order.subtotal || 0) / (order.items?.length || 1)
          existing.revenue += itemTotal * (item.quantity || 1)
          existing.quantity += item.quantity || 0

          productSales.set(productId, existing)
        }
      }
    }

    // Sort by revenue and get top products
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)

    // Get low inventory products
    const { docs: products } = await payload.find({
      collection: 'products',
      where: {
        enableVariants: { equals: false },
        inventory: { less_than_equal: 10 },
      },
      limit: 20,
      select: {
        title: true,
        slug: true,
        inventory: true,
      },
    })

    // Get variants with low inventory
    const { docs: variants } = await payload.find({
      collection: 'variants',
      where: {
        inventory: { less_than_equal: 10 },
      },
      limit: 20,
    })

    const lowInventoryItems = [
      ...products.map((p) => ({
        id: String(p.id),
        name: p.title,
        type: 'product',
        inventory: p.inventory || 0,
      })),
      ...variants.map((v) => ({
        id: String(v.id),
        name: `${typeof v.product === 'number' ? 'Product' : v.product?.title || 'Product'} - ${v.title}`,
        type: 'variant',
        inventory: v.inventory || 0,
      })),
    ]
      .sort((a, b) => a.inventory - b.inventory)
      .slice(0, 10)

    // Category performance
    const categoryRevenue = new Map<string, { name: string; revenue: number; orders: number }>()

    for (const order of orders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const product = typeof item.product === 'object' ? item.product : null
          if (product && product.categories && Array.isArray(product.categories)) {
            for (const cat of product.categories) {
              const categoryId = typeof cat === 'number' ? String(cat) : String(cat?.id || '')
              const categoryName = typeof cat === 'number' ? 'Unknown' : cat?.title || 'Unknown'

              const existing = categoryRevenue.get(categoryId) || {
                name: categoryName,
                revenue: 0,
                orders: 0,
              }

              const itemTotal = (order.subtotal || 0) / (order.items?.length || 1)
              existing.revenue += itemTotal
              existing.orders += 1

              categoryRevenue.set(categoryId, existing)
            }
          }
        }
      }
    }

    const topCategories = Array.from(categoryRevenue.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    return Response.json({
      topProducts,
      lowInventoryItems,
      topCategories,
      period: parseInt(period),
    })
  } catch (error) {
    console.error('Product analytics error:', error)
    return Response.json({ error: 'Failed to fetch product analytics' }, { status: 500 })
  }
}
