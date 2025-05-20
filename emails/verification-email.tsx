import { Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text } from "@react-email/components"
import { Tailwind } from "@react-email/tailwind"

interface VerificationEmailProps {
  userEmail: string
  verificationUrl: string
}

export const VerificationEmail = ({
  userEmail = "user@example.com",
  verificationUrl = "https://unitegroup.com/verify?token=123",
}: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for UNITE Group</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] w-[465px]">
            <Heading className="text-[#001428] text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              <strong>Verify your email address</strong>
            </Heading>
            <Text className="text-[#666666] text-[14px] leading-[24px]">Hello,</Text>
            <Text className="text-[#666666] text-[14px] leading-[24px]">
              Thank you for signing up with UNITE Group. To complete your registration and verify your email address (
              {userEmail}), please click the button below:
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#4ecdc4] rounded text-white text-[12px] font-semibold no-underline text-center px-[20px] py-[12px]"
                href={verificationUrl}
              >
                Verify Email Address
              </Button>
            </Section>
            <Text className="text-[#666666] text-[14px] leading-[24px]">
              If you did not create an account with UNITE Group, you can safely ignore this email.
            </Text>
            <Text className="text-[#666666] text-[14px] leading-[24px]">
              If the button above doesn't work, copy and paste this URL into your browser:
            </Text>
            <Text className="text-[#666666] text-[12px] leading-[24px] break-all">{verificationUrl}</Text>
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

export default VerificationEmail
