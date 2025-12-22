'use client'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Address, Config } from '@/payload-types'
import { useCreateAddress, useUpdateAddress } from '@/hooks/use-address'
import { deepMergeSimple } from 'payload/shared'
import React, { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { supportedCountries } from '@/lib/constants'

const titles = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Mx.', 'Other']

type AddressFormValues = {
  title?: string | null
  firstName?: string | null
  lastName?: string | null
  company?: string | null
  addressLine1?: string | null
  addressLine2?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
}

type Props = {
  addressID?: Config['db']['defaultIDType']
  initialData?: Omit<Address, 'country' | 'id' | 'updatedAt' | 'createdAt'> & { country?: string }
  callback?: (data: Partial<Address>) => void
  /**
   * If true, the form will not submit to the API.
   */
  skipSubmission?: boolean
}

export const AddressForm: React.FC<Props> = ({
  addressID,
  initialData,
  callback,
  skipSubmission,
}) => {
  const form = useForm<AddressFormValues>({
    defaultValues: initialData,
    mode: 'all',
  })

  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()

  const isPending = createAddress.isPending || updateAddress.isPending

  const onSubmit = useCallback(
    async (data: AddressFormValues) => {
      const newData = deepMergeSimple(initialData || {}, data)

      if (!skipSubmission) {
        console.log('Submitting address data:', newData)
        if (addressID) {
          updateAddress.mutate(
            { addressID, data: newData },
            {
              onSuccess: () => {
                if (callback) callback(newData)
              },
            },
          )
        } else {
          console.log('Creating new address with data:', newData)
          createAddress.mutate(newData, {
            onSuccess: () => {
              if (callback) callback(newData)
            },
          })
        }
      } else {
        if (callback) callback(newData)
      }
    },
    [initialData, skipSubmission, callback, addressID, updateAddress.mutate, createAddress.mutate],
  )

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-10">
      <div className="flex flex-col gap-10">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Personal Information
          </h3>
          <FieldGroup>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="title">Title</FieldLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="title"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {titles.map((title) => (
                          <SelectItem key={title} value={title}>
                            {title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="firstName"
                control={form.control}
                rules={{ required: 'First name is required.' }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="firstName">First name*</FieldLabel>
                    <Input
                      {...field}
                      id="firstName"
                      autoComplete="given-name"
                      placeholder="John"
                      aria-invalid={fieldState.invalid}
                      value={field.value || ''}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="lastName"
                control={form.control}
                rules={{ required: 'Last name is required.' }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lastName">Last name*</FieldLabel>
                    <Input
                      {...field}
                      autoComplete="family-name"
                      id="lastName"
                      placeholder="Doe"
                      aria-invalid={fieldState.invalid}
                      value={field.value || ''}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                      {...field}
                      type="tel"
                      id="phone"
                      autoComplete="mobile tel"
                      placeholder="+1 (555) 000-0000"
                      aria-invalid={fieldState.invalid}
                      value={field.value || ''}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="company"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="company">Company</FieldLabel>
                    <Input
                      {...field}
                      id="company"
                      autoComplete="organization"
                      placeholder="Company name (optional)"
                      aria-invalid={fieldState.invalid}
                      value={field.value || ''}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Address Details
          </h3>
          <FieldGroup>
            <Controller
              name="addressLine1"
              control={form.control}
              rules={{ required: 'Address line 1 is required.' }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="addressLine1">Address line 1*</FieldLabel>
                  <Input
                    {...field}
                    id="addressLine1"
                    autoComplete="address-line1"
                    placeholder="Street address"
                    aria-invalid={fieldState.invalid}
                    value={field.value || ''}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="addressLine2"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="addressLine2">Address line 2</FieldLabel>
                  <Input
                    {...field}
                    id="addressLine2"
                    autoComplete="address-line2"
                    placeholder="Apartment, suite, etc. (optional)"
                    aria-invalid={fieldState.invalid}
                    value={field.value || ''}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="city"
                control={form.control}
                rules={{ required: 'City is required.' }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="city">City*</FieldLabel>
                    <Input
                      {...field}
                      id="city"
                      autoComplete="address-level2"
                      placeholder="City"
                      aria-invalid={fieldState.invalid}
                      value={field.value || ''}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="state"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="state">State / Province</FieldLabel>
                    <Input
                      {...field}
                      id="state"
                      autoComplete="address-level1"
                      placeholder="State or province"
                      aria-invalid={fieldState.invalid}
                      value={field.value || ''}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Controller
                name="postalCode"
                control={form.control}
                rules={{ required: 'Postal code is required.' }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="postalCode">Postal / Zip Code*</FieldLabel>
                    <Input
                      {...field}
                      id="postalCode"
                      placeholder="12345"
                      aria-invalid={fieldState.invalid}
                      value={field.value || ''}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                name="country"
                control={form.control}
                rules={{ required: 'Country is required.' }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="country">Country*</FieldLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger
                        id="country"
                        className="w-full"
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportedCountries.map((country) => {
                          const value = typeof country === 'string' ? country : country.value
                          const label =
                            typeof country === 'string'
                              ? country
                              : typeof country.label === 'string'
                                ? country.label
                                : value

                          return (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="submit" size="lg" className="min-w-30" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Address'}
        </Button>
      </div>
    </form>
  )
}
