import type { Metadata } from "next"
import ServiceContactForm from "@/components/service-contact-form"

export const metadata: Metadata = {
  title: "Consulting Services Contact | UNITE Group",
  description: "Get in touch with our consulting team to help you achieve your business goals.",
}

export default function ConsultingContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Our Consulting Team</h1>
        <p className="text-center mb-8 text-gray-600">
          Fill out the form below to discuss your consulting needs. Our expert consultants will help you achieve your
          business goals.
        </p>

        <ServiceContactForm
          serviceName="Consulting"
          serviceOptions={[
            "Business Strategy",
            "Digital Transformation",
            "Process Optimization",
            "Market Research",
            "Growth Strategy",
            "Technology Consulting",
            "Custom Consulting Solution",
          ]}
          additionalFields={[
            {
              name: "businessChallenges",
              label: "What are the main challenges your business is facing?",
              type: "textarea",
              required: true,
            },
            {
              name: "consultingGoals",
              label: "What are your primary goals for this consulting engagement?",
              type: "textarea",
            },
            {
              name: "timeline",
              label: "What is your expected timeline for this project?",
              type: "select",
              options: ["1-3 months", "3-6 months", "6-12 months", "Ongoing support"],
            },
            {
              name: "teamSize",
              label: "How many employees are in your organization?",
              type: "select",
              options: ["1-10", "11-50", "51-200", "201-500", "500+"],
            },
          ]}
        />
      </div>
    </div>
  )
}
