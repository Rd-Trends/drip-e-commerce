import type { CollectionAfterChangeHook } from 'payload'

import type { WhatsappSession } from '@/payload-types'

export const retryFailedSession: CollectionAfterChangeHook<WhatsappSession> = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation !== 'update') {
    return doc
  }

  const wasFailed = previousDoc?.status === 'failed'
  const isRetryStatus = doc.status === 'pending'

  if (!wasFailed || !isRetryStatus) {
    return doc
  }

  await req.payload.jobs.queue({
    task: 'processWhatsappSession',
    input: {
      sessionId: doc.id,
      phone: doc.phone,
    },
    queue: 'whatsapp',
  })

  req.payload.jobs
    .run({ queue: 'whatsapp', limit: 1 })
    .catch((error) =>
      req.payload.logger.error(
        error,
        `[whatsapp] Failed to trigger retry runner for session ${doc.id}`,
      ),
    )

  return doc
}
