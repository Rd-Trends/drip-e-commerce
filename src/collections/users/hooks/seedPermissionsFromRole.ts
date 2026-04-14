import type { CollectionBeforeChangeHook } from 'payload'
import { USER_ROLES, type UserRole } from '@/lib/constants'
import { getPermissionsForRole } from '@/lib/permissions'

/**
 * Before-change hook that seeds `permissions` from the user's `role`.
 *
 * Rules:
 * - On create: always seed permissions from the assigned role.
 * - On update: re-seed (replace) permissions only when the role field changes.
 *   No merging — the new role template becomes the authoritative set.
 * - Admin role is still a hard bypass in access checkers, but we seed all
 *   permissions for it anyway so the field is never empty.
 */
export const seedPermissionsFromRole: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  const newRole = (data.role as UserRole) ?? null
  const oldRole = (originalDoc?.role as UserRole) ?? null

  if (operation === 'create') {
    // Default to customer if no role provided
    const roleToSeed = newRole ?? USER_ROLES.CUSTOMER
    data.permissions = getPermissionsForRole(roleToSeed)
  } else if (operation === 'update' && newRole && newRole !== oldRole) {
    // Role changed — replace permissions entirely (no merging)
    data.permissions = getPermissionsForRole(newRole)
  }

  return data
}
