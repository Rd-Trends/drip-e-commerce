import type { UIFieldServerProps } from 'payload'
import { BulkVariantClient } from './bulk-variant-client'
import './index.scss'

type Props = {} & UIFieldServerProps

export const BulkVariantCreator: React.FC<Props> = async (props) => {
  const { data, req, user } = props

  const product = await req.payload.findByID({
    id: data.id,
    collection: 'products',
    depth: 0,
    draft: true,
    select: {
      variantTypes: true,
    },
    user,
  })

  const variantTypeIDs = product.variantTypes as number[]

  const variantTypes = []

  if (variantTypeIDs?.length && variantTypeIDs.length > 0) {
    for (const variantTypeID of variantTypeIDs) {
      const variantType = await req.payload.findByID({
        id: variantTypeID,
        collection: 'variantTypes',
        depth: 1,
        joins: {
          options: {
            sort: 'value',
            // using 100 as the limit, ideally we shouldn't have up to 100 options per variant type
            limit: 100,
          },
        },
      })

      if (variantType) {
        variantTypes.push(variantType)
      }
    }
  }

  // Fetch existing variants for this product
  const existingVariantsResponse = await req.payload.find({
    collection: 'variants',
    depth: 1,
    limit: 1000,
    where: {
      product: {
        equals: data.id,
      },
    },
    user,
  })

  const existingVariants = existingVariantsResponse.docs || []

  return (
    <BulkVariantClient
      // @ts-expect-error - Payload joins structure differs from expected type
      variantTypes={variantTypes}
      existingVariants={existingVariants}
      productId={data.id}
    />
  )
}
