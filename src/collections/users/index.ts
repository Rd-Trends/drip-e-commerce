import type { CollectionConfig } from 'payload'

import { adminOnlyFieldAccess } from '@/access/admin-only-field-access'
import { checkRole, hasPermission, permissionOrSelf, requirePermission } from '@/access/utilities'
import { USER_ROLES, ROLE_LABELS, STAFF_ROLES } from '@/lib/constants'
import { PERMISSIONS, PERMISSION_LABELS } from '@/lib/permissions'

import { ensureFirstUserIsAdmin } from './hooks/ensureFirstUserIsAdmin'
import { seedPermissionsFromRole } from './hooks/seedPermissionsFromRole'
import { render } from '@react-email/components'
import { ForgotPasswordEmail } from '@/lib/emails/forgot-password'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    /**
     * Who can log in to the Payload admin panel.
     * Any staff role (admin, order-manager, content-manager) qualifies.
     */
    admin: ({ req: { user } }) => checkRole(STAFF_ROLES, user),

    /**
     * Creating a user:
     * - Unauthenticated → public registration (customer sign-up).
     * - Authenticated   → requires USERS_MANAGE (staff only).
     */
    create: ({ req: { user } }) => {
      if (user) return hasPermission(user, PERMISSIONS.USERS_MANAGE)
      return true // Allow public registration
    },

    /**
     * Deleting an account requires USERS_MANAGE.
     */
    delete: requirePermission(PERMISSIONS.USERS_MANAGE),

    /**
     * USERS_MANAGE holders see all users; everyone else sees only their own record.
     */
    read: permissionOrSelf(PERMISSIONS.USERS_MANAGE),

    /**
     * USERS_MANAGE holders can update any user; everyone else updates only themselves.
     */
    update: permissionOrSelf(PERMISSIONS.USERS_MANAGE),
  },
  admin: {
    group: 'Users',
    defaultColumns: ['name', 'email', 'role', 'createdAt', 'updatedAt'],
    useAsTitle: 'name',
  },
  auth: {
    tokenExpiration: 1209600,
    forgotPassword: {
      generateEmailHTML: async (args) => {
        if (!args) return ''
        const { token, user, req } = args
        const referer = req?.headers.get('referer') || ''
        const origin = req?.headers.get('origin') || process.env.NEXT_PUBLIC_SERVER_URL || ''

        const isAdminRequest = referer.includes('/admin') || referer.includes('/api/users')

        const resetPasswordURL = isAdminRequest
          ? `${origin}/admin/reset/${token}`
          : `${origin}/reset-password?token=${token}`

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
  hooks: {
    beforeChange: [seedPermissionsFromRole],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },

    // ── Role ──────────────────────────────────────────────────────────────────
    {
      name: 'role',
      type: 'select',
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      defaultValue: USER_ROLES.CUSTOMER,
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
          'Assign a single role to this user. Saving seeds the permissions array below. ' +
          'Admin: full system bypass | Customer: shopping only | ' +
          'Order Manager: order processing | Content Manager: product & content management',
      },
    },

    // ── Permissions ────────────────────────────────────────────────────────────
    {
      name: 'permissions',
      type: 'select',
      hasMany: true,
      access: {
        create: adminOnlyFieldAccess,
        read: adminOnlyFieldAccess,
        update: adminOnlyFieldAccess,
      },
      options: Object.values(PERMISSIONS).map((value) => ({
        label: PERMISSION_LABELS[value],
        value,
      })),
      admin: {
        description:
          'Fine-grained permissions for this user. Auto-seeded when the role is first assigned or ' +
          'changed (replacing any previous value — no merging). Admins can override individual ' +
          'permissions here after the seed. Note: the admin role bypasses these checks entirely.',
      },
    },

    // ── Joins ──────────────────────────────────────────────────────────────────
    {
      name: 'orders',
      type: 'join',
      collection: 'orders',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['id', 'createdAt', 'status', 'grandTotal', 'customerEmail'],
      },
    },
    {
      name: 'cart',
      type: 'join',
      collection: 'carts',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['createdAt', 'status', 'subtotal', 'currency', 'updatedAt'],
      },
    },
    {
      name: 'addresses',
      type: 'join',
      collection: 'addresses',
      on: 'customer',
      admin: {
        allowCreate: false,
        defaultColumns: ['title', 'addressLine1', 'city', 'state', 'updatedAt'],
      },
    },
  ],
}
