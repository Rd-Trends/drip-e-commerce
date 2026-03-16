import type { Order } from '@/payload-types'
import type { UIFieldServerProps } from 'payload'

const formatDate = (value?: string | null) => {
  if (!value) return null

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const getCustomerLabel = (order: Pick<Order, 'customer' | 'customerEmail'>) => {
  const customer = order.customer

  if (customer && typeof customer === 'object' && 'email' in customer) {
    return typeof customer.email === 'string' ? customer.email : 'Customer'
  }

  if (typeof order.customerEmail === 'string' && order.customerEmail.length > 0) {
    return order.customerEmail
  }

  return 'Guest checkout'
}

export async function CouponUsageSummaryField({ id, payload }: UIFieldServerProps) {
  if (!id) {
    return (
      <div style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem' }}>
        Save this coupon to view usage details.
      </div>
    )
  }

  const orders = await payload.find({
    collection: 'orders',
    depth: 1,
    limit: 10,
    overrideAccess: true,
    sort: '-createdAt',
    where: {
      coupon: {
        equals: id,
      },
    },
  })

  const usageCount = orders.totalDocs
  const ordersListURL = `/admin/collections/orders?where[coupon][equals]=${encodeURIComponent(String(id))}`

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '8px',
        padding: '12px',
        background: 'var(--theme-bg)',
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            color: 'var(--theme-elevation-500)',
            fontSize: '0.75rem',
            marginBottom: '4px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Usage Count
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 600 }}>{usageCount}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <a href={ordersListURL} style={{ color: 'var(--theme-success-600)', fontWeight: 500 }}>
          View all matching orders
        </a>

        {usageCount === 0 ? (
          <div style={{ color: 'var(--theme-elevation-500)', fontSize: '0.875rem' }}>
            No orders have used this coupon yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {orders.docs.map((order) => {
              const status = typeof order.status === 'string' ? order.status : 'unknown'
              const createdAt = formatDate(
                typeof order.createdAt === 'string' ? order.createdAt : null,
              )

              return (
                <div
                  key={String(order.id)}
                  style={{
                    borderTop: '1px solid var(--theme-elevation-100)',
                    paddingTop: '8px',
                  }}
                >
                  <a
                    href={`/admin/collections/orders/${order.id}`}
                    style={{ color: 'var(--theme-success-600)', fontWeight: 500 }}
                  >
                    Order #{String(order.id)}
                  </a>
                  <div style={{ color: 'var(--theme-elevation-700)', fontSize: '0.875rem' }}>
                    {getCustomerLabel(order)}
                  </div>
                  <div style={{ color: 'var(--theme-elevation-500)', fontSize: '0.8125rem' }}>
                    {status}
                    {createdAt ? ` • ${createdAt}` : ''}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
