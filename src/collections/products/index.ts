import type { CollectionConfig, DefaultDocumentIDType, Where } from 'payload'
import { canManageContent } from '@/access/can-manage-content'
import { canManageContentOrPublishedStatus } from '@/access/can-manage-content-or-published-status'
import { adminOnlyFieldAccess } from '@/access/admin-only-field-access'
import { generatePreviewPath } from '@/utils/generate-preview-path'
import { pricesField } from '../../fields/prices-field'
import { inventoryField } from '../../fields/inventory-field'
import { variantsFields } from '../../fields/variants-field'
import { currenciesConfig } from '@/lib/constants'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { slugField } from 'payload'
import { revalidateAfterChange, revalidateDelete } from './hooks/revalidate'
import { amountField } from '@/fields/ammount-field'
import { Product as TProduct } from '@/payload-types'

export const Products: CollectionConfig = {
  slug: 'products',
  access: {
    create: canManageContent,
    delete: canManageContent,
    read: canManageContentOrPublishedStatus,
    update: canManageContent,
  },
  hooks: {
    afterChange: [revalidateAfterChange],
    afterDelete: [revalidateDelete],
  },
  admin: {
    group: 'Shop',
    defaultColumns: ['title', 'enableVariants', '_status', 'inventory', 'priceInNGN'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
    description: 'Products available for purchase in the store',
  },
  defaultPopulate: {
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInNGN: true,
    inventory: true,
    meta: true,
  },
  versions: {
    drafts: {
      autosave: {
        interval: 100,
      },
    },
    maxPerDoc: 50,
  },
  trash: true,
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: ({ data }: { data: TProduct }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map((item) => {
                        if (typeof item === 'object' && item?.id) {
                          return item.id
                        }
                        return item
                      }) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      const query: Where = {
                        variantType: {
                          in: variantTypeIDs,
                        },
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            inventoryField({
              overrides: {
                admin: {
                  condition: ({ enableVariants }) => enableVariants !== true,
                },
              },
            }),
            ...variantsFields,
            ...pricesField({ currenciesConfig }),
            amountField({
              currenciesConfig,
              overrides: {
                name: 'costPrice',
                label: 'Cost Price (₦)',
                required: false,
                access: {
                  read: adminOnlyFieldAccess,
                  create: adminOnlyFieldAccess,
                  update: adminOnlyFieldAccess,
                },
                admin: {
                  description:
                    "Cost price for this product, this won't be shown to customers (admin only)",
                  condition: (data) => {
                    return data?.enableVariants !== true
                  },
                },
              },
            }),
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      hasMany: true,
      relationTo: 'categories',
      required: true,
      validate: (categories) => {
        if (!categories || (Array.isArray(categories) && categories.length === 0)) {
          return 'At least one category is required.'
        }
        return true
      },
    },
    {
      name: 'isFeatured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Feature this product on the home page',
      },
    },
    slugField(),
  ],
  labels: {
    plural: 'Products',
    singular: 'Product',
  },
}
