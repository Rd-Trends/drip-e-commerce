import { generateText, Output, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { BasePayload } from 'payload'
import { z } from 'zod'

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

const variantOptionSchema = z.object({
  id: z
    .number()
    .nullable()
    .describe(
      'Existing option ID from the provided variant catalog when available. Return null for new options.',
    ),
  label: z.string().describe('Variant option label, e.g. "XL", "Black", "Slim Fit".'),
})

const productImageSchema = z.object({
  id: z.number().describe('Use one of the provided image IDs exactly as given.'),
  altText: z.string().describe('Concise factual alt text for the image, under 125 characters.'),
  variantTypeId: z
    .number()
    .nullable()
    .describe(
      'Variant type ID for an image-specific variant link. Usually the Color type ID. Null when the image is not specific to a variant.',
    ),
  variantOptionId: z
    .number()
    .nullable()
    .describe(
      'Existing option ID for the linked image variant when available in the provided catalog. Return null when the option is new or the image is not variant-specific.',
    ),
  variantOptionLabel: z
    .string()
    .nullable()
    .describe(
      'Variant option label for the linked image variant, e.g. "Black". Null when the image is not variant-specific.',
    ),
})

const extractedProductSchema = z.object({
  title: z
    .string()
    .describe(
      'Product title. Detect visible brands from logos, tags, embroidery, or wordmarks when clearly present.',
    ),
  costPriceInNGN: z
    .number()
    .nullable()
    .describe('Cost price in Nigerian Naira as a plain number. Null when not provided.'),
  sellingPriceInNGN: z
    .number()
    .nullable()
    .describe('Selling price in Nigerian Naira. Usually cost price multiplied by 1.4.'),
  description: z
    .string()
    .describe('Storefront-ready product description written from the text and images.'),
  metaDescription: z.string().describe('SEO meta description, 100-150 characters.'),
  isFeatured: z
    .boolean()
    .describe('True only when the user explicitly asks for the product to be featured.'),
  inventory: z
    .number()
    .describe('Inventory for non-variant products. Ignored when selectedVariants is not empty.'),
  categories: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
      }),
    )
    .min(1)
    .max(3)
    .describe('1-3 category matches selected strictly from the provided category list.'),
  images: z
    .array(productImageSchema)
    .describe(
      'Images belonging to this product only. Use every provided image exactly once across the full response.',
    ),
  selectedVariants: z
    .array(
      z.object({
        variantTypeId: z
          .number()
          .describe(
            'Variant type ID from the provided catalog. Never invent new variant type IDs.',
          ),
        variantTypeName: z
          .string()
          .describe('Variant type label from the provided catalog, e.g. "Color".'),
        options: z
          .array(variantOptionSchema)
          .min(1)
          .describe(
            'Variant options for this type. Use catalog IDs where available; otherwise keep id null and return the label.',
          ),
        inventoryPerOption: z
          .number()
          .describe('Inventory per option. Default to 1 unless the user specifies otherwise.'),
      }),
    )
    .describe(
      'Variants selected for this product. Leave empty when the product should not use variants.',
    ),
})

const extractedSessionSchema = z.object({
  products: z
    .array(extractedProductSchema)
    .min(1)
    .describe(
      'All products found in the session. Split distinct products into separate entries. Keep colorways of the same design in one product.',
    ),
})

export type Category = {
  id: number
  title: string
}

export type VariantCatalogOption = {
  id: number
  label: string
  value: string
}

export type VariantCatalogType = {
  id: number
  label: string
  name: string
  options: VariantCatalogOption[]
  optionsLoaded?: boolean
}

export type ParsedSessionProduct = z.infer<typeof extractedProductSchema>
export type ParsedProductSession = z.infer<typeof extractedSessionSchema>

function buildSystemPrompt(categories: Category[], variantCatalog: VariantCatalogType[]): string {
  const categoryList = categories.map((c) => `- id: ${c.id}, title: "${c.title}"`).join('\n')
  const variantTypeList = variantCatalog
    .map(
      (variantType) =>
        `- ${variantType.label} [typeId:${variantType.id}, name:${variantType.name}]`,
    )
    .join('\n')

  return `You are a product extraction assistant for a Nigerian fashion e-commerce store.
Analyze the user's text and all provided images, then return structured product data.

GENERAL RULES
- Return one product object per distinct product design.
- Different angles, flat lays, detail shots, front/back views, or lifestyle shots of the same item belong to the same product.
- Different colorways of the same base design belong to the same product, not separate products.
- Distinct products must be split into separate product objects.
- If images are provided, every image ID must appear in exactly one product.images array. Do not omit or duplicate any image ID.
- If no images are provided, return one product unless the text clearly describes multiple separate products.

TITLE
- Detect visible brands from logos, tags, embroidery, or wordmarks when clearly present.
- If the brand is clear, include it in the title.
- If the brand is not clear, write a clean descriptive title.
- Never invent a brand.
- Never use "Drip" as the brand.

DESCRIPTION
- Write 40-80 words.
- Be specific about colour, silhouette, fabric feel when visible, notable details, and styling.
- Avoid generic filler.

FEATURED
- Return true only when the user explicitly asks to feature or highlight the product.

PRICING
- The user-provided price is the cost price.
- sellingPriceInNGN should usually be costPriceInNGN * 1.4.
- If no price is provided, both price fields should be null.

CATEGORIES
- Pick 1-3 categories strictly from the provided category list.
- Be precise. One accurate category is better than three weak ones.

VARIANTS
- Use only variant types from this catalog:
${variantTypeList}

- By default, only add Size and Color automatically unless the user explicitly requests another variant dimension.
- Use the provided variantTypeId values exactly as given. Never invent new variant type IDs.
- Call getVariantOptions only for the variant types you actually need.
- When an option already exists in the fetched options for that type, return its real ID.
- When an option is needed but missing from the catalog, return id as null and still provide the label.
- Do not create new options yourself.
- Do not return duplicate variant types for the same product.
- Do not return duplicate option labels inside a variant type.

DEFAULT VARIANT LOGIC
- Upper-body garments and two-piece sets usually use clothing sizes such as L, XL, XXL.
- Lower-body garments usually use waist sizes such as 28, 30, 32, 34, 36, 38, 40, 42.
- Shoes usually use shoe sizes.
- Bags, caps, jewelry, and similar non-sized products should usually have no automatic size variant.
- Add Color only when multiple distinct colorways of the same base design are visible.

IMAGE RESPONSIBILITIES
- Generate alt text for every image in each product.
- variantTypeId / variantOptionId / variantOptionLabel on an image should only be used when that image clearly represents one specific variant option.
- This is usually for Color images.
- Group shots or images showing multiple colorways should return null for the image variant link fields.

OUTPUT QUALITY
- Be conservative. When uncertain whether images are the same product, prefer splitting them into separate products.
- Use only the provided category IDs and variant type IDs.

Available categories:
${categoryList}`
}

export async function parseProductsFromSession({
  messageText,
  categories,
  images,
  payload,
  variantCatalog,
}: {
  messageText: string
  categories: Category[]
  images: { id: number; url: string }[]
  payload: BasePayload
  variantCatalog: VariantCatalogType[]
}): Promise<ParsedProductSession> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const { output } = await generateText({
    model: openai(OPENAI_MODEL),
    tools: {
      getVariantOptions: tool({
        description:
          'Get all available options for a specific variant type. Call this only for the variant types you need to use. Returns an array of { id, label, value }.',
        inputSchema: z.object({
          variantTypeId: z.number().describe('The ID of the variant type to fetch options for'),
        }),
        execute: async ({ variantTypeId }) => {
          const result = await payload.find({
            collection: 'variantOptions',
            where: { variantType: { equals: variantTypeId } },
            limit: 0,
            pagination: false,
          })

          return result.docs.map((option) => ({
            id: option.id,
            label: option.label,
            value: option.value,
          }))
        },
      }),
    },
    output: Output.object({
      schema: extractedSessionSchema,
    }),
    stopWhen: stepCountIs(8),
    system: buildSystemPrompt(categories, variantCatalog),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: messageText || '(no text provided)' },
          ...images.flatMap((img) => [
            { type: 'text' as const, text: `[Image ID: ${img.id}]` },
            { type: 'image' as const, image: img.url },
          ]),
        ],
      },
    ],
  })

  if (!output) {
    throw new Error('AI did not return structured product data')
  }

  return output
}
