import type { CollectionConfig } from 'payload'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'
import { retryFailedSession } from './hooks/retryFailedSession'

export const WhatsappSessions: CollectionConfig = {
  slug: 'whatsapp-sessions',
  access: {
    create: requirePermission(PERMISSIONS.WHATSAPP_MANAGE),
    read: requirePermission(PERMISSIONS.WHATSAPP_MANAGE),
    update: requirePermission(PERMISSIONS.WHATSAPP_MANAGE),
    delete: requirePermission(PERMISSIONS.WHATSAPP_MANAGE),
  },
  admin: {
    group: 'WhatsApp',
    useAsTitle: 'phone',
    defaultColumns: ['phone', 'senderName', 'status', 'updatedAt'],
  },
  hooks: {
    afterChange: [retryFailedSession],
  },
  fields: [
    // phone — indexed for fast per-sender lookup
    { name: 'phone', type: 'text', required: true, index: true },
    { name: 'senderName', type: 'text' },

    // state machine
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Processing', value: 'processing' },
        { label: 'Done', value: 'done' },
        { label: 'Failed', value: 'failed' },
      ],
    },

    {
      name: 'messages',
      type: 'join',
      collection: 'whatsapp-messages',
      on: 'conversation',
      admin: {
        allowCreate: false,
        defaultColumns: ['orderIndex', 'type', 'text', 'image', 'updatedAt'],
        description: 'Chronological log of all messages linked to this conversation',
      },
      defaultLimit: 100,
      maxDepth: 1,
    },
  ],
  labels: {
    singular: 'WhatsApp Conversation',
    plural: 'WhatsApp Conversations',
  },
}
