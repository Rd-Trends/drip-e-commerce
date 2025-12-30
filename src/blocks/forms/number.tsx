import type { TextField } from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldValues } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import React from 'react'
import { Controller } from 'react-hook-form'
import { Width } from './width'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { capitaliseFirstLetter } from '@/utils/capitalise-first-letter'

export const Number: React.FC<
  TextField & {
    control: Control<FieldValues>
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
            <Input
              id={name}
              type="number"
              required={required}
              aria-invalid={fieldState.invalid}
              {...field}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </Width>
  )
}
