// ---------------------------------------------------------------------------
// WhatsApp Cloud API v25.0 – Webhook Payload Types
// ---------------------------------------------------------------------------

/** Top-level webhook payload received from Meta's Cloud API. */
export interface WhatsAppWebhookPayload {
  /** Always `"whatsapp_business_account"` for WhatsApp webhooks. */
  object: string
  entry: WhatsAppEntry[]
}

export interface WhatsAppEntry {
  /** WhatsApp Business Account ID. */
  id: string
  changes: WhatsAppChange[]
}

export interface WhatsAppChange {
  value: WhatsAppValue
  /** The field that triggered the webhook – typically `"messages"`. */
  field: string
}

export interface WhatsAppValue {
  messaging_product: 'whatsapp'
  metadata: WhatsAppMetadata
  contacts?: WhatsAppContact[]
  messages?: WhatsAppMessage[]
  /** Present when the webhook reports delivery/read statuses instead of inbound messages. */
  statuses?: WhatsAppStatus[]
}

export interface WhatsAppMetadata {
  display_phone_number: string
  phone_number_id: string
}

export interface WhatsAppContact {
  profile: {
    name: string
  }
  wa_id: string
}

export interface WhatsAppMessage {
  from: string
  id: string
  /** Unix epoch in seconds (string). */
  timestamp: string
  type:
    | 'text'
    | 'image'
    | 'interactive'
    | 'button'
    | 'document'
    | 'audio'
    | 'video'
    | 'sticker'
    | 'location'
    | 'contacts'
    | 'order'
    | 'unknown'
  text?: WhatsAppText
  image?: WhatsAppImage
  interactive?: WhatsAppInteractive
}

export interface WhatsAppText {
  body: string
}

export interface WhatsAppImage {
  id: string
  mime_type: string
  sha256: string
  caption?: string
}

export interface WhatsAppInteractive {
  type: 'button_reply' | 'list_reply'
  button_reply?: {
    id: string
    title: string
  }
  list_reply?: {
    id: string
    title: string
    description?: string
  }
}

export interface WhatsAppStatus {
  id: string
  status: 'delivered' | 'read' | 'sent' | 'failed'
  timestamp: string
  recipient_id: string
}
