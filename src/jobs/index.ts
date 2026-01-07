import { JobsConfig } from 'payload'
import { sendAdminOrderNotificationTask } from './send-admin-order-notification'

export const jobs: JobsConfig = {
  tasks: [
    {
      slug: 'sendAdminOrderNotification',
      handler: sendAdminOrderNotificationTask,
      inputSchema: [
        {
          name: 'orderId',
          type: 'number',
          required: true,
        },
      ],
      interfaceName: 'AdminOrderNotificationTask',
      label: 'Send Admin Order Notification',
    },
  ],
}
