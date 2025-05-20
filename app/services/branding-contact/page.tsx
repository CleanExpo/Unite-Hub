import type { Metadata } from "next"
import ServiceContactForm from "@/components/service-contact-form"

export const metadata: Metadata = {
  title: "Branding Services Contact | UNITE Group",
  description: "Get in touch with our branding team to create a strong brand identity for your business.",
}

export default function BrandingContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Our Branding Team</h1>
        <p className="text-center mb-8 text-gray-600">
          Fill out the form below to discuss your branding needs. We'll help you create a strong brand identity that
          resonates with your target audience.
        </p>

        <ServiceContactForm
          serviceName="Branding"
          serviceOptions={[
            "Brand Strategy",
            "Logo Design",
            "Visual Identity System",
            "Brand Guidelines",
            "Brand Messaging",
            "Rebranding",
            "Brand Audit",
          ]}
          additionalFields={[
            {
              name: "existingBrand",
              label: "Do you have an existing brand?",
              type: "select",
              options: ["Yes", "No", "Yes, but needs refreshing"],
            },
            {
              name: "brandValues",
              label: "What are your core brand values?",
              type: "textarea",
            },
            {
              name: "targetAudience",
              label: "Who is your target audience?",
              type: "textarea",
            },
            {
              name: "brandInspiration",
              label: "Any brands you admire or want to emulate?",
              type: "textarea",
            },
          ]}
        />
      </div>
    </div>
  )
}
