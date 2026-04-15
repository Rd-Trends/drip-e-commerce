/**
 * Shared utilities for WhatsApp product-creation conversations.
 */

import type { BasePayload, PayloadRequest } from 'payload'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Keywords that trigger product creation (case-insensitive, trimmed). */
export const CONFIRMATION_RE = /^(done|proceed|create|start\s*creating|go|finish)$/i

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatedProductSummary = {
  title: string
  costPrice: number
  price: number
  variantInfo: string
  categoryCount: number
  categoryNames: string
  adminUrl: string
}

// ─── Conversation helpers ────────────────────────────────────────────────────

/** Returns the most recent `pending` conversation for a given phone number, or `null`. */
export async function findPendingSession(
  payload: BasePayload,
  phone: string,
  req?: PayloadRequest,
) {
  const result = await payload.find({
    collection: 'whatsapp-sessions',
    where: { and: [{ phone: { equals: phone } }, { status: { equals: 'pending' } }] },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
    ...(req ? { req } : {}),
  })
  return result.docs[0] ?? null
}

// ─── Rich-text / media helpers ────────────────────────────────────────────────

/**
 * Converts plain text to Lexical rich-text JSON for Payload's editor.
 * Double newlines become separate paragraph nodes.
 */
export function textToLexical(text: string) {
  const paragraphs = text.split(/\n\n+/).filter(Boolean)
  return {
    root: {
      type: 'root',
      children: paragraphs.map((p) => ({
        type: 'paragraph',
        children: [{ type: 'text', text: p.trim(), version: 1 }],
        direction: 'ltr' as const,
        format: '' as const,
        indent: 0,
        version: 1,
      })),
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      version: 1,
    },
  }
}

export function getImageExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return (
        mimeType
          .split('/')
          .pop()
          ?.replace(/[^a-z0-9]/gi, '')
          .toLowerCase() || 'jpg'
      )
  }
}
