import type { NumberField } from 'payload'

type Props = {
  overrides?: Partial<NumberField>
}

export const inventoryField: (props?: Props) => NumberField = (props) => {
  const { overrides } = props || {}

  // @ts-expect-error - issue with payload types
  const field: NumberField = {
    name: 'inventory',
    type: 'number',
    defaultValue: 0,
    label: 'Inventory',
    min: 0,
    ...(overrides || {}),
  }

  return field
}
