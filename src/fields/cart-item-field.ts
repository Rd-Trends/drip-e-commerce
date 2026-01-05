import { CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'
import type { ArrayField, Field } from 'payload'
import { amountField } from './ammount-field'
import { currencyField } from './currency-field'

type Props = {
  /**
   * Include this in order to enable support for currencies per item in the cart.
   */
  currenciesConfig?: CurrenciesConfig
  enableVariants?: boolean
  /**
   * Enables individual prices for each item in the cart.
   * Defaults to false.
   */
  individualPrices?: boolean
  overrides?: Partial<ArrayField>
}

export const cartItemsField: (props?: Props) => ArrayField = (props) => {
  const { currenciesConfig, enableVariants = false, individualPrices, overrides } = props || {}

  const field: ArrayField = {
    name: 'items',
    type: 'array',
    admin: {
      initCollapsed: true,
    },
    fields: [
      {
        name: 'product',
        type: 'relationship',
        label: 'Product',
        relationTo: 'products',
      },
      ...(enableVariants
        ? [
            {
              name: 'variant',
              type: 'relationship',
              label: 'Variant',
              relationTo: 'variants',
            } as Field,
          ]
        : []),
      {
        name: 'quantity',
        type: 'number',
        defaultValue: 1,
        label: 'Quantity',
        min: 1,
        required: true,
      },
      ...(currenciesConfig && individualPrices ? [amountField({ currenciesConfig })] : []),
      ...(currenciesConfig ? [currencyField({ currenciesConfig })] : []),
    ],
    label: 'Items',
    ...overrides,
  }

  return field
}
