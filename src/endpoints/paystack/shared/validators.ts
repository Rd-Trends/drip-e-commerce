import { currenciesConfig } from '@/lib/constants'
import { Cart, Product } from '@/payload-types'
import { ProductsValidation } from '@payloadcms/plugin-ecommerce/types'
import { DefaultDocumentIDType, PayloadRequest } from 'payload'

/**
 * Validates cart existence and retrieves cart data
 */
export async function validateAndGetCart(
  req: PayloadRequest,
  cartID?: DefaultDocumentIDType,
): Promise<Cart> {
  if (!cartID) {
    throw new Error('Cart ID is required.')
  }

  const cart = await req.payload.findByID({
    id: cartID,
    collection: 'carts',
    depth: 2,
    overrideAccess: false,
    user: req.user,
    req,
  })

  if (!cart) {
    throw new Error(`Cart with ID ${cartID} not found.`)
  }

  return cart
}

/**
 * Validates currency is supported
 */
export function validateCurrency(currency?: string): string {
  if (!currency) {
    throw new Error('Currency is required.')
  }

  const isSupported = currenciesConfig.supportedCurrencies.find(
    (c) => c.code.toLocaleLowerCase() === currency.toLocaleLowerCase(),
  )

  if (!isSupported) {
    throw new Error(`Currency ${currency} is not supported.`)
  }

  return currency
}

/**
 * Validates cart has items
 */
export function validateCartItems(cart: Cart): void {
  if (!cart || !cart.items || !Array.isArray(cart.items) || cart.items.length === 0) {
    throw new Error('Cart is required and must contain at least one item.')
  }
}

/**
 * Validates product or variant pricing and inventory
 */
export const validateProductOrVariant: ProductsValidation = ({
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

/**
 * Validates all items in cart for pricing and inventory
 */
export async function validateCartItemsInventory(
  req: PayloadRequest,
  cart: Cart,
  currency: string,
): Promise<void> {
  if (!cart.items) {
    throw new Error('Cart items are required.')
  }

  for (const item of cart.items) {
    const priceField = `priceIn${currency.toUpperCase()}`
    const quantity = item.quantity || 1

    // Validate product without variant
    if (item.product && !item.variant) {
      const id = typeof item.product === 'object' ? item.product.id : item.product

      const product = await req.payload.findByID({
        id,
        collection: 'products',
        depth: 0,
        select: {
          inventory: true,
          [priceField]: true,
        },
      })

      if (!product) {
        throw new Error(`Product with ID ${item.product} not found.`)
      }

      await validateProductOrVariant({
        currenciesConfig,
        currency,
        product,
        quantity,
      })
    }

    // Validate variant
    if (item.variant) {
      const id = typeof item.variant === 'object' ? item.variant.id : item.variant

      const variant = await req.payload.findByID({
        id,
        collection: 'variants',
        depth: 0,
        select: {
          inventory: true,
          [priceField]: true,
        },
      })

      if (!variant) {
        throw new Error(`Variant with ID ${item.variant} not found.`)
      }

      await validateProductOrVariant({
        currenciesConfig,
        currency,
        product: item.product as Product,
        quantity,
        variant,
      })
    }
  }
}
