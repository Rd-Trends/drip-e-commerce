import { CountryType, CurrenciesConfig } from '@payloadcms/plugin-ecommerce/types'

export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Alphabetic A-Z',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Latest arrivals' },
  { slug: 'price-in-NGN-asc', reverse: false, title: 'Price: Low to high' }, // asc
  { slug: 'price-in-NGN-desc', reverse: true, title: 'Price: High to low' },
]

export const currenciesConfig: CurrenciesConfig = {
  defaultCurrency: 'NGN',
  supportedCurrencies: [
    {
      code: 'NGN',
      symbol: '₦',
      label: 'Naira',
      decimals: 2,
    },
  ],
}

export const supportedCountries: CountryType[] = [
  {
    label: 'Nigeria',
    value: 'NG',
  },
]
