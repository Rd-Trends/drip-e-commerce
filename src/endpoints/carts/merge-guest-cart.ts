import { Endpoint } from 'payload'
import type { Cart } from '@/payload-types'

/**
 * Merge Guest Cart Endpoint
 *
 * This endpoint handles the merging of guest carts with user carts after authentication.
 *
 * Behavior:
 * 1. If no guest cart provided: Returns user's existing cart (if any)
 * 2. If user has no cart: Converts guest cart to user cart (removes secret, sets customer)
 * 3. If user has a cart: Merges items from guest cart into user cart, then deletes guest cart
 *
 * Merging logic:
 * - If same product+variant exists in both carts, quantities are summed
 * - If product+variant only exists in guest cart, it's added to user cart
 * - Guest cart is deleted after successful merge
 *
 * @param {number} guestCartId - ID of the guest cart to merge
 * @param {string} guestCartSecret - Secret token for guest cart verification
 * @returns {Cart} The user's cart (merged or converted)
 */
export const mergeGuestCartHandler: Endpoint['handler'] = async (req) => {
  try {
    const payload = req.payload
    const body = await req.json?.()
    const { guestCartId, guestCartSecret } = body

    // Get authenticated user
    const user = req.user

    if (!user) {
      return Response.json({ error: 'User must be authenticated' }, { status: 401 })
    }

    // If no guest cart provided, just load user's cart
    if (!guestCartId) {
      const userCarts = await payload.find({
        collection: 'carts',
        where: {
          and: [
            {
              customer: {
                equals: user.id,
              },
            },
            {
              status: {
                equals: 'active',
              },
            },
          ],
        },
        limit: 1,
        depth: 0,
        req,
      })

      const userCart = userCarts.docs[0] || null

      return Response.json({
        success: true,
        cart: userCart,
        merged: false,
      })
    }

    // overrideAccess is needed to access carts by secret, if the secret isn't provided it won't find the cart
    const guestCartDocs = await payload.find({
      collection: 'carts',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      req,
      where: {
        and: [{ id: { equals: guestCartId } }, { secret: { equals: guestCartSecret } }],
      },
    })

    const guestCart = guestCartDocs.docs[0]

    if (!guestCart) {
      return Response.json({ error: 'Guest cart not found or invalid secret' }, { status: 404 })
    }

    // Find existing active user cart
    const userCartsResult = await payload.find({
      collection: 'carts',
      where: {
        and: [
          {
            customer: {
              equals: user.id,
            },
          },
          {
            status: {
              equals: 'active',
            },
          },
        ],
      },
      limit: 1,
      depth: 0,
      req,
    })

    const userCart = userCartsResult.docs[0]

    // Case 1: User has no cart - simply update guest cart to user cart
    if (!userCart) {
      const updatedCart = await payload.update({
        collection: 'carts',
        id: guestCartId,
        data: {
          customer: user.id,
          secret: null, // Remove secret since it's now a user cart
        },
        depth: 0,
        req,
      })

      return Response.json({
        success: true,
        cart: updatedCart,
        merged: false,
        message: 'Guest cart converted to user cart',
      })
    }

    // Case 2: User has an existing cart - merge items
    const guestItems = (guestCart.items || []) as Array<{
      product?: number | null
      variant?: number | null
      quantity: number
      id?: string | null
    }>
    const userItems = (userCart.items || []) as Array<{
      product?: number | null
      variant?: number | null
      quantity: number
      id?: string | null
    }>

    // Create a map of existing user cart items for quick lookup
    const userItemsMap = new Map<string, number>()
    userItems.forEach((item, index) => {
      const key = getItemKey(item)
      if (key) {
        userItemsMap.set(key, index)
      }
    })

    // Merge guest items into user items
    const mergedItems = [...userItems]

    for (const guestItem of guestItems) {
      const key = getItemKey(guestItem)

      if (!key) continue
      const existingIndex = userItemsMap.get(key)

      if (existingIndex !== undefined) {
        // Item exists - increase quantity
        mergedItems[existingIndex] = {
          ...mergedItems[existingIndex],
          quantity: mergedItems[existingIndex].quantity + guestItem.quantity,
        }
      } else {
        // New item - add to cart
        mergedItems.push({
          product: guestItem.product,
          variant: guestItem.variant,
          quantity: guestItem.quantity,
        })
      }
    }

    // Update user cart with merged items
    const updatedCart = await payload.update({
      collection: 'carts',
      id: userCart.id,
      data: {
        items: mergedItems,
      },
      depth: 0,
      overrideAccess: false,
      req,
    })

    try {
      // Delete the guest cart
      await payload.delete({
        collection: 'carts',
        id: guestCartId,
        overrideAccess: true, // Needed to delete cart by secret, this is safe since we verified ownership above
        req,
      })
    } catch (_) {}

    return Response.json({
      success: true,
      cart: updatedCart,
      merged: true,
      message: 'Guest cart merged with user cart',
    })
  } catch (error) {
    console.error('Error merging guest cart:', error)
    return Response.json({ error: 'An error occurred while merging carts' }, { status: 500 })
  }
}

const getItemKey = (item: NonNullable<Cart['items']>[0]) => {
  if (!item.product) return undefined
  const productID = typeof item.product === 'object' ? item.product.id : item.product
  const variantID = item.variant
    ? typeof item.variant === 'object'
      ? item.variant.id
      : item.variant
    : undefined
  return variantID ? `${productID}-${variantID}` : `${productID}`
}
