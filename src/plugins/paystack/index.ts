import {
  PaymentAdapter,
  PaymentAdapterArgs,
  PaymentAdapterClient,
} from '@payloadcms/plugin-ecommerce/types'
import { confirmOrder } from './confirm-order'
import { initiatePayment } from './initiate-payment'

type Props = {
  secretKey: string
} & PaymentAdapterArgs

export const paystackAdapter: (props: Props) => PaymentAdapter = (_) => {
  return {
    initiatePayment: initiatePayment,
    confirmOrder: confirmOrder,
    name: 'paystack',
    label: 'Paystack',
    group: {
      name: 'paystack',
      type: 'group',
      admin: {
        condition: (data) => {
          const path = 'paymentMethod'

          return data?.[path] === 'paystack'
        },
      },
      fields: [
        {
          name: 'customerId',
          type: 'number',
          label: 'Paystack Customer ID',
        },
        {
          name: 'reference',
          type: 'text',
          label: 'Paystack Payment Reference',
        },
      ],
    },
  }
}

export const paystackAdapterClient: PaymentAdapterClient = {
  name: 'paystack',
  confirmOrder: true,
  initiatePayment: true,
  label: 'Paystack',
}
