import { currenciesConfig } from '@/lib/constants'
import { Currency } from '@payloadcms/plugin-ecommerce/types'
import { createContext, useCallback, useContext, useState } from 'react'

export type CurrencyContextType = {
  currency: Currency
  setCurrency: (code: string) => void
  formatCurrency: (value?: null | number, options?: { currency?: Currency }) => string
  supportedCurrencies: Currency[]
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: currenciesConfig.supportedCurrencies.find(
    (c) => c.code === currenciesConfig.defaultCurrency,
  )!,
  setCurrency: () => {},
  formatCurrency: () => '',
  supportedCurrencies: currenciesConfig.supportedCurrencies,
})

const CurrencyProvider = ({ children }: { children: React.ReactNode }) => {
  const [currency, setCurrency] = useState<Currency>(
    currenciesConfig.supportedCurrencies.find((c) => c.code === currenciesConfig.defaultCurrency)!,
  )

  const formatCurrency = useCallback(
    (value?: null | number, options?: { currency?: Currency }): string => {
      if (value === undefined || value === null) {
        return ''
      }

      const currencyToUse = options?.currency || currency

      if (!currencyToUse) {
        return value.toString()
      }

      if (value === 0) {
        return `${currencyToUse.symbol}0.${'0'.repeat(currencyToUse.decimals)}`
      }

      // Convert from base value (e.g., cents) to decimal value (e.g., dollars)
      const decimalValue = value / Math.pow(10, currencyToUse.decimals)

      // Format with the correct number of decimal places
      return `${currencyToUse.symbol}${decimalValue.toFixed(currencyToUse.decimals)}`
    },
    [currency],
  )

  const handleSetCurrency = useCallback(
    (input: string) => {
      if (currency.code === input) {
        return
      }

      const foundCurrency = currenciesConfig.supportedCurrencies.find((c) => c.code === input)
      if (!foundCurrency) {
        throw new Error(`Currency with code "${input}" not found in config`)
      }

      setCurrency(foundCurrency)
    },
    [currency.code],
  )

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        formatCurrency,
        supportedCurrencies: currenciesConfig.supportedCurrencies,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }

  return context
}

export { CurrencyProvider, useCurrency }
