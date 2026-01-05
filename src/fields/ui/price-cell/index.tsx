'use client'

import type { DefaultCellComponentProps, TypedCollection } from 'payload'
import { CurrenciesConfig, Currency } from '@/types/currency'
import { convertFromBaseValue } from '@/utils/currency'

type Props = {
  cellData?: number
  currenciesConfig: CurrenciesConfig
  currency?: Currency
  path: string
  rowData: Partial<TypedCollection['products']>
} & DefaultCellComponentProps

export const PriceCell: React.FC<Props> = (args) => {
  const { cellData, currenciesConfig, currency: currencyFromProps, rowData } = args

  const currency = currencyFromProps || currenciesConfig.supportedCurrencies[0]

  if (!currency) {
    return <span>Currency not set.</span>
  }

  if (
    (!cellData || typeof cellData !== 'number') &&
    'enableVariants' in rowData &&
    rowData.enableVariants
  ) {
    return <span>Price set in variants.</span>
  }

  if (!cellData) {
    return <span>Price not set.</span>
  }

  return (
    <span>
      {currency.symbol}
      {convertFromBaseValue({ baseValue: cellData, currency })}
    </span>
  )
}
