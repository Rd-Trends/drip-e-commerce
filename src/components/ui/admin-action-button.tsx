'use client'

import { LinkButton, type buttonVariants } from '@/components/ui/button'
import { usePermissions, type Permissions } from '@/hooks/use-access'
import type { VariantProps } from 'class-variance-authority'

type PermissionKey = keyof Omit<Permissions, 'user' | 'isLoading'>

interface AdminActionButtonProps
  extends
    Omit<React.ComponentProps<typeof LinkButton>, 'href'>,
    VariantProps<typeof buttonVariants> {
  /**
   * The permission required to see this button
   * @example "canWriteProduct" | "canManageOrders" | "isAdmin"
   */
  permission: PermissionKey
  /**
   * The admin URL to navigate to when clicked
   * @example "/admin/collections/products/create"
   */
  href: string
  /**
   * Optional loading component while checking permissions
   */
  loadingComponent?: React.ReactNode
}

/**
 * A button that only renders for users with the specified permission.
 * Automatically checks user permissions and conditionally renders based on access level.
 *
 * @example
 * // Only visible to users who can manage content
 * <AdminActionButton
 *   permission="canManageOrder"
 *   href="/admin/collections/products/create"
 * >
 *   Create Product
 * </AdminActionButton>
 *
 * @example
 * // Only visible to admins
 * <AdminActionButton
 *   permission="isAdmin"
 *   href="/admin/collections/users/create"
 *   variant="outline"
 * >
 *   Add User
 * </AdminActionButton>
 *
 * @example
 * // For order managers
 * <AdminActionButton
 *   permission="canManageOrders"
 *   href="/admin/collections/orders"
 *   size="sm"
 * >
 *   View All Orders
 * </AdminActionButton>
 */
export function AdminActionButton({
  permission,
  href,
  loadingComponent = null,
  children,
  ...props
}: AdminActionButtonProps) {
  const permissions = usePermissions()

  // Don't render while checking permissions
  if (permissions.isLoading) {
    return loadingComponent
  }

  // Check if user has the required permission
  const hasPermission = permissions[permission]

  // Don't render if user doesn't have permission
  if (!hasPermission) {
    return null
  }

  return (
    <LinkButton href={href} {...props}>
      {children}
    </LinkButton>
  )
}
