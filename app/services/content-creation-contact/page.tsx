import type { Metadata } from "next"
import ServiceContactForm from "@/components/service-contact-form"

export const metadata: Metadata = {
  title: "Content Creation Services Contact | UNITE Group",
  description: "Get in touch with our content creation team to produce engaging content for your audience.",
}

export default function ContentCreationContactPage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Contact Our Content Creation Team</h1>
        <p className="text-center mb-8 text-gray-600">
          Fill out the form below to discuss your content creation needs. We create engaging content that resonates with
          your audience.
        </p>

        <ServiceContactForm
          serviceName="Content Creation"
          serviceOptions={[
            "Blog Posts & Articles",
            "Social Media Content",
            "Video Production",
            "Infographics & Visual Content",
            "Podcasts",
            "Email Newsletters",
            "Comprehensive Content Strategy",
          ]}
          additionalFields={[
            {
              name: "contentTypes",
              label: "What types of content are you interested in?",
              type: "textarea",
            },
            {
              name: "contentFrequency",
              label: "How frequently do you need new content?",
              type: "select",
              options: ["Weekly", "Bi-weekly", "Monthly", "Quarterly", "One-time project"],
            },
            {
              name: "contentGoals",
              label: "What are your content marketing goals?",
              type: "textarea",
            },
          ]}
        />
      </div>
    </div>
  )
}
