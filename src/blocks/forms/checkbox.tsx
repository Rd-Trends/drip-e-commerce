import type { CheckboxField } from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldValues } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import React from 'react'
import { Controller } from 'react-hook-form'
import { Width } from './width'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { capitaliseFirstLetter } from '@/utils/capitalise-first-letter'

export const CheckboxComponent: React.FC<
  CheckboxField & {
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
            <div className="flex items-center gap-2">
              <Checkbox
                id={name}
                checked={field.value || false}
                onCheckedChange={field.onChange}
                required={required}
                aria-invalid={fieldState.invalid}
              />
              {label && (
                <FieldLabel required={required} htmlFor={name} className="mb-0">
                  {label}
                </FieldLabel>
              )}
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </Width>
  )
}
