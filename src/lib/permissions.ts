import { USER_ROLES, type UserRole } from './constants'

/**
 * Granular permission constants — one per resource / action.
 *
 * Design rules:
 * - `admin` role bypasses every check (no permission lookup needed).
 * - Every other role derives its access solely from its `permissions` array.
 * - READ permissions gate draft/unpublished visibility inside the Payload admin.
 *   WRITE permissions gate mutations. Grant both to staff who need full CRUD.
 * - Public storefront read access is handled by `() => true` in collections
 *   and is completely unaffected by these permissions.
 */
export const PERMISSIONS = {
  // ── Products ──────────────────────────────────────────────────────────────
  /** See all products in the admin panel, including unpublished drafts. */
  PRODUCTS_READ: 'products:read',
  /** Create, update, and delete products. */
  PRODUCTS_WRITE: 'products:write',

  // ── Categories ────────────────────────────────────────────────────────────
  /** Create, update, and delete categories. (Public read is unrestricted.) */
  CATEGORIES_MANAGE: 'categories:manage',

  // ── Pages ─────────────────────────────────────────────────────────────────
  /** See all pages in the admin panel, including unpublished drafts. */
  PAGES_READ: 'pages:read',
  /** Create, update, and delete pages. */
  PAGES_WRITE: 'pages:write',

  // ── Media ─────────────────────────────────────────────────────────────────
  /** Upload, update, and delete media files. (Public read is unrestricted.) */
  MEDIA_MANAGE: 'media:manage',

  // ── Variants ──────────────────────────────────────────────────────────────
  /** Create, update, delete, and view draft variants / types / options. */
  VARIANTS_MANAGE: 'variants:manage',

  // ── Forms ─────────────────────────────────────────────────────────────────
  /** Manage form definitions and read form submissions. */
  FORMS_MANAGE: 'forms:manage',

  // ── Site globals ──────────────────────────────────────────────────────────
  /** Update the site-wide announcement banner. */
  BANNER_MANAGE: 'banner:manage',
  /** Update the header navigation. */
  HEADER_MANAGE: 'header:manage',
  /** Update the footer navigation. */
  FOOTER_MANAGE: 'footer:manage',
  /** Update the home page layout and product sections. */
  HOME_MANAGE: 'home:manage',
  /** Update shipping fees and tax rates. */
  SHIPPING_MANAGE: 'shipping:manage',

  // ── Orders ────────────────────────────────────────────────────────────────
  /** View all orders (staff-wide visibility, includes customer-owned rows). */
  ORDERS_READ: 'orders:read',
  /** Create, update, and delete orders. */
  ORDERS_WRITE: 'orders:write',

  // ── Transactions ──────────────────────────────────────────────────────────
  /** View all payment transactions. */
  TRANSACTIONS_READ: 'transactions:read',
  /** Create and update payment transactions. */
  TRANSACTIONS_WRITE: 'transactions:write',

  // ── Coupons ───────────────────────────────────────────────────────────────
  /** View coupon codes and their usage stats. */
  COUPONS_READ: 'coupons:read',
  /** Create, update, and delete coupons. */
  COUPONS_WRITE: 'coupons:write',

  // ── Users ─────────────────────────────────────────────────────────────────
  /** Create, update, delete, and view all user accounts. */
  USERS_MANAGE: 'users:manage',

  // ── Analytics ─────────────────────────────────────────────────────────────
  /** View analytics dashboards and reports. */
  ANALYTICS_VIEW: 'analytics:view',

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  /** Read and manage WhatsApp chat sessions. */
  WHATSAPP_MANAGE: 'whatsapp:manage',
} as const

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

/**
 * Human-readable labels for each permission, used in the admin UI select field.
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  'products:read': 'View Products (incl. drafts)',
  'products:write': 'Manage Products',
  'categories:manage': 'Manage Categories',
  'pages:read': 'View Pages (incl. drafts)',
  'pages:write': 'Manage Pages',
  'media:manage': 'Manage Media',
  'variants:manage': 'Manage Variants',
  'forms:manage': 'Manage Forms & Submissions',
  'banner:manage': 'Manage Banner',
  'header:manage': 'Manage Header',
  'footer:manage': 'Manage Footer',
  'home:manage': 'Manage Home Page',
  'shipping:manage': 'Manage Shipping & Tax',
  'orders:read': 'View Orders',
  'orders:write': 'Manage Orders',
  'transactions:read': 'View Transactions',
  'transactions:write': 'Manage Transactions',
  'coupons:read': 'View Coupons',
  'coupons:write': 'Manage Coupons',
  'users:manage': 'Manage Users',
  'analytics:view': 'View Analytics',
  'whatsapp:manage': 'Manage WhatsApp',
}

/**
 * Logical grouping of permissions for organised display in the admin UI.
 */
export const PERMISSION_GROUPS: Record<string, Permission[]> = {
  Products: [PERMISSIONS.PRODUCTS_READ, PERMISSIONS.PRODUCTS_WRITE],
  Categories: [PERMISSIONS.CATEGORIES_MANAGE],
  Pages: [PERMISSIONS.PAGES_READ, PERMISSIONS.PAGES_WRITE],
  Media: [PERMISSIONS.MEDIA_MANAGE],
  Variants: [PERMISSIONS.VARIANTS_MANAGE],
  Forms: [PERMISSIONS.FORMS_MANAGE],
  'Site Globals': [
    PERMISSIONS.BANNER_MANAGE,
    PERMISSIONS.HEADER_MANAGE,
    PERMISSIONS.FOOTER_MANAGE,
    PERMISSIONS.HOME_MANAGE,
    PERMISSIONS.SHIPPING_MANAGE,
  ],
  Orders: [PERMISSIONS.ORDERS_READ, PERMISSIONS.ORDERS_WRITE],
  Transactions: [PERMISSIONS.TRANSACTIONS_READ, PERMISSIONS.TRANSACTIONS_WRITE],
  Coupons: [PERMISSIONS.COUPONS_READ, PERMISSIONS.COUPONS_WRITE],
  Users: [PERMISSIONS.USERS_MANAGE],
  Analytics: [PERMISSIONS.ANALYTICS_VIEW],
  WhatsApp: [PERMISSIONS.WHATSAPP_MANAGE],
}

const ALL_PERMISSIONS = Object.values(PERMISSIONS) as Permission[]

/**
 * Default permissions seeded onto a user when their `role` is assigned or changed.
 *
 * Seeding rules (enforced by the `seedPermissionsFromRole` beforeChange hook):
 * - On user creation  → permissions are initialised from this template.
 * - On role change    → permissions are *replaced* (not merged) with the new template.
 * - Admin role        → seeded with all permissions for completeness, but the admin
 *                       bypass in `hasPermission` means the array is never consulted.
 * - Customer role     → no permissions; access is governed purely by document
 *                       ownership filters (e.g. `customer === user.id`).
 */
export const ROLE_PERMISSION_TEMPLATES: Record<UserRole, Permission[]> = {
  [USER_ROLES.ADMIN]: ALL_PERMISSIONS,

  [USER_ROLES.ORDER_MANAGER]: [
    PERMISSIONS.ORDERS_READ,
    PERMISSIONS.ORDERS_WRITE,
    PERMISSIONS.TRANSACTIONS_READ,
    PERMISSIONS.COUPONS_READ,
    PERMISSIONS.PRODUCTS_READ, // read-only product visibility when processing orders
  ],

  [USER_ROLES.CONTENT_MANAGER]: [
    PERMISSIONS.PRODUCTS_READ,
    PERMISSIONS.PRODUCTS_WRITE,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.PAGES_READ,
    PERMISSIONS.PAGES_WRITE,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.VARIANTS_MANAGE,
    PERMISSIONS.FORMS_MANAGE,
    PERMISSIONS.BANNER_MANAGE,
    PERMISSIONS.HEADER_MANAGE,
    PERMISSIONS.FOOTER_MANAGE,
    PERMISSIONS.HOME_MANAGE,
    PERMISSIONS.COUPONS_READ,
    PERMISSIONS.COUPONS_WRITE,
  ],

  [USER_ROLES.CUSTOMER]: [],
}

/**
 * Returns the seeded permissions for a given role.
 * Falls back to an empty array for any unrecognised role value.
 */
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return ROLE_PERMISSION_TEMPLATES[role] ?? []
}
