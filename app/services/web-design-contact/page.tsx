import type { Metadata } from "next"
import ServiceContactForm from "@/components/service-contact-form"

export const metadata: Metadata = {
  title: "Web Design Services Contact | UNITE Group",
  description: "Get in touch with our web design team to discuss your project requirements.",
}

export default function WebDesignContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Our Web Design Team</h1>
        <p className="text-center mb-8 text-gray-600">
          Fill out the form below to discuss your web design project with our team. We'll get back to you within 24
          hours.
        </p>

        <ServiceContactForm
          serviceName="Web Design"
          serviceOptions={[
            "New Website Design",
            "Website Redesign",
            "E-commerce Website",
            "Landing Page",
            "Custom Web Application",
            "Other",
          ]}
          additionalFields={[
            {
              name: "currentWebsite",
              label: "Do you have an existing website?",
              type: "select",
              options: ["Yes", "No"],
            },
            {
              name: "websiteUrl",
              label: "If yes, please provide the URL",
              type: "text",
            },
            {
              name: "designPreferences",
              label: "Design preferences or examples of websites you like",
              type: "textarea",
            },
          ]}
        />
      </div>
    </div>
  )
}
