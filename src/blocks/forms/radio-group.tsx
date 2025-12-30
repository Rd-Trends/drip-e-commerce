import type { RadioField, SelectFieldOption } from '@payloadcms/plugin-form-builder/types'
import type { Control, FieldValues } from 'react-hook-form'

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import React from 'react'
import { Controller } from 'react-hook-form'
import { Width } from './width'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { capitaliseFirstLetter } from '@/utils/capitalise-first-letter'

export const Radio: React.FC<
  RadioField & {
    control: Control<FieldValues>
  }
> = ({ name, options, control, label, required, width }) => {
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
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value || ''}
              aria-invalid={fieldState.invalid}
            >
              {options.map((option: SelectFieldOption) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem value={option.value} id={`${name}-${option.value}`} />
                  <Label htmlFor={`${name}-${option.value}`} className="cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </Width>
  )
}
