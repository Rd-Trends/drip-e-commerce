import type { CollectionBeforeChangeHook } from 'payload'

import { USER_ROLES } from '@/lib/constants'

/**
 * Before-change hook that protects admin users and the admin role from
 * being modified by non-admin staff.
 *
 * Rules enforced server-side (belt-and-suspenders on top of UI filterOptions):
 *
 * 1. On UPDATE — if the target document is an admin user:
 *    - The `role` field is locked back to `admin` regardless of what was sent.
 *    - The `permissions` array is locked back to its original value.
 *
 * 2. On UPDATE — if the incoming `role` is `admin` (attempted promotion):
 *    - The `role` is silently reverted to the document's current role.
 *
 * 3. On CREATE — if a non-admin tries to create a user with role `admin`:
 *    - The `role` is silently downgraded to `customer`.
 *    - Note: the `ensureFirstUserIsAdmin` field hook still runs after this and
 *      correctly forces the very first user to admin, so bootstrapping is safe.
 */
export const protectAdminRole: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  // Admins have full control — skip all checks.
  if (req.user?.role === USER_ROLES.ADMIN) return data

  if (operation === 'update') {
    // Rule 1: lock admin users — their role and permissions are immutable by non-admins.
    if (originalDoc?.role === USER_ROLES.ADMIN) {
      data.role = USER_ROLES.ADMIN
      if (originalDoc.permissions !== undefined) {
        data.permissions = originalDoc.permissions
      }
      return data
    }

    // Rule 2: block silent promotion — non-admins cannot set role to admin.
    if (data.role === USER_ROLES.ADMIN) {
      data.role = originalDoc?.role ?? USER_ROLES.CUSTOMER
    }
  }

  if (operation === 'create') {
    // Rule 3: non-admins cannot create an admin account directly.
    // The ensureFirstUserIsAdmin field hook handles the bootstrap edge-case
    // independently, so we safely downgrade here.
    if (data.role === USER_ROLES.ADMIN) {
      data.role = USER_ROLES.CUSTOMER
    }
  }

  return data
}
