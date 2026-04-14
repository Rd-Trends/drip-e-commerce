import type { CollectionConfig } from 'payload'
import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'

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

    // chat-style message log
    {
      name: 'messages',
      type: 'array',
      admin: {
        description: 'Chronological log of all messages received in this session',
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Text', value: 'text' },
            { label: 'Image', value: 'image' },
          ],
        },
        {
          name: 'text',
          type: 'textarea',
          admin: { description: 'Message text content or image caption' },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: { condition: (_, siblingData) => siblingData?.type === 'image' },
        },
      ],
    },
  ],
}
