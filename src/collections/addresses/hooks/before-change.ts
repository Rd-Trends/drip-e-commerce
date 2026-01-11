import { checkRole } from '@/access/utilities'
import { USER_ROLES } from '@/lib/constants'
import type { CollectionBeforeChangeHook } from 'payload'

export const beforeChange: CollectionBeforeChangeHook = async ({ data, req }) => {
  // Ensure that the customer field is set to the current user's ID if the user is a customer.
  // Admins can set to any customer.
  if (req.user && checkRole([USER_ROLES.CUSTOMER], req.user)) {
    data.customer = req.user.id
  }
}
