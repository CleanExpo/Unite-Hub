import type { Metadata } from "next"
import ServiceContactForm from "@/components/service-contact-form"

export const metadata: Metadata = {
  title: "Digital Marketing Services Contact | UNITE Group",
  description: "Get in touch with our digital marketing team to boost your online presence.",
}

export default function DigitalMarketingContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Our Digital Marketing Team</h1>
        <p className="text-center mb-8 text-gray-600">
          Fill out the form below to discuss your digital marketing needs. We'll create a customized strategy to help
          you reach your goals.
        </p>

        <ServiceContactForm
          serviceName="Digital Marketing"
          serviceOptions={[
            "Search Engine Marketing (SEM)",
            "Social Media Marketing",
            "Email Marketing",
            "Content Marketing",
            "Pay-Per-Click (PPC) Advertising",
            "Comprehensive Digital Marketing Strategy",
          ]}
          additionalFields={[
            {
              name: "currentMarketing",
              label: "Are you currently doing any digital marketing?",
              type: "select",
              options: ["Yes", "No"],
            },
            {
              name: "targetAudience",
              label: "Who is your target audience?",
              type: "textarea",
            },
            {
              name: "marketingGoals",
              label: "What are your primary marketing goals?",
              type: "textarea",
            },
          ]}
        />
      </div>
    </div>
  )
}
