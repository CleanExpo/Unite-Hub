import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "Contact Us | UNITE Group",
  description:
    "Get in touch with UNITE Group. We'd love to hear from you and discuss how our services can help your business.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/contact`,
    title: "Contact Us | UNITE Group",
    description:
      "Get in touch with UNITE Group. We'd love to hear from you and discuss how our services can help your business.",
    images: [
      {
        url: `${siteUrl}/og-contact.png`,
        width: 1200,
        height: 630,
        alt: "Contact UNITE Group",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | UNITE Group",
    description:
      "Get in touch with UNITE Group. We'd love to hear from you and discuss how our services can help your business.",
    images: [`${siteUrl}/og-contact.png`],
  },
}

export default function ContactPage() {
  // Replace these with your actual social media links
  const socialMediaLinks = {
    facebook: "https://www.facebook.com/updatedlink",
    twitter: "https://twitter.com/updatedlink",
    linkedin: "https://www.linkedin.com/updatedlink",
    instagram: "https://www.instagram.com/updatedlink",
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">Contact Us</h1>
              <p className="text-xl text-[#4ecdc4]/90 mb-6">We'd love to hear from you. Get in touch with our team.</p>
            </div>
          </div>
        </section>

        <div className="container mx-auto py-10">
          <p className="mb-4">
            We'd love to hear from you! Please use the form below to send us a message, or reach out to us on social
            media.
          </p>

          {/* Contact Form (replace with your actual form) */}
          <form className="max-w-lg">
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
                Name:
              </label>
              <input
                type="text"
                id="name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Your Name"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                Email:
              </label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Your Email"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">
                Message:
              </label>
              <textarea
                id="message"
                rows="4"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                placeholder="Your Message"
              ></textarea>
            </div>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Send
            </button>
          </form>

          {/* Social Media Links */}
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Connect with us on social media:</h2>
            <div className="flex space-x-4">
              <a href={socialMediaLinks.facebook} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
              <a href={socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer">
                Twitter
              </a>
              <a href={socialMediaLinks.linkedin} target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
              <a href={socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
