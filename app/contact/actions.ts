"use server"

import * as z from "zod"
import { Resend } from 'resend'

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

    // Get the FROM_EMAIL from environment variable
    const fromEmail = process.env.FROM_EMAIL as string
    
    if (!fromEmail) {
      console.error("FROM_EMAIL environment variable is not set")
      return {
        message: "Email configuration error. Please contact us directly.",
        success: false,
      }
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY)

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY environment variable is not set")
      return {
        message: "Email service configuration error. Please contact us directly.",
        success: false,
      }
    }

    // Prepare email content
    const emailSubject = `New Project Inquiry - ${company || `${firstName} ${lastName}`} - ${serviceInterestedIn}`
    
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Project Inquiry - Unite Group</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
        .section { margin-bottom: 25px; }
        .section h3 { color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; margin-bottom: 15px; }
        .field { margin-bottom: 10px; }
        .field strong { color: #1e293b; }
        .project-description { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #3b82f6; margin-top: 10px; }
        .next-steps { background: #dbeafe; padding: 20px; border-radius: 5px; border-left: 4px solid #3b82f6; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 New Project Inquiry</h1>
        <p>Unite Group Website Contact Form</p>
    </div>
    
    <div class="content">
        <div class="section">
            <h3>📞 Contact Details</h3>
            <div class="field"><strong>Full Name:</strong> ${firstName} ${lastName}</div>
            <div class="field"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></div>
            <div class="field"><strong>Phone:</strong> ${phone || "Not provided"}</div>
            <div class="field"><strong>Company:</strong> ${company || "Not provided"}</div>
        </div>
        
        <div class="section">
            <h3>💼 Project Details</h3>
            <div class="field"><strong>Service Interested In:</strong> ${serviceInterestedIn}</div>
            <div class="field"><strong>Budget Range:</strong> ${budgetRange}</div>
            <div class="field"><strong>Project Timeline:</strong> ${projectTimeline}</div>
        </div>
        
        <div class="section">
            <h3>📝 Project Description</h3>
            <div class="project-description">${projectDescription.replace(/\n/g, '<br>')}</div>
        </div>
        
        <div class="next-steps">
            <h3>🎯 Next Steps</h3>
            <ol>
                <li>Review the provided information thoroughly</li>
                <li>Contact the prospect within 24 business hours to schedule an initial consultation</li>
                <li>Prepare for a productive discussion based on their stated needs</li>
            </ol>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from the Unite Group website contact form.</p>
            <p>Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>
    `
    // Send email using Resend
    try {
      const { data: emailData, error } = await resend.emails.send({
        from: `Unite Group Contact Form <${fromEmail}>`,
        to: [process.env.ADMIN_EMAIL || 'unitegroup.in@gmail.com'],
        subject: emailSubject,
        html: emailHtml,
      })

      if (error) {
        console.error("Resend email error:", error)
        return {
          message: "Your message was received but there was an issue sending the notification. We'll still review your inquiry.",
          success: false,
        }
      }

      return {
        message: "Thank you! Your message has been sent successfully. We'll be in touch within 24 business hours.",
        success: true,
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError)
      return {
        message: "Your message was received but there was an issue sending the notification. We'll still review your inquiry.",
        success: false,
      }
    }

  } catch (error) {
    console.error("Error submitting contact form:", error)
    return {
      message: "An unexpected error occurred. Please try again later or contact us directly via email.",
      success: false,
    }
  }
}
