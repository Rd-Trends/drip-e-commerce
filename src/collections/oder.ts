import { amountField, createOrdersCollection, currencyField } from '@payloadcms/plugin-ecommerce'
import { adminOnlyFieldAccess } from '@/access/admin-only-field-access'
import { isAdmin } from '@/access/is-admin'
import { isDocumentOwner } from '@/access/is-document-owner'
import { currenciesConfig } from '@/lib/constants'
import { addressFields } from './address/fields'
import { CollectionConfig } from 'payload'
import { CollectionAfterChangeHook } from 'payload'
import { Order } from '@/payload-types'
import { OrderConfirmationEmail } from '@/lib/emails'
import { render } from '@react-email/components'

const sendOrderConfirmationEmail: CollectionAfterChangeHook<Order> = async ({
  doc,
  operation,
  req: { payload },
}) => {
  // Only send email on create or when status changes to 'processing'
  if (operation === 'create' || (operation === 'update' && doc.status === 'processing')) {
    if (!doc.customerEmail) {
      payload.logger.warn(`Order ${doc.id} has no customer email, skipping confirmation email`)
      return doc
    }

    try {
      // Fetch full order with populated relations
      const fullOrder = await payload.findByID({
        collection: 'orders',
        id: doc.id,
        depth: 2, // Populate nested relations
      })

      const emailHtml = await render(OrderConfirmationEmail({ order: fullOrder }))

      await payload.sendEmail({
        to: doc.customerEmail,
        subject: `Order Confirmation - #${doc.id} - Drip E-Commerce`,
        html: emailHtml,
      })

      payload.logger.info(
        `Order confirmation email sent to ${doc.customerEmail} for order #${doc.id}`,
      )
    } catch (error) {
      payload.logger.error(`Failed to send order confirmation email for order #${doc.id}: ${error}`)
    }
  }

  return doc
}

const defaultOrdersCollection = createOrdersCollection({
  access: { isAdmin, adminOnlyFieldAccess, isDocumentOwner },
  enableVariants: true,
  customersSlug: 'users',
  productsSlug: 'products',
  transactionsSlug: 'transactions',
  variantsSlug: 'variants',
  addressFields,
})

export const Orders: CollectionConfig = {
  ...defaultOrdersCollection,
  hooks: {
    ...defaultOrdersCollection.hooks,
    afterChange: [
      ...(defaultOrdersCollection.hooks?.afterChange || []),
      sendOrderConfirmationEmail,
    ],
  },
  fields: [
    ...defaultOrdersCollection.fields,
    currencyField({ currenciesConfig }),
    {
      type: 'row',
      fields: [
        amountField({
          currenciesConfig,
          overrides: {
            name: 'subtotal',
            label: 'Subtotal',
            admin: { description: 'Order subtotal before shipping' },
          },
        }),
        amountField({
          currenciesConfig,
          overrides: {
            name: 'shippingFee',
            label: 'Shipping Fee',
            admin: { description: 'Shipping fee for this order' },
          },
        }),
      ],
    },
    {
      type: 'row',
      fields: [
        amountField({
          currenciesConfig,
          overrides: {
            name: 'tax',
            label: 'Tax',
            admin: { description: 'Tax amount for this order' },
          },
        }),
        amountField({
          currenciesConfig,
          overrides: {
            name: 'discount',
            label: 'Discount',
            admin: { description: 'Discount amount for this order' },
          },
        }),
      ],
    },
    amountField({
      currenciesConfig,
      overrides: {
        name: 'grandTotal',
        label: 'Grand Total',
        admin: {
          description: 'Final total amount (subtotal + shipping + tax - discount) for this order',
        },
      },
    }),
  ],
}
