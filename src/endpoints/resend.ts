import { USER_ROLES } from '@/lib/constants'
import { Endpoint } from 'payload'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import { AdminSupportNotificationEmail } from '@/lib/emails/admin-support-notification'

export const resendWebhook: Endpoint['handler'] = async (req) => {
  try {
    const stringifiedData = (await req.text?.()) || ''

    const resend = new Resend(process.env.RESEND_API_KEY!)

    // Throws an error if the webhook is invalid
    // Otherwise, returns the parsed payload object
    const event = resend.webhooks.verify({
      payload: stringifiedData,
      headers: {
        id: req.headers.get('svix-id')!,
        timestamp: req.headers.get('svix-timestamp')!,
        signature: req.headers.get('svix-signature')!,
      },
      webhookSecret: process.env.RESEND_WEBHOOK_SECRET!,
    })

    if (event.type === 'email.received') {
      const { email_id, from, subject, to, created_at, attachments } = event.data

      // Fetch all admin users to notify
      const userDocs = await req.payload.find({
        collection: 'users',
        where: {
          roles: {
            in: [USER_ROLES.ADMIN],
          },
        },
        select: {
          email: true,
          name: true,
        },
      })

      if (!userDocs.docs.length) {
        req.payload.logger.error('No admin users found for support email notification.')
        // return 200 OK to avoid retries
        return new Response('No admin users found', { status: 200 })
      }

      // Prepare email notification HTML
      const notificationHtml = await render(
        AdminSupportNotificationEmail({
          emailId: email_id,
          from,
          subject,
          to,
          receivedAt: created_at,
          hasAttachments: attachments && attachments.length > 0,
          attachmentCount: attachments?.length || 0,
        }),
      )

      const emailFromAddress = process.env.EMAIL_FROM_ADDRESS || 'drip-fashion@drip.ng'
      const emailFromName = process.env.EMAIL_FROM_NAME || 'Drip Fashion'

      // Send notification to all admins
      await resend.batch.send(
        userDocs.docs.map((admin) => ({
          to: admin.email,
          from: `${emailFromName} <${emailFromAddress}>`,
          subject: `🎧 New Support Email: ${subject}`,
          html: notificationHtml,
        })),
      )

      req.payload.logger.info(
        `Support email notification sent to ${userDocs.docs.length} admin(s) for email ${email_id}`,
      )
    }

    // Return success response for all webhook events
    return new Response('Webhook processed', { status: 200 })
  } catch (error) {
    req.payload.logger.error(error, 'Error processing resend webhook')
    return new Response('Invalid webhook', { status: 400 })
  }
}
