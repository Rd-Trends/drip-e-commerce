import type { CollectionBeforeChangeHook } from 'payload'

export const variantsCollectionBeforeChange: CollectionBeforeChangeHook = async ({ data, req }) => {
  if (data?.options?.length && data.options.length > 0) {
    const titleArray: string[] = []
    const productID = data.product
    const product = await req.payload.findByID({
      id: productID,
      collection: 'products',
      depth: 0,
      select: {
        title: true,
        variantTypes: true,
      },
    })

    if (product.title && typeof product.title === 'string') {
      titleArray.push(product.title)
    }

    for (const option of data.options) {
      const variantOption = await req.payload.findByID({
        id: option,
        collection: 'variantOptions',
        depth: 0,
        select: {
          label: true,
        },
      })

      if (!variantOption) {
        continue
      }

      if (variantOption.label && typeof variantOption.label === 'string') {
        titleArray.push(variantOption.label)
      }
    }

    data.title = titleArray.join(' — ')
  }

  return data
}
