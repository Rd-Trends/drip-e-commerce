import type { CollectionConfig } from 'payload'

import { requirePermission } from '@/access/utilities'
import { PERMISSIONS } from '@/lib/permissions'

export const WhatsappMessages: CollectionConfig = {
  slug: 'whatsapp-messages',
  access: {
    create: requirePermission(PERMISSIONS.WHATSAPP_MANAGE),
    read: requirePermission(PERMISSIONS.WHATSAPP_MANAGE),
    update: requirePermission(PERMISSIONS.WHATSAPP_MANAGE),
    delete: requirePermission(PERMISSIONS.WHATSAPP_MANAGE),
  },
  admin: {
    hidden: true,
    useAsTitle: 'sourceMessageId',
    defaultColumns: ['conversation', 'orderIndex', 'type', 'text', 'image', 'updatedAt'],
  },
  fields: [
    {
      name: 'conversation',
      type: 'relationship',
      relationTo: 'whatsapp-sessions',
      required: true,
      index: true,
    },
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
    {
      name: 'sourceMessageId',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
      },
    },
  ],
  labels: {
    singular: 'WhatsApp Message',
    plural: 'WhatsApp Messages',
  },
}
