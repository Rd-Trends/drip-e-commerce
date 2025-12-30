import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/admin-only'
import { adminOnlyFieldAccess } from '@/access/admin-only-field-access'
import { publicAccess } from '@/access/public-access'
import { adminOrSelf } from '@/access/adminor-self'
import { checkRole } from '@/access/utilities'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import { render } from '@react-email/components'
import { ForgotPasswordEmail } from '@/lib/emails/forgot-password'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(['admin'], user),
    create: publicAccess,
    delete: adminOnly,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    group: 'Users',
    defaultColumns: ['name', 'email', 'roles'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 1209600,
    forgotPassword: {
      generateEmailHTML: async (args) => {
        if (!args) return ''
        const { token, user, req } = args
        // Determine if the request is from the customer-facing frontend or admin panel
        const referer = req?.headers.get('referer') || ''
        const origin = req?.headers.get('origin') || process.env.NEXT_PUBLIC_SERVER_URL || ''

        // Check if request is from admin panel
        const isAdminRequest = referer.includes('/admin') || referer.includes('/api/users')

        // Generate the appropriate reset password URL
        const resetPasswordURL = isAdminRequest
          ? `${origin}/admin/reset/${token}` // Admin panel reset
          : `${origin}/reset-password?token=${token}` // Customer frontend reset

        // Render the React Email template
        const html = await render(
          ForgotPasswordEmail({
            userName: user?.name,
            resetPasswordLink: resetPasswordURL,
          }),
        )

        return html
      },
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'roles',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: ['customer'],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: 'admin',
          value: 'admin',
        },
        {
          label: 'customer',
          value: 'customer',
        },
      ],
    },
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'total', 'currency', 'items'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id'],
      },
    },
  ],
}
