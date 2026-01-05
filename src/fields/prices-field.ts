import { CurrenciesConfig } from '@/types/currency'
import type { GroupField } from 'payload'
import { amountField } from './ammount-field'

type Props = {
  /**
   * Use this to specify a path for the condition.
   */
  conditionalPath?: string
  currenciesConfig: CurrenciesConfig
}

export const pricesField: (props: Props) => GroupField[] = ({
  conditionalPath,
  currenciesConfig,
}) => {
  const currencies = currenciesConfig.supportedCurrencies

  const fields: GroupField[] = currencies.map((currency) => {
    const name = `priceIn${currency.code}`

    const path = conditionalPath ? `${conditionalPath}.${name}Enabled` : `${name}Enabled`

    return {
      type: 'group',
      admin: {
        description: 'Prices for this product in different currencies.',
      },
      fields: [
        {
          name: `${name}Enabled`,
          type: 'checkbox',
          admin: {
            style: {
              alignSelf: 'baseline',
              flex: '0 0 auto',
            },
          },
          label: `Enable ${currency.code} price`,
        },
        amountField({
          currenciesConfig,
          currency,
          overrides: {
            name,
            admin: {
              condition: (_, siblingData) => Boolean(siblingData?.[path]),
              description:
                'This price will also be used for sorting and filtering products. If you have variants enabled then you can enter the lowest or average price to help with search and filtering, but this price will not be used for checkout.',
            },
            label: `Price (${currency.code})`,
          },
        }),
      ],
    }
  })

  return fields
}
