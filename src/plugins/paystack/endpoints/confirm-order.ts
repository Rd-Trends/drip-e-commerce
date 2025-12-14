import { currenciesConfig } from '@/lib/constants'
import { DefaultDocumentIDType, Endpoint } from 'payload'
import { confirmOrder } from '../confirm-order'

export const confirmPaystackOrderHandler: Endpoint['handler'] = async (req) => {
  const data = await req.json?.()
  const payload = req.payload
  const user = req.user

  let currency: string = currenciesConfig.defaultCurrency
  let cartID: DefaultDocumentIDType = data?.cartID
  let cart = undefined
  let customerEmail: string = user?.email ?? ''

  if (user) {
    if (user.cart?.docs && Array.isArray(user.cart.docs) && user.cart.docs.length > 0) {
      if (!cartID && user.cart.docs[0]) {
        // Use the user's cart instead
        if (typeof user.cart.docs[0] === 'object') {
          cartID = user.cart.docs[0].id
          cart = user.cart.docs[0]
        } else {
          cartID = user.cart.docs[0]
        }
      }
    }
  } else {
    // Get the email from the data if user is not available
    if (data?.customerEmail && typeof data.customerEmail === 'string') {
      customerEmail = data.customerEmail
    } else {
      return Response.json(
        {
          message: 'A customer email is required to make a purchase.',
        },
        {
          status: 400,
        },
      )
    }
  }

  if (!cart) {
    if (cartID) {
      cart = await payload.findByID({
        id: cartID,
        collection: 'carts',
        depth: 2,
        overrideAccess: false,
        user,
        req,
      })

      if (!cart) {
        return Response.json(
          {
            message: `Cart with ID ${cartID} not found.`,
          },
          {
            status: 404,
          },
        )
      }
    } else {
      return Response.json(
        {
          message: 'Cart ID is required.',
        },
        {
          status: 400,
        },
      )
    }
  }

  if (cart.currency && typeof cart.currency === 'string') {
    currency = cart.currency
  }

  // Ensure the currency is provided or inferred in some way
  if (!currency) {
    return Response.json(
      {
        message: 'Currency is required.',
      },
      {
        status: 400,
      },
    )
  }

  try {
    const paymentResponse = await confirmOrder({
      customersSlug: 'users',
      data: {
        ...data,
        customerEmail,
      },
      ordersSlug: 'orders',
      req,
      transactionsSlug: 'transactions',
    })

    if (paymentResponse.transactionID) {
      const transaction = await payload.findByID({
        id: paymentResponse.transactionID,
        collection: 'transactions',
        depth: 0,
        select: {
          id: true,
          items: true,
        },
      })

      if (transaction && Array.isArray(transaction.items) && transaction.items.length > 0) {
        for (const item of transaction.items) {
          if (item.variant) {
            const id = typeof item.variant === 'object' ? item.variant.id : item.variant

            await payload.db.updateOne({
              id,
              collection: 'variants',
              data: {
                inventory: {
                  $inc: item.quantity * -1,
                },
              },
            })
          } else if (item.product) {
            const id = typeof item.product === 'object' ? item.product.id : item.product

            await payload.db.updateOne({
              id,
              collection: 'products',
              data: {
                inventory: {
                  $inc: item.quantity * -1,
                },
              },
            })
          }
        }
      }
    }

    if ('paymentResponse.transactionID' in paymentResponse && paymentResponse.transactionID) {
      delete (paymentResponse as Partial<typeof paymentResponse>).transactionID
    }

    return Response.json(paymentResponse)
  } catch (error) {
    payload.logger.error(error, 'Error confirming order.')

    return Response.json(
      {
        message: 'Error confirming order.',
      },
      {
        status: 500,
      },
    )
  }
}
