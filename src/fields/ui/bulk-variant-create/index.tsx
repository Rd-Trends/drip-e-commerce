'use client'

import React, { Fragment, useMemo, useState } from 'react'
import {
  useFormFields,
  ShimmerEffect,
  useDocumentInfo,
  Button,
  Pagination,
  toast,
} from '@payloadcms/ui'
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type { JoinFieldClientComponent } from 'payload'
import type { VariantOption, VariantType } from '@/payload-types'
import * as qs from 'qs-esm'
import { CurrencyInput } from '@/fields/ui/currency-input'
import { currenciesConfig } from '@/lib/constants'
import './index.scss'

// ===== Type Definitions =====

interface VariantTypeWithOptions {
  id: number | string
  name: string
  label?: string | null
  options: VariantOption[]
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

interface PayloadListResponse<T> {
  docs?: T[]
}

interface ExistingVariantDoc {
  id: number | string
  options?: (number | string | VariantOption)[] | null
}

interface BulkCreateVariantsResponse {
  success: boolean
  created: number
  skipped: number
  message?: string
}

interface CreateVariantsInput {
  productId: number | string
  variants: VariantCombination[]
}

interface VariantOptionSelectorProps {
  type: VariantTypeWithOptions
  selectedOptions: Set<string>
  onToggleOption: (optionId: string) => void
  onSelectAll: (optionIds: string[]) => void
  onClearAll: () => void
}

interface BaseValueInputsProps {
  basePrice: number
  baseCostPrice: number
  baseInventory: string
  onPriceChange: (value: number) => void
  onCostPriceChange: (value: number) => void
  onInventoryChange: (value: string) => void
}

interface CombinationsTableProps {
  combinations: VariantCombination[]
  currentPage: number
  pageSize: number
  onToggleCombination: (index: number) => void
  onToggleAll: () => void
  onUpdateCombination: (
    index: number,
    field: 'priceInNGN' | 'costPrice' | 'inventory',
    value: number | string,
  ) => void
  onPageChange: (page: number) => void
}

const QUERY_CONFIG = {
  depth: 1,
  joins: {
    options: {
      sort: 'value',
      // limit: 100,
    },
  },
} as const

const bulkVariantQueryKeys = {
  all: ['bulkVariantCreator'] as const,
  variantTypes: (variantTypeIDsKey: string) =>
    [...bulkVariantQueryKeys.all, 'variantTypes', variantTypeIDsKey] as const,
  existingVariants: (productId: number | string) =>
    [...bulkVariantQueryKeys.all, 'existingVariants', productId] as const,
}

// ===== Utility Functions =====

const normalizeVariantTypes = (types: VariantType[]): VariantTypeWithOptions[] => {
  return types.map((type) => ({
    id: type.id,
    name: type.name,
    label: type.label,
    options:
      type.options?.docs?.filter((opt): opt is VariantOption => typeof opt === 'object') || [],
  }))
}

const generateCartesianProduct = <T,>(arrays: T[][]): T[][] => {
  return arrays.reduce<T[][]>((acc, array) => acc.flatMap((x) => array.map((y) => [...x, y])), [[]])
}

const fetchJSON = async <T,>(url: string, errorMessage: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { message?: string } | null
    throw new Error(error?.message || errorMessage)
  }

  return response.json() as Promise<T>
}

const fetchVariantTypes = async (
  selectedVariantTypeIDs: number[],
): Promise<VariantTypeWithOptions[]> => {
  const variantTypesQuery = qs.stringify({
    where: {
      id: {
        in: selectedVariantTypeIDs,
      },
    },
    ...QUERY_CONFIG,
  })

  const data = await fetchJSON<PayloadListResponse<VariantType>>(
    `/api/variantTypes?${variantTypesQuery}`,
    'Failed to fetch variant types',
  )

  return normalizeVariantTypes(data.docs || [])
}

const fetchExistingVariants = async (productId: number | string): Promise<ExistingVariant[]> => {
  const variantsQuery = qs.stringify({
    where: {
      product: {
        equals: productId,
      },
    },
    depth: 1,
    limit: 1000,
  })

  const data = await fetchJSON<PayloadListResponse<ExistingVariantDoc>>(
    `/api/variants?${variantsQuery}`,
    'Failed to fetch variants',
  )

  return (data.docs || []).map((variant) => ({
    id: variant.id,
    options: variant.options || [],
  }))
}

const createVariantsRequest = async ({
  productId,
  variants,
}: CreateVariantsInput): Promise<BulkCreateVariantsResponse> => {
  return fetchJSON<BulkCreateVariantsResponse>(
    '/api/variants-bulk-create',
    'Failed to create variants',
    {
      method: 'POST',
      body: JSON.stringify({
        productId: String(productId),
        variants: variants.map((combo) => ({
          options: combo.options,
          priceInNGN: combo.priceInNGN,
          costPrice: combo.costPrice,
          inventory: combo.inventory,
        })),
      }),
    },
  )
}

// ===== Sub Components =====

const VariantOptionSelector: React.FC<VariantOptionSelectorProps> = ({
  type,
  selectedOptions,
  onToggleOption,
  onSelectAll,
  onClearAll,
}) => {
  const allOptionIds = type.options.map((opt) => String(opt.id))

  return (
    <div className="bulk-variant-creator__variant-type">
      <div className="bulk-variant-creator__variant-type-header">
        <label className="bulk-variant-creator__label">{type.label || type.name}</label>
        <div className="bulk-variant-creator__button-group">
          <Button
            margin={false}
            buttonStyle="secondary"
            size="small"
            onClick={() => onSelectAll(allOptionIds)}
          >
            Select All
          </Button>
          <Button margin={false} buttonStyle="secondary" size="small" onClick={onClearAll}>
            Clear
          </Button>
        </div>
      </div>
      <div className="bulk-variant-creator__options">
        {type.options.map((option) => (
          <label key={option.id} className="bulk-variant-creator__checkbox-label">
            <input
              type="checkbox"
              checked={selectedOptions.has(String(option.id))}
              onChange={() => onToggleOption(String(option.id))}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

const BaseValueInputs: React.FC<BaseValueInputsProps> = ({
  basePrice,
  baseCostPrice,
  baseInventory,
  onPriceChange,
  onCostPriceChange,
  onInventoryChange,
}) => {
  const currency = currenciesConfig.supportedCurrencies[0]

  return (
    <div className="bulk-variant-creator__section">
      <div className="bulk-variant-creator__inputs">
        <div className="bulk-variant-creator__input-group">
          <label htmlFor="basePrice" className="bulk-variant-creator__label">
            Base Price (NGN)
          </label>
          <CurrencyInput
            id="basePrice"
            value={basePrice}
            onChange={onPriceChange}
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
            onChange={onCostPriceChange}
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
            onChange={(e) => onInventoryChange(e.target.value)}
            placeholder="0"
            className="bulk-variant-creator__input"
          />
        </div>
      </div>
    </div>
  )
}

const CombinationsTable: React.FC<CombinationsTableProps> = ({
  combinations,
  currentPage,
  pageSize,
  onToggleCombination,
  onToggleAll,
  onUpdateCombination,
  onPageChange,
}) => {
  const currency = currenciesConfig.supportedCurrencies[0]
  const totalPages = Math.ceil(combinations.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedCombinations = combinations.slice(startIndex, endIndex)
  const allSelected = combinations.length > 0 && combinations.every((c) => c.selected)

  return (
    <Fragment>
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
                  <input type="checkbox" checked={allSelected} onChange={onToggleAll} />
                </th>
                <th>Options</th>
                <th>Price (NGN)</th>
                <th>Cost Price (NGN)</th>
                <th>Inventory</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCombinations.map((combo, index) => {
                const actualIndex = startIndex + index
                return (
                  <tr key={actualIndex}>
                    <td>
                      <input
                        type="checkbox"
                        checked={combo.selected}
                        onChange={() => onToggleCombination(actualIndex)}
                      />
                    </td>
                    <td>{combo.optionNames.join(' / ')}</td>
                    <td>
                      <CurrencyInput
                        value={combo.priceInNGN}
                        onChange={(value) => onUpdateCombination(actualIndex, 'priceInNGN', value)}
                        currency={currency}
                        placeholder="0.00"
                        className="bulk-variant-creator__table-input"
                      />
                    </td>
                    <td>
                      <CurrencyInput
                        value={combo.costPrice}
                        onChange={(value) => onUpdateCombination(actualIndex, 'costPrice', value)}
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
                        onChange={(e) =>
                          onUpdateCombination(actualIndex, 'inventory', e.target.value)
                        }
                        className="bulk-variant-creator__table-input"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <Pagination
            hasNextPage={currentPage < totalPages}
            hasPrevPage={currentPage > 1}
            page={currentPage}
            totalPages={totalPages}
            onChange={onPageChange}
            limit={pageSize}
          />
        )}
      </div>
    </Fragment>
  )
}

// ===== Main Components =====

const BulkVariantClient: React.FC<{
  variantTypes: VariantTypeWithOptions[]
  existingVariants: ExistingVariant[]
  productId: number | string
  isRefreshingVariants: boolean
}> = ({ variantTypes, existingVariants, productId, isRefreshingVariants }) => {
  const queryClient = useQueryClient()

  // State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, Set<string>>>({})
  const [basePrice, setBasePrice] = useState<number>(0)
  const [baseCostPrice, setBaseCostPrice] = useState<number>(0)
  const [baseInventory, setBaseInventory] = useState<string>('0')
  const [combinations, setCombinations] = useState<VariantCombination[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const selectedCombinationCount = combinations.filter((c) => c.selected).length

  const createVariantsMutation = useMutation({
    mutationFn: createVariantsRequest,
    onSuccess: async (result, variables) => {
      setCombinations([])

      await queryClient.invalidateQueries({
        queryKey: bulkVariantQueryKeys.existingVariants(variables.productId),
      })

      const skippedMessage =
        result.skipped > 0
          ? ` ${result.skipped} duplicate ${result.skipped === 1 ? 'variant was' : 'variants were'} skipped.`
          : ''

      toast.success(
        `Created ${result.created} ${result.created === 1 ? 'variant' : 'variants'} successfully.${skippedMessage} Variant data has been refreshed.`,
        { duration: 6000 },
      )
    },
    onError: (error) => {
      console.error('Error creating variants:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create variants')
    },
  })

  // Handlers
  const toggleOption = (typeId: string, optionId: string) => {
    setSelectedOptions((prev) => {
      const currentSet = prev[typeId] || new Set<string>()
      const newSet = new Set(currentSet)

      if (newSet.has(optionId)) {
        newSet.delete(optionId)
      } else {
        newSet.add(optionId)
      }

      return { ...prev, [typeId]: newSet }
    })
  }

  const selectAllOptions = (typeId: string, optionIds: string[]) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [typeId]: new Set(optionIds),
    }))
  }

  const clearAllOptions = (typeId: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [typeId]: new Set(),
    }))
  }

  const generateCombinations = () => {
    const selectedTypeIds = Object.keys(selectedOptions).filter(
      (typeId) => selectedOptions[typeId].size > 0,
    )

    if (selectedTypeIds.length === 0) {
      setCombinations([])
      return
    }

    const optionGroups = selectedTypeIds.map((typeId) => {
      const type = variantTypes.find((vt) => String(vt.id) === typeId)
      return Array.from(selectedOptions[typeId]).map((optionId) => {
        const option = type?.options.find((opt) => String(opt.id) === optionId)
        return {
          id: optionId,
          name: option?.label || optionId,
        }
      })
    })

    const allCombinations = generateCartesianProduct(optionGroups)

    const existingCombinationKeys = new Set(
      existingVariants.map((variant) => {
        const optionIds = variant.options.map((opt) =>
          typeof opt === 'object' ? String(opt.id) : String(opt),
        )
        return optionIds.sort().join('|')
      }),
    )

    const allCombinationsWithStatus: Array<VariantCombination & { exists: boolean }> =
      allCombinations.map((combo) => {
        const optionIds = combo.map((opt) => opt.id)
        const optionNames = combo.map((opt) => opt.name)
        const combinationKey = [...optionIds].sort().join('|')
        const exists = existingCombinationKeys.has(combinationKey)

        return {
          options: optionIds,
          optionNames,
          priceInNGN: basePrice,
          costPrice: baseCostPrice,
          inventory: parseInt(baseInventory) || 0,
          selected: !exists,
          exists,
        }
      })

    // Filter out existing variants
    const newCombinations = allCombinationsWithStatus.filter((combo) => !combo.exists)
    const existingCount = allCombinationsWithStatus.length - newCombinations.length

    setCombinations(newCombinations)
    setCurrentPage(1)

    if (allCombinationsWithStatus.length > 0) {
      if (existingCount > 0) {
        if (newCombinations.length > 0) {
          toast.info(
            `${newCombinations.length} new combinations ready to create. ${existingCount} duplicate ${existingCount === 1 ? 'variant was' : 'variants were'} filtered out.`,
          )
        } else {
          toast.warning(
            `All ${existingCount} ${existingCount === 1 ? 'combination' : 'combinations'} already exist. No new variants to create.`,
          )
        }
      } else {
        toast.success(`${newCombinations.length} new combinations ready to create.`)
      }
    }
  }

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

  const toggleCombination = (index: number) => {
    setCombinations((prev) =>
      prev.map((combo, i) => (i === index ? { ...combo, selected: !combo.selected } : combo)),
    )
  }

  const toggleAllCombinations = () => {
    const allSelected = combinations.every((c) => c.selected)
    setCombinations((prev) => prev.map((combo) => ({ ...combo, selected: !allSelected })))
  }

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

  const createVariants = () => {
    const selectedCombinations = combinations.filter((c) => c.selected)

    if (selectedCombinations.length === 0) {
      toast.error('Please select at least one variant combination to create.')
      return
    }

    createVariantsMutation.mutate({
      productId,
      variants: selectedCombinations,
    })
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
            generates all combinations and creates them in bulk. {existingVariants.length} existing{' '}
            {existingVariants.length === 1 ? 'variant is' : 'variants are'} loaded
            {isRefreshingVariants ? ' and refreshing' : ''}.
          </p>
        </div>
        <div className="bulk-variant-creator__content">
          <div className="bulk-variant-creator__section">
            <h4 className="bulk-variant-creator__section-title">Select Variant Options</h4>
            {variantTypes.map((type) => (
              <VariantOptionSelector
                key={type.id}
                type={type}
                selectedOptions={selectedOptions[String(type.id)] || new Set()}
                onToggleOption={(optionId) => toggleOption(String(type.id), optionId)}
                onSelectAll={(optionIds) => selectAllOptions(String(type.id), optionIds)}
                onClearAll={() => clearAllOptions(String(type.id))}
              />
            ))}
          </div>

          <BaseValueInputs
            basePrice={basePrice}
            baseCostPrice={baseCostPrice}
            baseInventory={baseInventory}
            onPriceChange={setBasePrice}
            onCostPriceChange={setBaseCostPrice}
            onInventoryChange={setBaseInventory}
          />

          <div className="bulk-variant-creator__actions">
            <Button margin={false} buttonStyle="primary" onClick={generateCombinations}>
              Generate Combinations
            </Button>
            {combinations.length > 0 && (
              <Button margin={false} buttonStyle="secondary" onClick={applyBaseValues}>
                Apply Base Values to Selected
              </Button>
            )}
          </div>
        </div>
      </div>

      {combinations.length > 0 && (
        <div className="bulk-variant-creator__card">
          <CombinationsTable
            combinations={combinations}
            currentPage={currentPage}
            pageSize={pageSize}
            onToggleCombination={toggleCombination}
            onToggleAll={toggleAllCombinations}
            onUpdateCombination={updateCombination}
            onPageChange={setCurrentPage}
          />
          <div className="bulk-variant-creator__footer">
            <Button
              margin={false}
              buttonStyle="primary"
              onClick={createVariants}
              disabled={createVariantsMutation.isPending || selectedCombinationCount === 0}
            >
              {createVariantsMutation.isPending
                ? 'Creating...'
                : `Create ${selectedCombinationCount} Variants`}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const BulkVariantCreatorContent: React.FC = () => {
  const doc = useDocumentInfo()
  const enableVariants = useFormFields(([fields]) => fields['enableVariants']?.value) as
    | boolean
    | undefined
  const variantTypeIDs = useFormFields(([fields]) => fields['variantTypes']?.value) as
    | number[]
    | undefined

  // Derive a stable string key from the variant type IDs so effect dependencies
  // don't trigger on form re-renders that provide a new array reference
  const variantTypeIDsKey = variantTypeIDs ? [...variantTypeIDs].map(String).sort().join('|') : ''
  const productId = doc.id
  const isEnabled = Boolean(enableVariants && variantTypeIDs?.length && productId)
  const selectedVariantTypeIDs = useMemo(
    () => (variantTypeIDsKey ? variantTypeIDsKey.split('|').map(Number) : []),
    [variantTypeIDsKey],
  )

  const variantTypesQuery = useQuery({
    queryKey: bulkVariantQueryKeys.variantTypes(variantTypeIDsKey),
    queryFn: () => fetchVariantTypes(selectedVariantTypeIDs),
    enabled: isEnabled,
  })

  const existingVariantsQuery = useQuery({
    queryKey: bulkVariantQueryKeys.existingVariants(productId || 'new'),
    queryFn: () => fetchExistingVariants(productId as number | string),
    enabled: isEnabled,
  })

  if (!isEnabled) {
    return null
  }

  if (variantTypesQuery.isLoading || existingVariantsQuery.isLoading) {
    return (
      <div className="bulk-variant-creator">
        <div className="bulk-variant-creator__card">
          <ShimmerEffect height={200} />
        </div>
      </div>
    )
  }

  const error = variantTypesQuery.error || existingVariantsQuery.error

  if (error) {
    return (
      <div className="bulk-variant-creator">
        <div className="bulk-variant-creator__card">
          <div className="bulk-variant-creator__header">
            <h3 className="bulk-variant-creator__title">Error</h3>
            <p
              className="bulk-variant-creator__description"
              style={{ color: 'var(--theme-error-500)' }}
            >
              {error.message}
            </p>
            <Button
              margin={false}
              buttonStyle="secondary"
              onClick={() => {
                void variantTypesQuery.refetch()
                void existingVariantsQuery.refetch()
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <BulkVariantClient
      variantTypes={variantTypesQuery.data || []}
      existingVariants={existingVariantsQuery.data || []}
      productId={productId as number | string}
      isRefreshingVariants={existingVariantsQuery.isFetching && !existingVariantsQuery.isLoading}
    />
  )
}

// ===== Main Export =====

export const BulkVariantCreator: JoinFieldClientComponent = () => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <BulkVariantCreatorContent />
    </QueryClientProvider>
  )
}
