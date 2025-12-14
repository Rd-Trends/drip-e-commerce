import { currenciesConfig } from '@/lib/constants'
import { DefaultDocumentIDType, Endpoint } from 'payload'
import { initiatePayment } from '../initiate-payment'
import { ProductsValidation } from '@payloadcms/plugin-ecommerce/types'
import { Product } from '@/payload-types'

export const initiatePaystackPaymentHandler: Endpoint['handler'] = async (req) => {
  const data = await req.json?.()
  const payload = req.payload
  const user = req.user

  let currency: string = currenciesConfig.defaultCurrency
  let cartID: DefaultDocumentIDType = data?.cartID
  let cart = undefined
  const billingAddress = data?.billingAddress
  const shippingAddress = data?.shippingAddress

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

  // Ensure the selected currency is supported
  if (
    !currenciesConfig.supportedCurrencies.find(
      (c) => c.code.toLocaleLowerCase() === currency.toLocaleLowerCase(),
    )
  ) {
    return Response.json(
      {
        message: `Currency ${currency} is not supported.`,
      },
      {
        status: 400,
      },
    )
  }

  // Verify the cart is available and items are present in an array
  if (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
    return Response.json(
      {
        message: 'Cart is required and must contain at least one item.',
      },
      {
        status: 400,
      },
    )
  }

  for (const item of cart.items) {
    // Target field to check the price based on the currency so we can validate the total
    const priceField = `priceIn${currency.toUpperCase()}`
    const quantity = item.quantity || 1

    // If the item has a product but no variant, we assume the product has a price in the specified currency
    if (item.product && !item.variant) {
      const id = typeof item.product === 'object' ? item.product.id : item.product

      const product = await payload.findByID({
        id,
        collection: 'products',
        depth: 0,
        select: {
          inventory: true,
          [priceField]: true,
        },
      })

      if (!product) {
        return Response.json(
          {
            message: `Product with ID ${item.product} not found.`,
          },
          {
            status: 404,
          },
        )
      }

      try {
        await defaultProductsValidation({
          currenciesConfig,
          currency,
          product,
          quantity,
        })
      } catch (error) {
        payload.logger.error(
          error,
          'Error validating product or variant during payment initiation.',
        )

        return Response.json(
          {
            message: error,
            ...(error instanceof Error ? { cause: error.cause } : {}),
          },
          {
            status: 400,
          },
        )
      }
    }
    if (item.variant) {
      const id = typeof item.variant === 'object' ? item.variant.id : item.variant

      const variant = await payload.findByID({
        id,
        collection: 'variants',
        depth: 0,
        select: {
          inventory: true,
          [priceField]: true,
        },
      })

      if (!variant) {
        return Response.json(
          {
            message: `Variant with ID ${item.variant} not found.`,
          },
          {
            status: 404,
          },
        )
      }

      try {
        await defaultProductsValidation({
          currenciesConfig,
          currency,
          product: item.product as Product,
          quantity,
          variant,
        })
      } catch (error) {
        payload.logger.error(
          error,
          'Error validating product or variant during payment initiation.',
        )

        return Response.json(
          {
            message: error,
          },
          {
            status: 400,
          },
        )
      }
    }
  }

  try {
    const paymentResponse = await initiatePayment({
      customersSlug: 'users',
      data: {
        billingAddress,
        //   @ts-ignore type from plugin not syncing correctly
        cart,
        currency,
        customerEmail,
        shippingAddress,
      },
      req,
      transactionsSlug: 'transactions',
    })

    return Response.json(paymentResponse)
  } catch (error) {
    payload.logger.error(error, 'Error initiating payment.')

    return Response.json(
      {
        message: 'Error initiating payment.',
      },
      {
        status: 500,
      },
    )
  }
}

const defaultProductsValidation: ProductsValidation = ({
  currency,
  product,
  quantity = 1,
  variant,
}) => {
  if (!currency) {
    throw new Error('Currency must be provided for product validation.')
  }

  const priceField = `priceIn${currency.toUpperCase()}` as keyof typeof variant
  if (variant) {
    if (!variant[priceField]) {
      throw new Error(`Variant with ID ${variant.id} does not have a price in ${currency}.`)
    }

    if (variant.inventory === 0 || (variant.inventory && variant.inventory < quantity)) {
      throw new Error(
        `Variant with ID ${variant.id} is out of stock or does not have enough inventory.`,
      )
    }
  } else if (product) {
    // Validate the product's details only if the variant is not provided as it can have its own inventory and price
    if (!product[priceField]) {
      throw new Error(`Product does not have a price in.`, {
        cause: { code: 'MissingPrice', codes: [product.id, currency] },
      })
    }

    if (product.inventory === 0 || (product.inventory && product.inventory < quantity)) {
      throw new Error(`Product is out of stock or does not have enough inventory.`, {
        cause: { code: 'OutOfStock', codes: [product.id] },
      })
    }
  }
}
