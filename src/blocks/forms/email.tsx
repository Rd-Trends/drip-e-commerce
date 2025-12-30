import type { EmailField } from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldValues } from 'react-hook-form'

import { Input } from '@/components/ui/input'
import React from 'react'
import { Controller } from 'react-hook-form'
import { z } from 'zod'
import { Width } from './width'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'

const emailSchema = z.email('Please enter a valid email address.')

export const Email: React.FC<
  EmailField & {
    control: Control<FieldValues>
  }
> = ({ name, control, label, required, width }) => {
  return (
    <Width width={width}>
      <Controller
        name={name}
        control={control}
        rules={{
          ...(required ? { required: `${label || 'This field'} is required.` } : {}),
          validate: (value) => {
            if (!value && !required) return true
            const result = emailSchema.safeParse(value)
            return result.success || result.error.message
          },
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
              type="email"
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
