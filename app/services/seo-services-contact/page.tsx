import type { Metadata } from "next"
import ServiceContactForm from "@/components/service-contact-form"

export const metadata: Metadata = {
  title: "SEO Services Contact | UNITE Group",
  description: "Get in touch with our SEO team to improve your search engine rankings and drive organic traffic.",
}

export default function SeoServicesContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Our SEO Team</h1>
        <p className="text-center mb-8 text-gray-600">
          Fill out the form below to discuss your SEO needs. We'll help improve your search engine rankings and drive
          more organic traffic to your website.
        </p>

        <ServiceContactForm
          serviceName="SEO Services"
          serviceOptions={[
            "Technical SEO Audit",
            "On-Page SEO Optimization",
            "Off-Page SEO & Link Building",
            "Local SEO",
            "E-commerce SEO",
            "Content SEO Strategy",
            "Comprehensive SEO Package",
          ]}
          additionalFields={[
            {
              name: "websiteUrl",
              label: "Your website URL",
              type: "text",
              required: true,
            },
            {
              name: "currentRankings",
              label: "Are you currently ranking for any keywords?",
              type: "select",
              options: ["Yes", "No", "Not sure"],
            },
            {
              name: "targetKeywords",
              label: "What keywords or topics would you like to rank for?",
              type: "textarea",
            },
            {
              name: "competitors",
              label: "Who are your main competitors?",
              type: "textarea",
            },
          ]}
        />
      </div>
    </div>
  )
}
