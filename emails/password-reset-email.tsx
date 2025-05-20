import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components"
import { Tailwind } from "@react-email/tailwind"

interface PasswordResetEmailProps {
  userEmail: string
  resetUrl: string
}

export const PasswordResetEmail = ({
  userEmail = "user@example.com",
  resetUrl = "https://unitegroup.com/reset-password?token=123",
}: PasswordResetEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Reset your password for UNITE Group</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-[#001428] text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              <strong>Reset Your Password</strong>
            </Heading>
            <Text className="text-[#666666] text-[14px] leading-[24px]">Hello,</Text>
            <Text className="text-[#666666] text-[14px] leading-[24px]">
              We received a request to reset the password for your account ({userEmail}). If you didn't make this
              request, you can safely ignore this email.
            </Text>
            <Text className="text-[#666666] text-[14px] leading-[24px]">
              To reset your password, click the button below:
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#4ecdc4] rounded text-white text-[12px] font-semibold no-underline text-center px-[20px] py-[12px]"
                href={resetUrl}
              >
                Reset Password
              </Button>
            </Section>
            <Text className="text-[#666666] text-[14px] leading-[24px]">
              This password reset link will expire in 1 hour for security reasons.
            </Text>
            <Text className="text-[#666666] text-[14px] leading-[24px]">
              If the button above doesn't work, copy and paste this URL into your browser:
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px] break-all">{resetUrl}</Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-[#666666] text-[12px] leading-[24px]">
              © {new Date().getFullYear()} UNITE Group. All rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default PasswordResetEmail
