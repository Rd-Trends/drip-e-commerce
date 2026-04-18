import type { Access, FieldAccess, Where } from 'payload'
import { combineWhereConstraints } from 'payload/shared'
import type { User } from '@/payload-types'
import { USER_ROLES, type UserRole } from '@/lib/constants'
import type { Permission } from '@/lib/permissions'

// ─────────────────────────────────────────────────────────────────────────────
// Role helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the user has any of the given roles.
 * Works with the single `role` field on the User document.
 */
export const checkRole = (allRoles: UserRole[], user?: User | null): boolean => {
  if (user && allRoles.length > 0) {
    return allRoles.some((role) => user.role === role)
  }
  return false
}

// ─────────────────────────────────────────────────────────────────────────────
// Permission helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the user has the given permission.
 *
 * The `admin` role is a hard bypass — admins always have access regardless of
 * what is stored in `permissions`. All other roles rely solely on the
 * `permissions` array that was seeded when the role was assigned.
 */
export const hasPermission = (user: User | null | undefined, permission: Permission): boolean => {
  if (!user) return false
  // Admin role bypasses all permission checks
  if (user.role === USER_ROLES.ADMIN) return true
  return Array.isArray(user.permissions) && user.permissions.includes(permission)
}

// ─────────────────────────────────────────────────────────────────────────────
// Access factories
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Access factory: grants access when the requesting user holds the given
 * permission (or is an admin).
 *
 * @example
 * create: requirePermission(PERMISSIONS.ORDERS_WRITE)
 */
export const requirePermission = (permission: Permission): Access => {
  return ({ req }) => hasPermission(req.user, permission)
}

/**
 * Access factory: grants *full* access when the user holds the permission;
 * otherwise restricts reads to published documents only.
 * Use this on draft-enabled collections (products, pages, variants, etc.).
 *
 * @example
 * read: requirePermissionOrPublished(PERMISSIONS.PRODUCTS_READ)
 */
export const requirePermissionOrPublished = (permission: Permission): Access => {
  return ({ req: { user } }) => {
    if (hasPermission(user, permission)) return true
    return { _status: { equals: 'published' } }
  }
}

/**
 * Access factory: grants full access when the user holds the permission;
 * otherwise restricts to documents where `id` matches the requesting user.
 * Useful for the users collection (staff can read all, customers read only self).
 *
 * @example
 * read: permissionOrSelf(PERMISSIONS.USERS_MANAGE)
 */
export const permissionOrSelf = (permissions: Permission[]): Access => {
  return ({ req: { user } }) => {
    if (!user) return false
    if (permissions.some((permission) => hasPermission(user, permission))) return true
    return { id: { equals: user.id } }
  }
}

/**
 * Access factory: grants full access when the user holds the permission;
 * otherwise restricts to documents owned by the requesting user via the
 * `customer` relationship field.
 * Useful for orders, carts, addresses, and similar ownership-filtered collections.
 *
 * @example
 * read: permissionOrOwner(PERMISSIONS.ORDERS_READ)
 */
export const permissionOrOwner = (permission: Permission): Access => {
  return ({ req }) => {
    if (!req.user) return false
    if (hasPermission(req.user, permission)) return true
    if (req.user.id) return { customer: { equals: req.user.id } }
    return false
  }
}

/**
 * Field-level access factory: grants field access when the requesting user
 * holds the given permission (or is an admin).
 *
 * @example
 * access: { read: requireFieldPermission(PERMISSIONS.TRANSACTIONS_READ) }
 */
export const requireFieldPermission = (permissions: Permission[]): FieldAccess => {
  return ({ req: { user } }) => permissions.some((permission) => hasPermission(user, permission))
}

// ─────────────────────────────────────────────────────────────────────────────
// Combinator utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Combines multiple access functions with OR logic.
 *
 * Logic:
 * - If ANY function returns `true` → return `true` (full access, short-circuit)
 * - If ALL functions return `false` → return `false` (no access)
 * - If any functions return `Where` queries → combine them with OR logic
 *
 * @example
 * const canRead = accessOR(
 *   requirePermission(PERMISSIONS.ORDERS_READ),
 *   isDocumentOwner,
 *   hasCartSecretAccess(true)
 * )
 */
export const accessOR = (...accessFunctions: Access[]): Access => {
  return async (args) => {
    const whereQueries: Where[] = []

    for (const access of accessFunctions) {
      const result = await access(args)

      // Short-circuit on true - full access granted
      if (result === true) {
        return true
      }

      // Collect Where queries for combination (must be an object, not null/undefined/false)
      if (result && typeof result === 'object') {
        whereQueries.push(result)
      }
    }

    // If we have Where queries, combine them with OR
    if (whereQueries.length > 0) {
      return combineWhereConstraints(whereQueries, 'or')
    }

    // All checkers returned false - no access
    return false
  }
}

/**
 * Combines multiple access functions with AND logic.
 *
 * Logic:
 * - If ANY function returns `false` → return `false` (no access, short-circuit)
 * - If ALL functions return `true` → return `true` (full access)
 * - If any functions return `Where` queries → combine them with AND logic
 *
 * @example
 * const canUpdate = accessAND(
 *   isAuthenticated,
 *   isDocumentOwner
 * )
 */
export const accessAND = (...accessFunctions: Access[]): Access => {
  return async (args) => {
    const whereQueries: Where[] = []

    for (const access of accessFunctions) {
      const result = await access(args)

      // Short-circuit on false - no access
      if (result === false) {
        return false
      }

      // Collect Where queries for combination (must be an object, not null/undefined/true)
      if (result !== true && result && typeof result === 'object') {
        whereQueries.push(result)
      }
    }

    // If we have Where queries, combine them with AND
    if (whereQueries.length > 0) {
      return combineWhereConstraints(whereQueries, 'and')
    }

    // All checkers returned true - full access
    return true
  }
}

/**
 * Conditionally applies an access function based on a boolean condition or function.
 *
 * Useful for feature flags and plugin configuration.
 *
 * @param condition - Boolean or function to determine which function to use
 * @param accessFunction - Access function to use if condition is true
 * @param fallback - Access function to use if condition is false (defaults to denying access)
 *
 * @example
 * const canCreate = accessOR(
 *   isAdmin,
 *   conditional(allowGuestCarts, isGuest)
 * )
 */
export const conditional = (
  condition: ((args: any) => boolean) | boolean,
  accessFunction: Access,
  fallback: Access = () => false,
): Access => {
  return async (args) => {
    const shouldApply = typeof condition === 'function' ? condition(args) : condition
    if (shouldApply) {
      return accessFunction(args)
    }
    return fallback(args)
  }
}
