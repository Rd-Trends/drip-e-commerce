'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import type { Currency } from '@/types/currency'
import { convertFromBaseValue, convertToBaseValue } from '@/utils/currency'
import './index.css'

interface CurrencyInputProps {
  value: number // Base value (e.g., kobo)
  onChange: (value: number) => void
  currency: Currency
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  className?: string
  id?: string
  autoFocus?: boolean
}

/**
 * Reusable currency input component that handles formatting and conversion
 * between base values (e.g., kobo) and display values (e.g., naira)
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currency,
  placeholder = '0.00',
  disabled = false,
  readOnly = false,
  id,
  autoFocus = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    convertFromBaseValue({ baseValue: value, currency }),
  )
  const isTypingRef = useRef(false)

  // Sync displayValue when value prop changes externally (not from user typing)
  useEffect(() => {
    if (!isTypingRef.current) {
      const formattedValue = convertFromBaseValue({ baseValue: value, currency })
      setDisplayValue(formattedValue)
    }
  }, [value, currency])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value

      // Only allow numbers and decimal point
      if (!/^\d*(?:\.\d*)?$/.test(inputValue) && inputValue !== '') {
        return
      }

      isTypingRef.current = true
      setDisplayValue(inputValue)

      // Convert to base value and update
      if (inputValue === '') {
        onChange(0)
      } else {
        const baseValue = convertToBaseValue({ currency, displayValue: inputValue })
        onChange(baseValue)
      }
    },
    [currency, onChange],
  )

  const handleBlur = useCallback(() => {
    isTypingRef.current = false

    if (displayValue === '') {
      setDisplayValue('0.00')
      onChange(0)
      return
    }

    // Format the value on blur
    const baseValue = convertToBaseValue({ currency, displayValue })
    const formattedValue = convertFromBaseValue({ baseValue, currency })
    setDisplayValue(formattedValue)
  }, [currency, displayValue, onChange])

  const handleFocus = useCallback(() => {
    isTypingRef.current = true
    // Remove trailing zeros when focused for easier editing
    if (displayValue === '0.00') {
      setDisplayValue('')
    }
  }, [displayValue])

  return (
    <div className="currency-input-wrapper">
      <span className="currency-input-symbol">{currency.symbol}</span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readOnly}
        id={id}
        autoFocus={autoFocus}
      />
    </div>
  )
}
