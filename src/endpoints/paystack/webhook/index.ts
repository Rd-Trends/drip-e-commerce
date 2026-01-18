import { Endpoint } from 'payload'
import crypto from 'crypto'
import { processOrderConfirmation } from '../confirm/helpers'

export const paystackWebhookHandler: Endpoint['handler'] = async (req) => {
  try {
    const payload = req.payload
    const body = (await req.text?.()) || ''

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex')

    const signature = req.headers.get('x-paystack-signature')

    if (hash !== signature) {
      payload.logger.warn('Invalid Paystack webhook signature')
      return Response.json({ message: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(body)

    // Only process successful charge events
    if (event.event === 'charge.success') {
      const reference = event.data.reference

      if (!reference) {
        payload.logger.warn('Webhook received without payment reference')
        return Response.json({ message: 'No payment reference found' }, { status: 400 })
      }

      payload.logger.info(
        `Processing webhook for Paystack charge.success event, reference: ${reference}`,
      )

      try {
        // Process order confirmation with idempotency handling
        // The processOrderConfirmation function checks if transaction already has an order
        const result = await processOrderConfirmation({
          reference,
          req,
          source: 'webhook',
        })

        if (result.isNew) {
          payload.logger.info(
            `Order ${result.orderID} created successfully via webhook for reference ${reference}`,
          )
        } else {
          payload.logger.info(
            `Order ${result.orderID} already exists for reference ${reference} (idempotency check passed)`,
          )
        }

        return Response.json({
          message: 'Webhook processed successfully',
          orderID: result.orderID,
        })
      } catch (error) {
        payload.logger.error(error, `Error processing webhook for reference ${reference}`)

        // Return 200 to Paystack even on error to prevent retries for errors we can't recover from
        // Log the error for manual investigation
        return Response.json(
          {
            message: 'Webhook received but processing failed',
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          { status: 200 },
        )
      }
    }

    // Acknowledge other event types without processing
    payload.logger.info(`Webhook received for event type: ${event.event} (not processed)`)
    return Response.json({ message: 'Webhook received' })
  } catch (error) {
    req.payload.logger.error(error, 'Error processing webhook.')

    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Error processing webhook.',
      },
      {
        status: 500,
      },
    )
  }
}
