import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'
import tailwindConfig from './tailwind.config'

interface ForgotPasswordEmailProps {
  userName?: string
  resetPasswordLink?: string
  isCustomerReset?: boolean
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export const ForgotPasswordEmail = ({
  userName,
  resetPasswordLink,
  isCustomerReset,
}: ForgotPasswordEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind config={tailwindConfig}>
        <Body className="bg-[#f6f9fc] py-2.5 font-sans">
          <Preview>
            {isCustomerReset
              ? 'Reset your Drip E-Commerce password'
              : 'Reset your Drip E-Commerce admin password'}
          </Preview>
          <Container className="bg-white border border-solid border-border rounded-lg p-11.25 max-w-150 mx-auto my-10">
            <Img
              src={`${baseUrl}/logo.png`}
              width="120"
              height="40"
              alt="Drip E-Commerce"
              className="mb-8"
            />
            <Section>
              <Text className="text-base text-foreground leading-6.5 mb-4">
                Hi {userName || 'there'},
              </Text>
              <Text className="text-base text-foreground leading-6.5 mb-4">
                {isCustomerReset
                  ? 'Someone recently requested a password reset for your Drip E-Commerce account. If this was you, you can set a new password by clicking the button below:'
                  : 'A password reset has been requested for your Drip E-Commerce admin account. If this was you, you can set a new password by clicking the button below:'}
              </Text>
              <Button
                className="bg-primary rounded text-primary-foreground text-[15px] no-underline text-center block w-full max-w-52.5 py-3.5 px-1.75 font-medium my-6"
                href={resetPasswordLink}
              >
                Reset Password
              </Button>
              <Text className="text-base text-foreground leading-6.5 mb-4">
                {isCustomerReset
                  ? "If you don't want to change your password or didn't request this, just ignore and delete this message."
                  : "If you didn't request this password reset, please contact the system administrator immediately as this may indicate unauthorized access to your admin account."}
              </Text>
              <Text className="text-base text-muted-foreground leading-6.5 mb-4">
                For security reasons, this link will expire in 24 hours.
              </Text>
              <Text className="text-base text-foreground leading-6.5 mb-4">
                {isCustomerReset
                  ? "To keep your account secure, please don't forward this email to anyone."
                  : "As an administrator, please ensure you're the only one with access to this email and do not share this link with anyone."}
              </Text>
              <Text className="text-base text-foreground leading-6.5">
                Thanks,
                <br />
                The Drip E-Commerce Team
              </Text>
            </Section>
            <Section className="mt-8 pt-8 border-t border-border">
              <Text className="text-sm text-muted-foreground leading-5.5 text-center">
                If you&apos;re having trouble clicking the button, copy and paste the URL below into
                your web browser:
              </Text>
              <Link
                className="text-sm text-primary underline break-all block text-center mt-2"
                href={resetPasswordLink}
              >
                {resetPasswordLink}
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
