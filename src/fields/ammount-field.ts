import { CurrenciesConfig, Currency } from '@/types/currency'
import type { NumberField } from 'payload'

type Props = {
  currenciesConfig: CurrenciesConfig
  /**
   * Use this specific currency for the field.
   */
  currency?: Currency
  overrides?: Partial<NumberField>
}

export const amountField: (props: Props) => NumberField = ({
  currenciesConfig,
  currency,
  overrides,
}) => {
  // @ts-expect-error - issue with payload types
  const field: NumberField = {
    name: 'amount',
    type: 'number',
    label: 'Amount',
    ...overrides,
    admin: {
      components: {
        Cell: {
          clientProps: {
            currenciesConfig,
            currency,
          },
          path: '/src/fields/ui/price-cell#PriceCell',
        },
        Field: {
          clientProps: {
            currenciesConfig,
            currency,
          },
          path: '/src/fields/ui/price-input#PriceInput',
        },
        ...overrides?.admin?.components,
      },
      ...overrides?.admin,
    },
  }

  return field
}
