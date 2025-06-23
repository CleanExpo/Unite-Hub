"use server"

import * as z from "zod"

const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  serviceInterestedIn: z.string().min(1, "Please select a service"),
  budgetRange: z.string().min(1, "Please select a budget range"),
  projectTimeline: z.enum(["ASAP", "1-3 months", "3-6 months", "6+ months"]),
  projectDescription: z.string().min(10, "Project description is too short"),
})

export async function submitContactForm(prevState: { message: string; success?: boolean } | null, formData: FormData) {
  try {
    const data = Object.fromEntries(formData.entries())
    const validatedFields = contactFormSchema.safeParse(data)

    if (!validatedFields.success) {
      console.error("Form validation failed:", validatedFields.error.flatten().fieldErrors)
      return {
        message: "Validation Error: Please check the form fields.",
        errors: validatedFields.error.flatten().fieldErrors,
        success: false,
      }
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      company,
      serviceInterestedIn,
      budgetRange,
      projectTimeline,
      projectDescription,
    } = validatedFields.data

    // Simulate sending an email
    console.log("---- Simulating Sending Email to Admin ----")
    const emailSubject = `New Project Inquiry - ${company || `${firstName} ${lastName}`} - ${serviceInterestedIn}`
    const emailBody = `
----------------------------------------------------
**New Project Inquiry Received - Unite Group**
----------------------------------------------------

A new project inquiry has been submitted through the website contact form.

**Contact Details:**
  - **Full Name:** ${firstName} ${lastName}
  - **Email:** ${email}
  - **Phone:** ${phone || "Not provided"}
  - **Company:** ${company || "Not provided"}

**Project Details:**
  - **Service Interested In:** ${serviceInterestedIn}
  - **Budget Range:** ${budgetRange}
  - **Project Timeline:** ${projectTimeline}

**Project Description:**
  ${projectDescription}

----------------------------------------------------
**Next Steps:**
  1. Review the provided information thoroughly.
  2. Contact the prospect within 24 business hours to schedule an initial consultation.
  3. Prepare for a productive discussion based on their stated needs.
----------------------------------------------------

This is an automated notification. Please do not reply directly to this email.
`
    console.log("Subject:", emailSubject)
    console.log("Body:", emailBody)
    console.log("---- Email Simulation End ----")

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    return {
      message: "Thank you! Your message has been sent successfully. We'll be in touch within 24 business hours.",
      success: true,
    }
  } catch (error) {
    console.error("Error submitting contact form:", error)
    return {
      message: "An unexpected error occurred. Please try again later or contact us directly via email.",
      success: false,
    }
  }
}
