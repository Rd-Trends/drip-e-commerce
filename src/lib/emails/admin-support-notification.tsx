import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import tailwindConfig from './tailwind.config'
import { formatDateTime } from '@/utils/format-date-time'

interface AdminSupportNotificationEmailProps {
  emailId: string
  from: string
  subject: string
  to: string[]
  receivedAt: string
  hasAttachments?: boolean
  attachmentCount?: number
}

// Dummy data for preview purposes
const dummyData: AdminSupportNotificationEmailProps = {
  emailId: '56761188-7520-42d8-8898-ff6fc54ce618',
  from: 'customer@example.com',
  subject: 'Question about order #ORD-2026-001234',
  to: ['support@drip.ng'],
  receivedAt: new Date('2026-01-19T10:30:00Z').toISOString(),
  hasAttachments: true,
  attachmentCount: 2,
}

export const AdminSupportNotificationEmail = ({
  emailId = dummyData.emailId,
  from = dummyData.from,
  subject = dummyData.subject,
  to = dummyData.to,
  receivedAt = dummyData.receivedAt,
  hasAttachments = dummyData.hasAttachments,
  attachmentCount = dummyData.attachmentCount,
}: AdminSupportNotificationEmailProps) => {
  const resendEmailUrl = `https://resend.com/emails/${emailId}`
  const formattedDate = formatDateTime({ date: receivedAt, format: 'MMMM dd, yyyy HH:mm' })

  return (
    <Html>
      <Head />
      <Preview>New support email received from {from}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="mx-auto my-auto bg-muted font-sans">
          <Container className="mx-auto my-0 sm:my-10 max-w-150 border-0 sm:border border-border bg-background p-5">
            {/* Header */}
            <Section className="mt-8">
              <Heading className="mx-0 my-7.5 p-0 text-center text-[24px] font-bold text-foreground">
                🎧 New Support Email Received
              </Heading>
            </Section>

            {/* Main Content */}
            <Section className="my-8">
              <Text className="text-sm leading-6 text-muted-foreground">
                A new support email has been received and is awaiting your review.
              </Text>

              {/* Email Details */}
              <Section className="my-6 rounded-md bg-muted p-4">
                <Text className="m-0 mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email Details
                </Text>

                <div className="space-y-2">
                  <Text className="m-0 text-sm leading-5 text-foreground">
                    <span className="font-semibold">From:</span> {from}
                  </Text>
                  <Text className="m-0 text-sm leading-5 text-foreground">
                    <span className="font-semibold">To:</span> {to.join(', ')}
                  </Text>
                  <Text className="m-0 text-sm leading-5 text-foreground">
                    <span className="font-semibold">Subject:</span> {subject}
                  </Text>
                  <Text className="m-0 text-sm leading-5 text-foreground">
                    <span className="font-semibold">Received:</span> {formattedDate}
                  </Text>
                  {hasAttachments && (
                    <Text className="m-0 text-sm leading-5 text-foreground">
                      <span className="font-semibold">Attachments:</span> {attachmentCount}{' '}
                      {attachmentCount === 1 ? 'file' : 'files'}
                    </Text>
                  )}
                </div>
              </Section>

              {/* Call to Action */}
              <Section className="my-8 text-center">
                <Button
                  href={resendEmailUrl}
                  className="rounded-md bg-primary px-5 py-3 text-center text-sm font-semibold text-primary-foreground no-underline"
                >
                  View Email in Resend
                </Button>
              </Section>

              <Text className="text-xs leading-5 text-muted-foreground">
                Or copy and paste this URL into your browser:{' '}
                <Link href={resendEmailUrl} className="text-primary no-underline">
                  {resendEmailUrl}
                </Link>
              </Text>
            </Section>

            <Hr className="mx-0 my-6.5 w-full border border-solid border-border" />

            {/* Footer */}
            <Section>
              <Text className="text-xs leading-5 text-muted-foreground">
                This is an automated notification from Drip Fashion&apos;s support system. Please review
                and respond to the customer inquiry as soon as possible.
              </Text>
              <Text className="text-xs leading-5 text-muted-foreground">
                Email ID: <code className="rounded bg-muted px-1 py-0.5">{emailId}</code>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default AdminSupportNotificationEmail
