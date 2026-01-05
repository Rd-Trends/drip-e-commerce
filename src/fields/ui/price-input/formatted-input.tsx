'use client'

import type { StaticDescription, StaticLabel } from 'payload'

import { FieldDescription, FieldLabel, useField, useFormFields } from '@payloadcms/ui'
import { useMemo } from 'react'
import { Currency } from '@/types/currency'
import { currenciesConfig } from '@/lib/constants'
import { CurrencyInput } from '@/fields/ui/currency-input'

interface Props {
  currency?: Currency
  description?: StaticDescription
  disabled?: boolean
  error?: string
  id?: string
  label?: StaticLabel
  path: string
  placeholder?: string
  readOnly?: boolean
  supportedCurrencies: Currency[]
}

const baseClass = 'formattedPrice'

export const FormattedInput: React.FC<Props> = ({
  id: idFromProps,
  currency: currencyFromProps,
  description,
  disabled = false,
  label,
  path,
  placeholder = '0.00',
  readOnly,
  supportedCurrencies,
}) => {
  const { setValue, value } = useField<number>({ path })

  const parentPath = path.split('.').slice(0, -1).join('.')
  const currencyPath = parentPath ? `${parentPath}.currency` : 'currency'

  const currencyFromSelectField = useFormFields(([fields, _]) => fields[currencyPath])

  const currencyCode = currencyFromProps?.code ?? (currencyFromSelectField?.value as string)
  const id = idFromProps || path

  const currency = useMemo<Currency>(() => {
    if (currencyCode && supportedCurrencies) {
      const foundCurrency = supportedCurrencies.find(
        (supportedCurrency) => supportedCurrency.code === currencyCode,
      )

      return foundCurrency ?? supportedCurrencies[0] ?? currenciesConfig.defaultCurrency
    }

    return supportedCurrencies[0] ?? currenciesConfig.defaultCurrency
  }, [currencyCode, supportedCurrencies])

  const handleChange = (newValue: number) => {
    setValue(newValue)
  }

  return (
    <div className={`field-type number ${baseClass}`}>
      {label && <FieldLabel as="label" htmlFor={id} label={label} />}

      <CurrencyInput
        id={id}
        value={value || 0}
        onChange={handleChange}
        currency={currency}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        className={`${baseClass}Input`}
      />

      <FieldDescription
        className={`${baseClass}Description`}
        description={description}
        path={path}
      />
    </div>
  )
}
