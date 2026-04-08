const GRAPH_API_BASE = 'https://graph.facebook.com/v25.0'

/** Sends a plain-text WhatsApp message via the Cloud API. Never throws. */
export async function sendTextMessage(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

  if (!token || !phoneNumberId) {
    console.error('[whatsapp] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID')
    return
  }

  try {
    const res = await fetch(`${GRAPH_API_BASE}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    })

    if (!res.ok) {
      console.error(`[whatsapp] sendTextMessage failed (${res.status}): ${await res.text()}`)
    }
  } catch (err) {
    console.error('[whatsapp] sendTextMessage error:', err)
  }
}

/**
 * Downloads a WhatsApp image by media ID.
 * Returns a Buffer on success, or null on any failure.
 */
export async function downloadWhatsAppImage(
  mediaId: string,
  mimeType: string,
): Promise<Buffer | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!token) {
    console.error('[whatsapp] Missing WHATSAPP_ACCESS_TOKEN')
    return null
  }

  // ── Step 1: Resolve the CDN URL from the media ID ───────────────────────────
  let mediaUrl: string | undefined

  try {
    const metaRes = await fetch(`${GRAPH_API_BASE}/${mediaId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (!metaRes.ok) {
      console.error(`[whatsapp] Failed to fetch media metadata ${mediaId}: ${metaRes.status}`)
      return null
    }

    const metaData = (await metaRes.json()) as { url: string }
    mediaUrl = metaData.url
  } catch (err) {
    console.error(`[whatsapp] Could not fetch media metadata ${mediaId}:`, err)
    return null
  }

  if (!mediaUrl) {
    console.error(`[whatsapp] Media metadata for ${mediaId} contained no URL`)
    return null
  }

  // ── Step 2: Download the media bytes from the CDN URL ───────────────────────
  try {
    const fileRes = await fetch(mediaUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': mimeType,
      },
    })

    if (!fileRes.ok) {
      console.error(`[whatsapp] Failed to download media ${mediaId}: ${fileRes.status}`)
      return null
    }

    const arrayBuffer = await fileRes.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (err) {
    console.error(`[whatsapp] Could not download media ${mediaId}:`, err)
    return null
  }
}
