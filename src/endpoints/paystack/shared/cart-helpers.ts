import { Cart, User } from '@/payload-types'
import { DefaultDocumentIDType } from 'payload'

/**
 * Gets cart ID from user or request data
 */
export function getCartID(
  user: User | null,
  dataCartID?: DefaultDocumentIDType,
): {
  cartID?: DefaultDocumentIDType
  cart?: Cart
} {
  if (!user) {
    return { cartID: dataCartID }
  }

  if (user.cart?.docs && Array.isArray(user.cart.docs) && user.cart.docs.length > 0) {
    const userCart = user.cart.docs[0]

    if (!dataCartID && userCart) {
      if (typeof userCart === 'object') {
        return { cartID: userCart.id, cart: userCart }
      } else {
        return { cartID: userCart }
      }
    }
  }

  return { cartID: dataCartID }
}

/**
 * Gets customer email from user or request data
 */
export function getCustomerEmail(user: User | null, dataEmail?: string): string {
  if (user?.email) {
    return user.email
  }

  if (dataEmail && typeof dataEmail === 'string') {
    return dataEmail
  }

  throw new Error('A customer email is required to make a purchase.')
}

/**
 * Gets currency from cart or uses default
 */
export function getCurrency(cart: Cart | undefined, defaultCurrency: string): string {
  if (cart?.currency && typeof cart.currency === 'string') {
    return cart.currency
  }
  return defaultCurrency
}
