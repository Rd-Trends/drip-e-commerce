import type { Validate } from 'payload'

export const validateOptions: Validate = async (values, { data, req }) => {
  if (!values || values.length === 0) {
    return 'Variant options are required.'
  }

  const productID = data.product

  if (!productID) {
    return 'A product is required.'
  }

  const product = await req.payload.findByID({
    id: productID,
    collection: 'products',
    depth: 1,
    joins: {
      variants: {
        where: {
          ...(data.id && {
            id: {
              not_equals: data.id, // exclude the current variant from the search
            },
          }),
        },
      },
    },
    select: {
      variants: true,
      variantTypes: true,
    },
    user: req.user,
  })

  const variants = product.variants?.docs ?? []
  const variantTypes = product.variantTypes || []

  if (values.length < variantTypes.length) {
    return 'All variant options are required.'
  }

  if (variants.length > 0) {
    const existingOptions: (number | string)[][] = []

    variants.forEach((variant) => {
      if (typeof variant !== 'object' || !variant.options) return

      existingOptions.push(variant.options as (number | string)[])
    })

    const exists = existingOptions.some(
      (combo) => combo.length === values.length && combo.every((val) => values.includes(val)),
    )

    if (exists) {
      return 'This variant combo is already in use by another variant. Please select different options.'
    }
  }

  return true
}
