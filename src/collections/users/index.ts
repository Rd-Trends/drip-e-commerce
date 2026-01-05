import type { CollectionConfig } from 'payload'

import { adminOnly } from '@/access/admin-only'
import { adminOnlyFieldAccess } from '@/access/admin-only-field-access'
import { adminOrSelf } from '@/access/adminor-self'
import { checkRole } from '@/access/utilities'
import { USER_ROLES, ROLE_LABELS, STAFF_ROLES } from '@/lib/constants'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import { render } from '@react-email/components'
import { ForgotPasswordEmail } from '@/lib/emails/forgot-password'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: ({ req: { user } }) => checkRole(STAFF_ROLES, user),
    create: ({ req: { user } }) => {
      // ensure only admins can create users
      if (user) {
        return checkRole([USER_ROLES.ADMIN], user)
      }

      return true // Allow public registration
    },
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
      defaultValue: [USER_ROLES.CUSTOMER],
      hasMany: true,
      hooks: {
        beforeChange: [ensureFirstUserIsAdmin],
      },
      options: [
        {
          label: ROLE_LABELS[USER_ROLES.ADMIN],
          value: USER_ROLES.ADMIN,
        },
        {
          label: ROLE_LABELS[USER_ROLES.CUSTOMER],
          value: USER_ROLES.CUSTOMER,
        },
        {
          label: ROLE_LABELS[USER_ROLES.ORDER_MANAGER],
          value: USER_ROLES.ORDER_MANAGER,
        },
        {
          label: ROLE_LABELS[USER_ROLES.CONTENT_MANAGER],
          value: USER_ROLES.CONTENT_MANAGER,
        },
      ],
      admin: {
        description:
          'Assign user roles to control access permissions. Admin: full system access | Customer: shopping only | Order Manager: order processing | Content Manager: product & content management',
      },
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
