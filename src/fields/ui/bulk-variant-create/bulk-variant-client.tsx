'use client'

import React, { useState } from 'react'
import { Button, useAllFormFields, useDocumentEvents, useFormFields } from '@payloadcms/ui'
import { toast } from 'sonner'
import type { VariantOption } from '@/payload-types'
import { CurrencyInput } from '@/fields/ui/currency-input'
import { currenciesConfig } from '@/lib/constants'
import './index.scss'
import { useRouter } from 'next/navigation'

interface VariantTypeWithOptions {
  id: number | string
  name: string
  label?: string | null
  options: {
    docs: VariantOption[]
  }
}

interface ExistingVariant {
  id: number | string
  options: (number | string | VariantOption)[]
}

interface VariantCombination {
  options: string[]
  optionNames: string[]
  priceInNGN: number
  costPrice: number
  inventory: number
  selected: boolean
}

interface BulkVariantClientProps {
  variantTypes: VariantTypeWithOptions[]
  existingVariants: ExistingVariant[]
  productId: number | string
}

export const BulkVariantClient: React.FC<BulkVariantClientProps> = ({
  variantTypes,
  existingVariants,
  productId,
}) => {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Set<string>>>({})
  const [basePrice, setBasePrice] = useState<number>(0)
  const [baseCostPrice, setBaseCostPrice] = useState<number>(0)
  const [baseInventory, setBaseInventory] = useState<string>('0')
  const [combinations, setCombinations] = useState<VariantCombination[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  const { mostRecentUpdate } = useDocumentEvents()

  const [_, dispatchFields] = useAllFormFields()
  const enableVariant = useFormFields(([fields, _]) => fields['enableVariants'])
  const variantTypeIDs = useFormFields(([fields, _]) => fields['variantTypes'])

  console.log('fields', {
    enableVariant,
    variantTypeIDs,
  })

  console.log('mostRecentUpdate', mostRecentUpdate)

  const currency = currenciesConfig.supportedCurrencies[0]

  // Toggle option selection
  const toggleOption = (typeId: string, optionId: string) => {
    setSelectedOptions((prev) => {
      const updated = { ...prev }
      const currentSet = prev[typeId] || new Set<string>()
      const newSet = new Set(currentSet) // Create a new Set instance

      if (newSet.has(optionId)) {
        newSet.delete(optionId)
      } else {
        newSet.add(optionId)
      }

      updated[typeId] = newSet
      return updated
    })
  }

  // Select all options for a variant type
  const selectAllOptions = (typeId: string, optionIds: string[]) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [typeId]: new Set(optionIds),
    }))
  }

  // Clear all options for a variant type
  const clearAllOptions = (typeId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [typeId]: new Set(),
    }))
  }

  // Generate all combinations
  const generateCombinations = () => {
    const selectedTypeIds = Object.keys(selectedOptions).filter(
      (typeId) => selectedOptions[typeId].size > 0,
    )

    if (selectedTypeIds.length === 0) {
      setCombinations([])
      return
    }

    // Get all selected options with their names
    const optionGroups = selectedTypeIds.map((typeId) => {
      const type = variantTypes.find((vt) => String(vt.id) === typeId)
      const options = Array.from(selectedOptions[typeId]).map((optionId) => {
        const option = type?.options?.docs.find((opt) => String(opt.id) === optionId)
        return {
          id: optionId,
          name: option?.label || optionId,
        }
      })
      return options
    })

    // Generate Cartesian product
    const cartesian = (...arrays: any[]): any[] =>
      arrays.reduce((acc, array) => acc.flatMap((x: any) => array.map((y: any) => [...x, y])), [[]])

    const allCombinations = cartesian(...optionGroups)

    // Check which combinations already exist
    const existingCombinationKeys = new Set(
      existingVariants.map((variant) => {
        const optionIds =
          variant.options?.map((opt) => (typeof opt === 'object' ? opt.id : opt)) || []
        return optionIds.sort().join('|')
      }),
    )

    const newCombinations: VariantCombination[] = allCombinations.map((combo) => {
      const optionIds = combo.map((opt: any) => opt.id)
      const optionNames = combo.map((opt: any) => opt.name)
      const combinationKey = [...optionIds].sort().join('|')
      const exists = existingCombinationKeys.has(combinationKey)

      return {
        options: optionIds,
        optionNames,
        priceInNGN: basePrice,
        costPrice: baseCostPrice,
        inventory: parseInt(baseInventory) || 0,
        selected: !exists, // Auto-select only new combinations
      }
    })

    setCombinations(newCombinations)

    if (newCombinations.length > 0) {
      const existingCount = newCombinations.filter((c) => !c.selected).length
      if (existingCount > 0) {
        toast.info(
          `${newCombinations.length} combinations generated. ${existingCount} already exist and are deselected.`,
        )
      } else {
        toast.success(`${newCombinations.length} new combinations ready to create.`)
      }
    }
  }

  // Update combination values
  const updateCombination = (
    index: number,
    field: 'priceInNGN' | 'costPrice' | 'inventory',
    value: number | string,
  ) => {
    setCombinations((prev) =>
      prev.map((combo, i) =>
        i === index
          ? {
              ...combo,
              [field]: field === 'inventory' ? parseInt(value as string) || 0 : (value as number),
            }
          : combo,
      ),
    )
  }

  // Toggle combination selection
  const toggleCombination = (index: number) => {
    setCombinations((prev) =>
      prev.map((combo, i) => (i === index ? { ...combo, selected: !combo.selected } : combo)),
    )
  }

  // Toggle all combinations
  const toggleAllCombinations = () => {
    const allSelected = combinations.every((c) => c.selected)
    setCombinations((prev) => prev.map((combo) => ({ ...combo, selected: !allSelected })))
  }

  // Apply base values to all selected combinations
  const applyBaseValues = () => {
    const inventory = parseInt(baseInventory) || 0

    setCombinations((prev) =>
      prev.map((combo) =>
        combo.selected
          ? {
              ...combo,
              priceInNGN: basePrice,
              costPrice: baseCostPrice,
              inventory,
            }
          : combo,
      ),
    )

    toast.success(`Updated ${combinations.filter((c) => c.selected).length} selected combinations.`)
  }

  // Create variants
  const createVariants = async () => {
    const selectedCombinations = combinations.filter((c) => c.selected)

    if (selectedCombinations.length === 0) {
      toast.error('Please select at least one variant combination to create.')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/variants-bulk-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: productId,
          variants: selectedCombinations.map((combo) => ({
            options: combo.options,
            priceInNGN: combo.priceInNGN,
            costPrice: combo.costPrice,
            inventory: combo.inventory,
          })),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create variants')
      }

      const result = await response.json()

      toast.success(`Created ${result.created} variants successfully!`)

      // dispatchFields({
      //   type: "UPDATE"
      // })

      //   // Refresh the page to show new variants
      //   window.location.reload()
      router.refresh()
    } catch (error) {
      console.error('Error creating variants:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create variants')
    } finally {
      setIsCreating(false)
    }
  }

  if (variantTypes.length === 0) {
    return (
      <div className="bulk-variant-creator">
        <p className="bulk-variant-creator__empty">
          No variant types configured. Add variant types to the product first.
        </p>
      </div>
    )
  }

  return (
    <div className="bulk-variant-creator">
      <div className="bulk-variant-creator__card">
        <div className="bulk-variant-creator__header">
          <h3 className="bulk-variant-creator__title">Bulk Variant Creator</h3>
          <p className="bulk-variant-creator__description">
            Select multiple variant options and set common price and inventory values. This tool
            generates all combinations and creates them in bulk.
          </p>
        </div>
        <div className="bulk-variant-creator__content">
          {/* Variant Option Selection */}
          <div className="bulk-variant-creator__section">
            <h4 className="bulk-variant-creator__section-title">Select Variant Options</h4>
            {variantTypes.map((type) => (
              <div key={type.id} className="bulk-variant-creator__variant-type">
                <div className="bulk-variant-creator__variant-type-header">
                  <label className="bulk-variant-creator__label">{type.label || type.name}</label>
                  <div className="bulk-variant-creator__button-group">
                    <Button
                      buttonStyle="secondary"
                      size="small"
                      onClick={() =>
                        selectAllOptions(
                          String(type.id),
                          type.options?.docs.map((opt) => String(opt.id)).filter(Boolean) || [],
                        )
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      buttonStyle="secondary"
                      size="small"
                      onClick={() => clearAllOptions(String(type.id))}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="bulk-variant-creator__options">
                  {type.options?.docs.map((option) => (
                    <label key={option.id} className="bulk-variant-creator__checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedOptions[String(type.id)]?.has(String(option.id)) || false}
                        onChange={() => toggleOption(String(type.id), String(option.id))}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Base Values */}
          <div className="bulk-variant-creator__section">
            <div className="bulk-variant-creator__inputs">
              <div className="bulk-variant-creator__input-group">
                <label htmlFor="basePrice" className="bulk-variant-creator__label">
                  Base Price (NGN)
                </label>
                <CurrencyInput
                  id="basePrice"
                  value={basePrice}
                  onChange={setBasePrice}
                  currency={currency}
                  placeholder="0.00"
                  className="bulk-variant-creator__input"
                />
              </div>
              <div className="bulk-variant-creator__input-group">
                <label htmlFor="baseCostPrice" className="bulk-variant-creator__label">
                  Base Cost Price (NGN)
                </label>
                <CurrencyInput
                  id="baseCostPrice"
                  value={baseCostPrice}
                  onChange={setBaseCostPrice}
                  currency={currency}
                  placeholder="0.00"
                  className="bulk-variant-creator__input"
                />
              </div>
              <div className="bulk-variant-creator__input-group">
                <label htmlFor="baseInventory" className="bulk-variant-creator__label">
                  Base Inventory
                </label>
                <input
                  id="baseInventory"
                  type="number"
                  min="0"
                  step="1"
                  value={baseInventory}
                  onChange={(e) => setBaseInventory(e.target.value)}
                  placeholder="0"
                  className="bulk-variant-creator__input"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bulk-variant-creator__actions">
            <Button buttonStyle="primary" onClick={generateCombinations}>
              Generate Combinations
            </Button>
            {combinations.length > 0 && (
              <Button buttonStyle="secondary" onClick={applyBaseValues}>
                Apply Base Values to Selected
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Combinations Table */}
      {combinations.length > 0 && (
        <div className="bulk-variant-creator__card">
          <div className="bulk-variant-creator__header">
            <h3 className="bulk-variant-creator__title">
              Generated Combinations ({combinations.filter((c) => c.selected).length} selected)
            </h3>
            <p className="bulk-variant-creator__description">
              Review and adjust values before creating variants. Deselect existing combinations or
              adjust individual prices and inventory as needed.
            </p>
          </div>
          <div className="bulk-variant-creator__content">
            <div className="bulk-variant-creator__table-wrapper">
              <table className="bulk-variant-creator__table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={combinations.length > 0 && combinations.every((c) => c.selected)}
                        onChange={toggleAllCombinations}
                      />
                    </th>
                    <th>Options</th>
                    <th>Price (NGN)</th>
                    <th>Cost Price (NGN)</th>
                    <th>Inventory</th>
                  </tr>
                </thead>
                <tbody>
                  {combinations.map((combo, index) => (
                    <tr key={index}>
                      <td>
                        <input
                          type="checkbox"
                          checked={combo.selected}
                          onChange={() => toggleCombination(index)}
                        />
                      </td>
                      <td>{combo.optionNames.join(' / ')}</td>
                      <td>
                        <CurrencyInput
                          value={combo.priceInNGN}
                          onChange={(value) => updateCombination(index, 'priceInNGN', value)}
                          currency={currency}
                          placeholder="0.00"
                          className="bulk-variant-creator__table-input"
                        />
                      </td>
                      <td>
                        <CurrencyInput
                          value={combo.costPrice}
                          onChange={(value) => updateCombination(index, 'costPrice', value)}
                          currency={currency}
                          placeholder="0.00"
                          className="bulk-variant-creator__table-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={combo.inventory}
                          onChange={(e) => updateCombination(index, 'inventory', e.target.value)}
                          className="bulk-variant-creator__table-input"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bulk-variant-creator__footer">
              <Button
                buttonStyle="primary"
                onClick={createVariants}
                disabled={isCreating || combinations.filter((c) => c.selected).length === 0}
              >
                {isCreating
                  ? 'Creating...'
                  : `Create ${combinations.filter((c) => c.selected).length} Variants`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
