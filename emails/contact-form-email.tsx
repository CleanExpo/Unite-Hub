import type * as React from "react"
import { Html, Body, Head, Heading, Hr, Container, Preview, Section, Text } from "@react-email/components"

interface ContactFormEmailProps {
  name: string
  email: string
  phone?: string
  organisation?: string
  message: string
}

export const ContactFormEmail: React.FC<ContactFormEmailProps> = ({
  name,
  email,
  phone = "Not provided",
  organisation = "Not provided",
  message,
}) => {
  return (
    <Html>
      <Head />
      <Preview>New contact form submission from {name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Contact Form Submission</Heading>
          <Text style={text}>You received a new contact form submission from your website:</Text>

          <Section style={section}>
            <Text style={labelText}>Name:</Text>
            <Text style={valueText}>{name}</Text>
          </Section>

          <Section style={section}>
            <Text style={labelText}>Email:</Text>
            <Text style={valueText}>{email}</Text>
          </Section>

          <Section style={section}>
            <Text style={labelText}>Phone:</Text>
            <Text style={valueText}>{phone}</Text>
          </Section>

          <Section style={section}>
            <Text style={labelText}>Organisation:</Text>
            <Text style={valueText}>{organisation}</Text>
          </Section>

          <Section style={section}>
            <Text style={labelText}>Message:</Text>
            <Text style={valueText}>{message}</Text>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>This email was sent from the contact form on your website.</Text>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
}

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  borderRadius: "4px",
  border: "1px solid #eee",
  maxWidth: "600px",
}

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "30px 0",
  padding: "0",
  lineHeight: "1.5",
}

const text = {
  color: "#333",
  fontSize: "16px",
  margin: "0 0 20px",
  lineHeight: "1.5",
}

const section = {
  margin: "0 0 15px",
}

const labelText = {
  color: "#687087",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 5px",
}

const valueText = {
  color: "#111",
  fontSize: "16px",
  margin: "0 0 10px",
}

const hr = {
  borderColor: "#eee",
  margin: "30px 0",
}

const footer = {
  color: "#888888",
  fontSize: "12px",
  margin: "20px 0",
}
