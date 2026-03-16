import { Endpoint } from 'payload'
import { getCustomerEmail } from '../shared/cart-helpers'
import { processOrderConfirmation } from './helpers'

export const confirmPaystackOrderHandler: Endpoint['handler'] = async (req) => {
  try {
    const data = await req.json?.()
    const user = req.user

    // Extract and validate customer email
    const customerEmail = getCustomerEmail(user, data?.customerEmail)

    // Validate payment reference
    const paymentReference = data?.reference as string
    if (!paymentReference) {
      return Response.json(
        {
          message: 'Payment reference is required',
        },
        {
          status: 400,
        },
      )
    }

    const confirmation = await processOrderConfirmation({
      reference: paymentReference,
      req,
      source: 'client',
      user,
      customerEmail,
    })

    return Response.json({
      message: 'Payment confirmed successfully',
      orderID: confirmation.orderID,
    })
  } catch (error) {
    req.payload.logger.error(error, 'Error confirming order.')

    return Response.json(
      {
        message: error instanceof Error ? error.message : 'Error confirming order.',
      },
      {
        status: 500,
      },
    )
  }
}
