import type { TaskHandler } from 'payload'

const ABANDONMENT_THRESHOLD_MS = 10 * 60 * 1000 // 10 minutes

type TaskIO = {
  input: Record<string, never>
  output: { updated: number }
}

export const handler: TaskHandler<'markAbandonedCarts'> = async ({ req }) => {
  const payload = req.payload
  const cutoff = new Date(Date.now() - ABANDONMENT_THRESHOLD_MS).toISOString()

  const { docs: staleCarts } = await payload.find({
    collection: 'carts',
    where: {
      and: [
        { status: { equals: 'active' } },
        { purchasedAt: { exists: false } },
        { customer: { exists: true } },
        { updatedAt: { less_than: cutoff } },
      ],
    },
    limit: 0,
    depth: 0,
  })

  if (staleCarts.length === 0) {
    return { output: { updated: 0 } }
  }

  await Promise.all(
    staleCarts.map((cart) =>
      payload.update({
        collection: 'carts',
        id: cart.id,
        data: { status: 'abandoned' },
        req,
      }),
    ),
  )

  payload.logger.info(`[markAbandonedCarts] Marked ${staleCarts.length} cart(s) as abandoned`)
  return { output: { updated: staleCarts.length } }
}
