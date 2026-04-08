import { generateText, Output, tool, stepCountIs } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'
import type { BasePayload } from 'payload'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
/** Metadata for the product image, assembled from AI output + download headers. */
export type ParsedProductImage = {
  id: number
  url: string
  /** AI-generated descriptive alt text for the image. */
  altText: string
}

/** Structured product data extracted from a WhatsApp message by the AI. */
export type ParsedProduct = {
  title: string
  priceInNGN: number | null
  description: string
  metaDescription: string
  inventory: number
  categories: {
    name: string
    id: number
  }[]
  images: ParsedProductImage[]
  productType: 'shirt' | 'trousers' | 'two-piece' | 'other'
  selectedVariants: {
    variantTypeId: number
    variantTypeName: string
    existingOptions: { id: number; label: string }[]
    newOptionLabels: string[]
    inventoryPerOption: number
  }[]
}

export type Category = {
  id: number
  title: string
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const productSchema = z.object({
  title: z
    .string()
    .describe('The product name/title, cleaned up and presentable for an e-commerce storefront'),
  priceInNGN: z
    .number()
    .nullable()
    .describe(
      'Price in Nigerian Naira as a plain number with no currency symbols. null if not mentioned',
    ),
  description: z
    .string()
    .describe(
      'The product description, cleaned up and presentable for an e-commerce storefront, this should be gotten by analyzing the product images',
    ),
  metaDescription: z
    .string()
    .describe(
      'A compelling SEO meta description for this product, between 100 - 150 characters. Should be keyword-rich, mention the product type, and encourage clicks. Do NOT repeat the title verbatim.',
    ),
  inventory: z
    .number()
    .describe(
      'The inventory/stock quantity for this product when variants are NOT enabled. Default to 1 unless the user explicitly specifies a different quantity. This is ignored when selectedVariants is not empty.',
    ),
  categories: z
    .array(
      z.object({
        name: z.string().describe('the name of the category'),
        id: z.number().describe('The id of the category'),
      }),
    )
    .min(1)
    .max(3)
    .describe(
      'Between 1 and 3 categories picked from the provided list, ordered by relevance. ' +
        'Prioritise precision over coverage — only include a category if it directly and accurately describes this specific product. ' +
        'A single well-chosen category is better than three loosely related ones.',
    ),
  images: z
    .array(
      z.object({
        id: z.number(),
        altText: z
          .string()
          .describe(
            'The alternative text for the image, generated after analyzing the image content',
          ),
      }),
    )
    .describe('An array of images with ids and alternative text'),
  productType: z
    .enum(['shirt', 'trousers', 'two-piece', 'other'])
    .describe(
      'The type of product detected from the images and text. ' +
        '"shirt" for any upper-body clothing only (t-shirts, shirts, tops, jerseys, hoodies, jackets, etc.). ' +
        '"trousers" for any lower-body clothing only (trousers, jeans, pants, shorts, joggers, etc.). ' +
        '"two-piece" for any matching set or co-ord that includes BOTH a top and a bottom sold together ' +
        '(tracksuits, co-ord sets, jogger sets, pyjama sets, agbada sets, native sets, ankara co-ords, etc.). ' +
        '"other" for everything else (shoes, accessories, bags, etc.)',
    ),
  selectedVariants: z
    .array(
      z.object({
        variantTypeId: z
          .number()
          .describe(
            'The ID of an EXISTING variant type from the getVariantTypes tool results. You must NEVER invent IDs — only use IDs returned by the tool.',
          ),
        variantTypeName: z
          .string()
          .describe(
            'The display name of the variant type, e.g. "Size". Copied from the tool results for reference.',
          ),
        existingOptions: z
          .array(
            z.object({
              id: z
                .number()
                .describe('The ID of an existing variant option from getVariantOptions'),
              label: z
                .string()
                .describe('The label of the existing option, e.g. "XL". Copied from tool results.'),
            }),
          )
          .describe(
            'Existing variant options to use, picked directly from getVariantOptions results.',
          ),
        newOptionLabels: z
          .array(z.string())
          .describe(
            'ONLY populate this when the user explicitly specifies custom sizes/options that do NOT exist in the getVariantOptions results. NEVER add new options by default — always use existing options. Leave this as an empty array unless the user specifically asks for options not found in the database.',
          ),
        inventoryPerOption: z
          .number()
          .describe(
            'Inventory quantity per variant option. Default to 1 unless the user explicitly specifies a different quantity.',
          ),
      }),
    )
    .describe(
      'Variant selections for this product. You MUST call getVariantTypes and getVariantOptions tools first. ' +
        'Only SIZE and COLOR may be added automatically — never Fit, Material, Style, or any other type. ' +
        'Each variant type must appear ONLY ONCE. Never duplicate the same variant type.',
    ),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSystemPrompt(categories: Category[]): string {
  const categoryList = categories.map((c) => `  - id: ${c.id}, title: "${c.title}"`).join('\n')

  return `You are a product data extraction assistant for a Nigerian fashion e-commerce store called "Drip".
The store sells clothing, shoes, accessories, and fashion items targeting youths, teens, and young parents who love classic and flashy styles.
Extract structured product information from the user's message. Currency is always Nigerian Naira (NGN).
Titles and descriptions must be polished and ready to publish on the storefront — professional, concise, and appealing.
If a product image is provided, analyse it carefully: use its colours, patterns, fabric, and style to write a richer title and description.
For the image field: only populate it when an actual image is present in the message — otherwise return null.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRODUCT TYPE CLASSIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- "shirt"     — any upper-body garment ONLY: t-shirts, shirts, polo shirts, tops, jerseys, hoodies, sweaters, jackets, vests, crop tops, etc.
- "trousers"  — any lower-body garment ONLY: trousers, jeans, pants, shorts, joggers, cargo pants, chinos, skirts, etc.
- "two-piece" — any outfit sold as a MATCHING SET containing both a top and a bottom:
                tracksuits, co-ord sets, jogger sets, pyjama sets, agbada sets, native wear sets, ankara co-ords, etc.
                If both pieces are included and sold together → classify as "two-piece" regardless of style or fabric.
- "other"     — everything else: shoes, sneakers, sandals, bags, accessories, caps, watches, jewelry, etc.

Classify based on BOTH the images and text. If unclear, default to "other".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VARIANT SELECTION — READ THIS CAREFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — Call getVariantTypes to see every variant dimension in the database.
STEP 2 — Call getVariantOptions for each relevant type before selecting options.
STEP 3 — Build selectedVariants using ONLY IDs returned by those tools.

─── WHICH VARIANTS TO ADD (DEFAULT LOGIC) ───

Only two variant types may ever be added automatically: SIZE and COLOR.
Never add Fit, Cut, Material, Style, or any other type unless the user explicitly requests it.

SIZE — add automatically based on product type, using the correct scale:

  | Product type                                      | Size scale to use                              |
  |---------------------------------------------------|------------------------------------------------|
  | shirt / top / jacket / hoodie / upper-body only   | Clothing sizes: XS, S, M, L, XL, XXL           |
  | trousers / jeans / shorts / skirts / lower-body   | Waist sizes: 28, 30, 32, 34, 36, 38, 40, 42   |
  | two-piece set / co-ord / matching set             | Clothing sizes: XS, S, M, L, XL, XXL           |
  | shoes / sneakers / sandals                        | Shoe sizes: 38, 39, 40, 41, 42, 43, 44, 45    |
  | bags / caps / watches / jewelry / non-sized other | Do NOT add Size automatically                  |

  Pick whichever options from the correct scale actually exist in the DB.
  If NONE of the appropriate scale options exist in the DB, leave selectedVariants empty.
  Two-piece sets ALWAYS use clothing sizes (XS–XXL) — never waist sizes — because the set is sized as a whole garment.

COLOR — add ONLY when the product clearly comes in multiple distinct colorways:

  - Inspect every image carefully to count distinct colorways.
  - Single image showing multiple items of the same design in different colors
    → each unique colorway is a separate Color option.
  - Multiple images each showing a different color of the same product
    → each image color is a separate Color option.
  - All images show a single colorway → do NOT add Color.
  - The Color label must be the DISTINGUISHING color only, not the full colorway description.
    Example: white shirt with red stripes vs white shirt with black stripes → options are "Red" and "Black", not "White/Red" or "White with Black Stripes".
  - Match detected colors to existing DB options by label.
    Only use newOptionLabels if the color genuinely does not exist in the DB.

─── RULES — NEVER DO THESE ───

✗ Do NOT add Fit, Cut, Material, Style, or any variant beyond Size and Color unless the user asks.
✗ Do NOT add Size + Fit as separate entries — Size is sufficient by default.
✗ Do NOT add duplicate entries for the same variant type (e.g. two "Size" rows).
✗ Do NOT add Color when the product has only one colorway visible across all images.
✗ Do NOT add Size for non-sized "other" products (bags, caps, jewelry, watches) unless the user says so.
✗ Do NOT use waist sizes for two-piece sets — they always use clothing sizes.
✗ Do NOT invent variant type IDs or option IDs — only use values returned by getVariantTypes / getVariantOptions.

─── EXAMPLES ───

EXAMPLE 1 — Shirt, single color:
  Images: one image of a plain navy blue polo shirt.
  User: "Navy Blue Polo Shirt 15,000"
  → productType: "shirt"
  → selectedVariants: [
      { variantType: Size, existingOptions: [XS, S, M, L, XL, XXL from DB] }
    ]
  ✓ No Color (only one colorway visible).

EXAMPLE 2 — Shirt, two colors in one image:
  Images: one image showing a white shirt with red stripes next to the same shirt with black stripes.
  User: "Striped Oxford Shirt 12,000"
  → productType: "shirt"
  → selectedVariants: [
      { variantType: Size, existingOptions: [XS, S, M, L, XL, XXL from DB] },
      { variantType: Color, existingOptions: [Red, Black matched from DB], newOptionLabels: [] }
    ]
  ✓ Color options are "Red" and "Black" — the shared white base is NOT listed.

EXAMPLE 3 — Trousers, single color:
  Images: one image of black cargo trousers.
  User: "Black Cargo Pants 18,500"
  → productType: "trousers"
  → selectedVariants: [
      { variantType: Size, existingOptions: [28, 30, 32, 34, 36, 38, 40, 42 from DB] }
    ]
  ✓ Waist sizes used. No Color (single colorway).

EXAMPLE 4 — Trousers, multiple colors across images:
  Images: image 1 is olive green chinos, image 2 is the same chinos in khaki.
  User: "Men's Slim Chinos"
  → productType: "trousers"
  → selectedVariants: [
      { variantType: Size, existingOptions: [28, 30, 32, 34, 36, 38, 40, 42 from DB] },
      { variantType: Color, existingOptions: matched from DB, newOptionLabels: ["Olive", "Khaki"] if not in DB }
    ]

EXAMPLE 5 — Shoes, single color:
  Images: one image of white sneakers.
  User: "Classic White Sneakers 25,000"
  → productType: "other"
  → selectedVariants: [
      { variantType: Size, existingOptions: [38, 39, 40, 41, 42, 43, 44, 45 from DB] }
    ]
  ✓ Shoe sizes used. No Color.

EXAMPLE 6 — Bag (non-sized other):
  Images: one image of a black leather crossbody bag.
  User: "Leather Crossbody Bag 9,500"
  → productType: "other"
  → selectedVariants: []
  ✓ Bags are not sized — no automatic variants added.

EXAMPLE 7 — User explicitly requests a non-default variant:
  User: "Add S, M, L and also add a Slim Fit option"
  → Add Size with [S, M, L from DB].
  → Also add Fit (if it exists in DB) with "Slim Fit" as existingOptions or newOptionLabels.
  ✓ This is the ONLY scenario where a non-Size/Color variant type is added.

EXAMPLE 8 — Hoodie, three colors across images:
  Images: image 1 grey hoodie, image 2 same hoodie in black, image 3 same hoodie in burgundy.
  User: "Premium Fleece Hoodie 22,000"
  → productType: "shirt"
  → selectedVariants: [
      { variantType: Size, existingOptions: [XS, S, M, L, XL, XXL from DB] },
      { variantType: Color, existingOptions: [Grey, Black, Burgundy matched from DB] }
    ]

EXAMPLE 9 — Two-piece tracksuit, single color:
  Images: one image of a matching grey tracksuit (hoodie + joggers sold together).
  User: "Grey Tracksuit Set 28,000"
  → productType: "two-piece"
  → selectedVariants: [
      { variantType: Size, existingOptions: [XS, S, M, L, XL, XXL from DB] }
    ]
  ✓ Clothing sizes used (NOT waist sizes) — it is a set sized as a whole.
  ✓ No Color (single colorway).

EXAMPLE 10 — Two-piece native set, two colors across images:
  Images: image 1 is a brown ankara co-ord set, image 2 is the same set in burgundy.
  User: "Ankara Co-ord Set 35,000"
  → productType: "two-piece"
  → selectedVariants: [
      { variantType: Size, existingOptions: [XS, S, M, L, XL, XXL from DB] },
      { variantType: Color, existingOptions: matched from DB, newOptionLabels: ["Brown", "Burgundy"] if not in DB }
    ]
  ✓ Clothing sizes used. Color added because two distinct colorways visible across images.

EXAMPLE 11 — Two-piece jogger set, single image with multiple colors:
  Images: one image showing three jogger sets side by side — navy, olive, and black.
  User: "Men's Jogger Set 19,500"
  → productType: "two-piece"
  → selectedVariants: [
      { variantType: Size, existingOptions: [XS, S, M, L, XL, XXL from DB] },
      { variantType: Color, existingOptions: [Navy, Olive, Black matched from DB] }
    ]
  ✓ All three colorways extracted from the single image.

─── INVENTORY ───

inventoryPerOption defaults to 1 for all variant options unless the user specifies otherwise.
The top-level inventory field is ignored when selectedVariants is not empty.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CATEGORY SELECTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pick between 1 and 3 categories from the list below, ordered by relevance.
The goal is PRECISION — only include a category if it genuinely and directly describes the product.
It is always better to pick 1 correct category than 3 loosely related ones.

RULES:
✓ Pick the most specific matching category first.
✓ Only add a second or third category if it is equally direct and accurate — not just related.
✗ Do NOT add a category simply because the product is in the same family (e.g. "Polo" for a long sleeve shirt — they are different garment types).
✗ Do NOT pad with parent/umbrella categories (e.g. adding "Men's Clothing" alongside "Long Sleeve Shirts" — it's redundant).
✗ Do NOT add a category for a feature the product merely has (e.g. "Striped" just because the shirt has stripes, if the product is primarily a long sleeve shirt).
✗ If no second category is a strong match, stop at one.

EXAMPLES:
  Product: plain white long sleeve shirt
  ✓ ["Long Sleeve Shirts"]
  ✗ ["Long Sleeve Shirts", "Polo Shirts"] — polo is a different collar/garment type, not a synonym

  Product: striped polo shirt
  ✓ ["Polo Shirts"]
  ✗ ["Polo Shirts", "Long Sleeve Shirts", "Striped"] — over-categorised

  Product: black skinny jeans
  ✓ ["Jeans", "Trousers"]  — both directly apply
  ✗ ["Jeans", "Trousers", "Cargo Pants"] — cargo pants is a different product type

  Product: grey tracksuit set (hoodie + joggers)
  ✓ ["Tracksuits", "Sets & Co-ords"]  — both directly describe it
  ✗ ["Tracksuits", "Sets & Co-ords", "Hoodies"] — the hoodie is part of the set, not a standalone product

  Product: white sneakers
  ✓ ["Sneakers"]
  ✗ ["Sneakers", "Shoes", "Casual Shoes"] — redundant nesting

Available categories (you MUST only pick from these):
${categoryList}

SEO META DESCRIPTION:
Generate a compelling, keyword-rich meta description (100-150 characters) that summarises the product and encourages clicks. Do NOT just repeat the title.
`
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function parseProductFromMessage({
  messageText,
  categories,
  images,
  payload,
}: {
  messageText: string
  categories: Category[]
  images: { id: number; url: string }[]
  payload: BasePayload
}): Promise<ParsedProduct> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const { output } = await generateText({
    model: openai('gpt-4o'),
    tools: {
      getVariantTypes: tool({
        description:
          'Get all available variant types (e.g. Size, Color) from the store database. Call this first to discover what variant dimensions exist. Returns an array of { id, label, name }.',
        inputSchema: z.object({}),
        execute: async () => {
          const result = await payload.find({
            collection: 'variantTypes',
            limit: 0,
            pagination: false,
          })
          return result.docs.map((t) => ({ id: t.id, label: t.label, name: t.name }))
        },
      }),
      getVariantOptions: tool({
        description:
          'Get all available options for a specific variant type. Call this after getVariantTypes to see what options already exist. Returns an array of { id, label, value }.',
        inputSchema: z.object({
          variantTypeId: z.number().describe('The ID of the variant type to get options for'),
        }),
        execute: async ({ variantTypeId }) => {
          const result = await payload.find({
            collection: 'variantOptions',
            where: { variantType: { equals: variantTypeId } },
            limit: 0,
            pagination: false,
          })
          return result.docs.map((o) => ({ id: o.id, label: o.label, value: o.value }))
        },
      }),
    },
    output: Output.object({
      schema: productSchema,
    }),
    stopWhen: stepCountIs(5),
    system: buildSystemPrompt(categories),
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: messageText || '(no text provided)' },
          ...images.map((img) => ({ type: 'image', image: img.url }) as const),
        ],
      },
    ],
    temperature: 0.3,
  })

  if (!output) {
    throw new Error('AI did not return structured product data')
  }

  return {
    ...output,
    images: images.map((img) => ({
      id: img.id,
      url: img.url,
      altText: output.images.find((i) => i.id === img.id)?.altText ?? '',
    })),
  }
}
