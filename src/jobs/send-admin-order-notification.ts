// import type { TaskHandler } from 'payload'
// import { render } from '@react-email/components'
// import { AdminOrderNotificationEmail } from '@/lib/emails/admin-order-notification'
// import { USER_ROLES } from '@/lib/constants'
// import { formatCurrency } from '@/utils/format-currency'

// export const sendAdminOrderNotificationTask: TaskHandler<'sendAdminOrderNotification'> = async ({
//   input,
//   req,
// }) => {
//   const { orderId } = input

//   try {
//     req.payload.logger.info(`Starting admin order notification job for order #${orderId}`)

//     // Fetch the order with populated relations
//     const order = await req.payload.findByID({
//       collection: 'orders',
//       id: orderId,
//       depth: 2,
//     })

//     if (!order) {
//       throw new Error(`Order #${orderId} not found`)
//     }

//     // Query all users with admin or order-manager roles
//     const staffUsers = await req.payload.find({
//       collection: 'users',
//       where: {
//         roles: {
//           in: [USER_ROLES.ADMIN, USER_ROLES.ORDER_MANAGER],
//         },
//       },
//       select: {
//         email: true,
//         name: true,
//         roles: true,
//       },
//       limit: 0, // Fetch all matching users
//     })

//     if (!staffUsers.docs || staffUsers.docs.length === 0) {
//       req.payload.logger.warn('No admin or order manager users found to send notifications')
//       throw new Error('No staff users found for admin order notification')
//     }

//     req.payload.logger.info(
//       `Found ${staffUsers.docs.length} staff members to notify for order #${orderId}`,
//     )

//     // Render the email template
//     const emailHtml = await render(AdminOrderNotificationEmail({ order }))

//     // Send email to each staff member
//     const emailPromises = staffUsers.docs.map(async (user) => {
//       try {
//         await req.payload.sendEmail({
//           to: user.email,
//           subject: `New Order #${order.id} - ${formatCurrency(order.grandTotal)} - Drip Fashion`,
//           html: emailHtml,
//         })

//         req.payload.logger.info(
//           `Admin notification email sent to ${user.email} for order #${orderId}`,
//         )
//       } catch (error) {
//         req.payload.logger.error(
//           error,
//           `Failed to send admin notification to ${user.email} for order #${orderId}`,
//         )
//         // Don't throw here - we want to continue sending to other staff members
//       }
//     })

//     // Wait for all emails to be sent
//     await Promise.all(emailPromises)

//     req.payload.logger.info(
//       `Admin order notification job completed for order #${orderId}. Sent to ${staffUsers.docs.length} recipients.`,
//     )

//     return {
//       output: {
//         notifiedCount: staffUsers.docs.length,
//         emails: staffUsers.docs.map((user) => user.email),
//         orderId: order.id,
//       },
//     }
//   } catch (error) {
//     req.payload.logger.error(error, `Error in admin order notification job for order #${orderId}`)
//     throw new Error(`Admin order notification job failed for order #${orderId}`)
//   }
// }
