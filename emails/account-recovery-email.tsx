import { Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from "@react-email/components"
import { Tailwind } from "@react-email/tailwind"

interface AccountRecoveryEmailProps {
  username?: string
  resetLink?: string
  recoveryMethod?: string
  verificationCode?: string
}

export const AccountRecoveryEmail = ({
  username = "User",
  resetLink = "https://unitegroup.com.au/auth/reset-password?token=123456789",
  recoveryMethod = "email",
  verificationCode,
}: AccountRecoveryEmailProps) => {
  const previewText = `Recover your UNITE Group account`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Section className="mt-[32px]">
              <Heading className="text-[#333] text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                Account Recovery
              </Heading>
            </Section>
            <Text className="text-[#333] text-[14px] leading-[24px]">Hello {username},</Text>
            <Text className="text-[#333] text-[14px] leading-[24px]">
              We received a request to recover your UNITE Group account using your {recoveryMethod}.
            </Text>

            {verificationCode ? (
              <Section className="text-center mt-[32px] mb-[32px]">
                <Text className="text-[#333] text-[14px] leading-[24px]">
                  Please use the following verification code to continue the recovery process:
                </Text>
                <Text className="text-[#333] text-[24px] font-bold tracking-wide my-4">{verificationCode}</Text>
                <Text className="text-[#666] text-[12px] leading-[24px]">
                  This code will expire in 15 minutes for security reasons.
                </Text>
              </Section>
            ) : (
              <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                  className="bg-[#4ecdc4] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                  href={resetLink}
                >
                  Reset Your Password
                </Button>
              </Section>
            )}

            <Text className="text-[#333] text-[14px] leading-[24px]">
              If you didn't request this recovery, you can safely ignore this email. Your account security is important
              to us.
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666] text-[12px] leading-[24px]">
              If you're having trouble clicking the button, copy and paste the URL below into your web browser:
            </Text>
            <Text className="text-[#666] text-[12px] leading-[24px]">
              <Link href={resetLink} className="text-blue-600 no-underline">
                {resetLink}
              </Link>
            </Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-[#666] text-[12px] leading-[24px] text-center">
              © {new Date().getFullYear()} UNITE Group, All Rights Reserved
              <br />
              Sydney, Australia
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default AccountRecoveryEmail
