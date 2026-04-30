import { generateText, Output, tool, stepCountIs, type LanguageModel } from 'ai'
import { openai } from '@ai-sdk/openai'
import { xai } from '@ai-sdk/xai'
import type { BasePayload } from 'payload'
import { z } from 'zod'

const DEFAULT_OPENAI_MODEL = 'gpt-4.1-mini'
const DEFAULT_XAI_MODEL = 'grok-4-1-fast-reasoning'
const AI_EXTRACTION_MAX_STEPS = 12

type AIProvider = 'openai' | 'xai'

function resolveAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || 'openai').trim().toLowerCase()

  if (provider === 'openai' || provider === 'xai') {
    return provider
  }

  if (provider === 'grok') {
    return 'xai'
  }

  throw new Error(`Unsupported AI_PROVIDER "${provider}". Use "openai" or "xai".`)
}

function resolveAIModel(provider: AIProvider): string {
  if (provider === 'xai') {
    return process.env.XAI_MODEL || DEFAULT_XAI_MODEL
  }

  return process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
}

function resolveLanguageModel(): LanguageModel {
  const provider = resolveAIProvider()
  const model = resolveAIModel(provider)

  if (provider === 'xai') {
    if (!process.env.XAI_API_KEY) {
      throw new Error('XAI_API_KEY is not configured')
    }

    return xai(model)
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  return openai(model)
}

const variantOptionSchema = z.object({
  id: z
    .number()
    .nullable()
    .describe(
      'Existing option ID from the provided variant catalog when available. Return null for new options.',
    ),
  label: z.string().describe('Variant option label, e.g. "XL", "Black", "Slim Fit".'),
  value: z
    .string()
    .describe(
      'Variant option value. For existing options, copy the catalog value exactly. For new non-color options, use a slug of the label. For new color options, use a CSS background-color value, preferably a hex code.',
    ),
  costPriceInNGN: z
    .number()
    .describe(
      'Cost price in Nigerian Naira for this option. Use the option-specific price when provided; otherwise use the general product cost price. Use 0 only when no price is provided anywhere.',
    ),
  sellingPriceInNGN: z
    .number()
    .describe(
      'Selling price in Nigerian Naira for this option. Usually costPriceInNGN * 1.4. Use 0 only when no price is provided anywhere.',
    ),
})

const productImageSchema = z.object({
  id: z.number().describe('Use one of the provided image IDs exactly as given.'),
  altText: z.string().describe('Concise factual alt text for the image, under 125 characters.'),
  variantTypeId: z
    .number()
    .nullable()
    .default(null)
    .describe(
      'Variant type ID for an image-specific variant link. Usually the Color type ID. Null when the image is not specific to a variant.',
    ),
  variantOptionId: z
    .number()
    .nullable()
    .default(null)
    .describe(
      'Existing option ID for the linked image variant when available in the provided catalog. Return null when the option is new or the image is not variant-specific.',
    ),
  variantOptionLabel: z
    .string()
    .nullable()
    .default(null)
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
    .describe(
      'Highest cost price in Nigerian Naira as a plain number across the product and all variant option prices. Null when not provided.',
    ),
  sellingPriceInNGN: z
    .number()
    .nullable()
    .describe(
      'Highest selling price in Nigerian Naira across the product and all variant option prices. Usually the highest applicable cost price multiplied by 1.4.',
    ),
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

function buildSystemPrompt(
  categories: Category[],
  variantTypes: { id: number; name: string }[],
): string {
  const categoryList = categories.map((c) => `- id: ${c.id}, title: "${c.title}"`).join('\n')
  const variantTypeList = variantTypes
    .map((variantType) => `- id: ${variantType.id}, name: "${variantType.name}"`)
    .join('\n')

  return `You are a product extraction assistant for a Nigerian fashion e-commerce store.
Analyze the user's text and all provided images, then return structured product data.

---

GENERAL RULES
- Return one product object per distinct product design.
- Different angles, flat lays, detail shots, front/back views, or lifestyle shots of the same item belong to the same product.
- Different colorways of the same base design belong to the same product, not separate products.
- Distinct designs must be split into separate product objects.
- If images are provided, every image ID must appear in exactly one product.images array. Do not omit or duplicate any image ID.
- The total number of items across all product.images arrays must exactly equal the number of provided images.
- If no images are provided, return one product unless the text clearly describes multiple separate products.

WHAT MAKES TWO ITEMS THE SAME PRODUCT
- Two items are the same product only when they share the same silhouette AND the same surface design (graphic, print, embroidery, or text placement).
- Items with different graphics, prints, or text — even if the cut and colorway are identical — are separate products.
- Items that differ in silhouette, cut, length, neckline, sleeve type, or garment category are separate products, even if they share the same colorway.
- Example: A plain raglan tee and a graphic raglan tee are two separate products, even if both come in gray and black colorways.
- When in doubt about whether two items are the same product, split them into separate products.

---

TITLE
- Detect visible brands from logos, tags, embroidery, or wordmarks when clearly present.
- If the brand is clear, include it in the title.
- If the brand is not clear, write a clean descriptive title.
- Never invent a brand.

---

DESCRIPTION
- Write 40–80 words. Count carefully.
- Be specific about colour, silhouette, fabric feel when visible, notable details, and styling.
- Do not write generic filler. For example, do not write phrases like "perfect for any occasion" or "a must-have for your wardrobe."

---

FEATURED
- Default: false.
- Return true only when the user explicitly asks to feature or highlight the product.

---

PRICING
- The user-provided price is the cost price.
- costPriceInNGN must be the highest cost price across the product and all variant option prices.
- sellingPriceInNGN must be the highest selling price across the product and all variant option prices.
- Every variant option must include costPriceInNGN and sellingPriceInNGN.
- If a variant option has its own price, use that option-specific price.
- If a variant option does not have its own price, use the general product price for that option.
- When combining variants, the effective price is the highest amount among the selected options' prices.
- Example: "High Quality Luxury Top Available 15k White 16k" means product costPriceInNGN=16000, product sellingPriceInNGN=22400, White option costPriceInNGN=16000, and every other option costPriceInNGN=15000.
- If no price is provided anywhere, product price fields should be null and variant option price fields should be 0.

---

CATEGORIES
- Pick 1–3 categories strictly from the provided category list.
- Be precise. One accurate category is better than three weak ones.

---

VARIANTS
- Use only variant types from this catalog:
${variantTypeList}

- By default, only add Size and Color automatically unless the user explicitly requests another variant dimension.
- Use the provided variantTypeId values exactly as given. Never invent new variant type IDs.
- Call getVariantOptions only for the variant types you actually need.
- Do not return duplicate variant types for the same product.
- Do not return duplicate option labels inside a variant type.

When resolving variant options:
- Always return label and value for every option.
- When an option already exists in the fetched options for that type, return its real id.
- When an option already exists in the fetched options for that type, copy its value exactly.
- When an option is needed but does not exist in the catalog, return id as null and still provide the label and value.
- For new non-color options, value should be the slugified label, e.g. "Extra Large" -> "extra-large".
- For new color options, value must be usable as a CSS background-color value. Prefer hex codes for visual colors, e.g. "Black" -> "#000000", "Olive" -> "#808000", "Cream" -> "#FFFDD0".
- Never invent or guess option IDs.

Color naming rules:
- Use simple, common color labels only. Prefer: Black, White, Gray, Navy, Blue, Light Blue, Red, Burgundy, Pink, Purple, Green, Olive, Yellow, Orange, Brown, Tan, Beige, Cream, Gold, Silver.
- If a color is visually unusual or ambiguous, choose the closest simple color name from the list above instead of inventing a shade name.
- Avoid descriptive, fashion, fabric, or lighting-based color names such as "heather", "melange", "oatmeal", "midnight", "stonewashed", "washed black", "off-black", "ash", or "charcoal marl"; map them to the closest simple label.
- Use the same simple color label in selectedVariants.options.label and image.variantOptionLabel.
- Do not include literal "\\n" or "/n" in any generated string value.

Example variant shape:
{ "variantTypeId": 2, "variantTypeName": "Color", "options": [{ "id": 14, "label": "Black", "value": "black", "costPriceInNGN": 15000, "sellingPriceInNGN": 21000 }, { "id": null, "label": "Olive", "value": "#808000", "costPriceInNGN": 16000, "sellingPriceInNGN": 22400 }] }


COLOR VARIANT EXAMPLES
Scenario A — 1 image showing 2 colorways side by side:
Return both colors as variants. Leave the image untagged.
  variants: [{ variantTypeId: 2, variantTypeName: "Color", options: [{ id: 1, label: "Black", value: "black", costPriceInNGN: 15000, sellingPriceInNGN: 21000 }, { id: 2, label: "White", value: "white", costPriceInNGN: 16000, sellingPriceInNGN: 22400 }] }]

Scenario B — 2 images, each showing exactly one different colorway:
Return both colors as variants. Tag each image to its colorway.
  variants: [{ variantTypeId: 2, variantTypeName: "Color", options: [{ id: 1, label: "Black", value: "black", costPriceInNGN: 15000, sellingPriceInNGN: 21000 }, { id: 2, label: "White", value: "white", costPriceInNGN: 16000, sellingPriceInNGN: 22400 }] }]

Scenario C — 1 image, 1 colorway:
Return that one color as the only variant. Tag the image to it.
  variants: [{ variantTypeId: 2, variantTypeName: "Color", options: [{ id: 5, label: "Red", value: "red", costPriceInNGN: 15000, sellingPriceInNGN: 21000 }] }]

Scenario D — 2 images, each showing 2 colorways with one color shared (e.g. Image 1: Red+Black, Image 2: White+Black):
Collect all distinct colors across both images. Deduplicate — Black appears once even though it appears in both images. Return 3 variants. Both images stay untagged because each shows more than one colorway.
  variants: [{ variantTypeId: 2, variantTypeName: "Color", options: [{ id: 5, label: "Red", value: "red", costPriceInNGN: 15000, sellingPriceInNGN: 21000 }, { id: 1, label: "Black", value: "black", costPriceInNGN: 15000, sellingPriceInNGN: 21000 }, { id: 2, label: "White", value: "white", costPriceInNGN: 16000, sellingPriceInNGN: 22400 }] }]

---

DEFAULT VARIANT LOGIC
- Upper-body garments and two-piece sets → clothing sizes: X, XL, XXL only by default.
- If the user explicitly says all sizes are available, use the full standard clothing size run: S, M, L, XL, XXL.
- If the user provides specific clothing sizes, use those exact sizes instead of the defaults.
- Lower-body garments → waist sizes: 28, 30, 32, 34, 36, 38, 40, 42.
- Shoes → shoe sizes appropriate to the product's market.
- Bags, caps, jewelry, and similar non-sized products → no automatic size variant.
- Add Color only when multiple distinct colorways of the same base design are visible in the images or described in the text.

---

IMAGE RESPONSIBILITIES
- Generate descriptive alt text for every image in each product.
- Each image ID must appear exactly once in the images array — no exceptions, even if the image shows multiple colorways.
- The number of image objects returned for a product must exactly match the number of source images assigned to that product.
- Only attach variantTypeId / variantOptionId / variantOptionLabel to an image when that image shows exactly one colorway and nothing else.
- When an image shows two or more colorways side by side, set variantTypeId, variantOptionId, and variantOptionLabel to null, leave the image untagged, and do not duplicate the image for each colorway.
- Never duplicate an image ID to represent multiple variants. If you are tempted to do this, keep a single image object and remove the variant fields instead.

Correct — image shows two colorways, so it is left untagged:
{ "id": 162, "altText": "Two long sleeve tees with white body, one with gray sleeves and one with black sleeves.", "variantTypeId": null, "variantOptionId": null, "variantOptionLabel": null }

Wrong — same image ID duplicated once per colorway:
{ "id": 162, "altText": "...", "variantTypeId": 1, "variantOptionId": 9, "variantOptionLabel": "Gray" },
{ "id": 162, "altText": "...", "variantTypeId": 1, "variantOptionId": 1, "variantOptionLabel": "Black" }

The wrong example above is a critical error. Never do this.

IMAGE TAGGING EXAMPLES BY SCENARIO
Scenario A — 1 image showing 2 colorways:
Correct (image untagged — multiple colorways visible):
{ "id": 10, "altText": "Tee shown in black and tan colorways side by side.", "variantTypeId": null, "variantOptionId": null, "variantOptionLabel": null }

Scenario B — 2 images, each a single colorway:
Correct (each image tagged to exactly one color):
{ "id": 10, "altText": "Tee in black.", "variantTypeId": 2, "variantOptionId": 1, "variantOptionLabel": "Black" }
{ "id": 11, "altText": "Tee in tan.", "variantTypeId": 2, "variantOptionId": null, "variantOptionLabel": "Tan" }

Scenario C — 1 image, 1 colorway:
Correct (single image tagged to its one color):
{ "id": 10, "altText": "Tee in red.", "variantTypeId": 2, "variantOptionId": 5, "variantOptionLabel": "Red" }

Scenario D — 2 images, each showing 2 colorways with overlap (e.g. Red+Black and White+Black):
Correct (both images untagged — neither shows exactly one colorway):
{ "id": 10, "altText": "Tee shown in red and black colorways.", "variantTypeId": null, "variantOptionId": null, "variantOptionLabel": null }
{ "id": 11, "altText": "Tee shown in white and black colorways.", "variantTypeId": null, "variantOptionId": null, "variantOptionLabel": null }
The color variants returned are Red, Black, and White — Black is listed once despite appearing in both images.

---

PRE-RETURN CHECKLIST
Before returning your response, verify every item below:
[ ] Every image ID appears exactly once across the entire images array — search for duplicate IDs before returning.
[ ] The total number of returned image objects exactly matches the number of provided images.
[ ] No image showing multiple colorways has any variant fields attached.
[ ] No category ID or variant type ID was invented — all come from the provided lists.
[ ] No variant type is duplicated within a product.
[ ] No option label is duplicated within a variant type.
[ ] Every variant option includes a value.
[ ] Every description is 40–80 words.
[ ] featured defaults to false unless the user explicitly asked otherwise.
[ ] No two products with different chest graphics, prints, or text placements were merged — different surface design = different product, regardless of shared silhouette or colorway.
[ ] No two structurally different garments were merged into one product — check silhouette, cut, and garment type for every product that contains more than one image.
[ ] Colorway differences alone did not cause a single product to be split into multiple products.

---

Available categories:
${categoryList}`
}

export async function parseProductsFromSession({
  messageText,
  categories,
  images,
  payload,
  variantTypes,
}: {
  messageText: string
  categories: Category[]
  images: { id: number; url: string }[]
  payload: BasePayload
  variantTypes: { id: number; name: string }[]
}): Promise<ParsedProductSession> {
  const { output } = await generateText({
    model: resolveLanguageModel(),
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
    stopWhen: stepCountIs(AI_EXTRACTION_MAX_STEPS),
    maxOutputTokens: 5000,
    system: buildSystemPrompt(categories, variantTypes),
    temperature: 0,
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
