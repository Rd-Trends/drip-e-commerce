import type { CountryField } from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldValues } from 'react-hook-form'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import React from 'react'
import { Controller } from 'react-hook-form'

import { countryOptions } from './options'
import { Width } from '../width'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { capitaliseFirstLetter } from '@/utils/capitalise-first-letter'

export const Country: React.FC<
  CountryField & {
    control: Control<FieldValues, unknown>
  }
> = ({ name, control, label, required, width }) => {
  return (
    <Width width={width}>
      <Controller
        name={name}
        control={control}
        rules={{
          ...(required ? { required: `${capitaliseFirstLetter(label || name)} is required.` } : {}),
        }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            {label && (
              <FieldLabel required={required} htmlFor={name}>
                {label}
              </FieldLabel>
            )}
            <Combobox
              items={countryOptions}
              onValueChange={field.onChange}
              value={field.value || ''}
            >
              <ComboboxInput
                id={name}
                placeholder="Select Country"
                required={required}
                className="w-full"
                aria-invalid={fieldState.invalid}
              />
              <ComboboxContent>
                <ComboboxEmpty>No countries found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: (typeof countryOptions)[number]) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </Width>
  )
}
