export type Currency = {
  code: string
  label: string
  symbol: string
  decimals: number
}

export type CurrenciesConfig = {
  defaultCurrency: string
  supportedCurrencies: Currency[]
}
