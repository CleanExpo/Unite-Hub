import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "About UNITE Group | Our Story, Values & Team",
  description:
    "Learn about UNITE Group's mission, values, and the team behind our success. United in vision. Independent in spirit.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/about`,
    title: "About UNITE Group | Our Story, Values & Team",
    description:
      "Learn about UNITE Group's mission, values, and the team behind our success. United in vision. Independent in spirit.",
    images: [
      {
        url: `${siteUrl}/og-about.png`,
        width: 1200,
        height: 630,
        alt: "About UNITE Group",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About UNITE Group | Our Story, Values & Team",
    description:
      "Learn about UNITE Group's mission, values, and the team behind our success. United in vision. Independent in spirit.",
    images: [`${siteUrl}/og-about.png`],
  },
}

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">About UNITE Group</h1>
                <p className="text-xl text-[#4ecdc4]/90 mb-6">United in vision. Independent in spirit.</p>
                <p className="text-gray-300 mb-6">
                  At UNITE Group, we believe in the power of collaboration and innovation. Our team of experts works
                  together to deliver exceptional results while maintaining the independent thinking that drives
                  creativity and problem-solving.
                </p>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  Our Services
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/logo-large.png"
                  alt="UNITE Group Logo"
                  width={500}
                  height={500}
                  className="mx-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto py-10">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Our Mission</h2>
            <p className="text-gray-700">
              Our mission is to provide high-quality, innovative solutions to our clients. We strive to optimise their
              processes and help them achieve their business goals. We are a leading organisation in our field,
              dedicated to excellence and customer satisfaction.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Our Values</h2>
            <ul className="list-disc list-inside text-gray-700">
              <li>Integrity: We operate with honesty and transparency in all our dealings.</li>
              <li>Innovation: We constantly seek new and better ways to serve our clients.</li>
              <li>Collaboration: We work together as a team to achieve common goals.</li>
              <li>Excellence: We are committed to delivering the highest quality results.</li>
            </ul>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Our Team</h2>
            <p className="text-gray-700">
              We have a team of experienced professionals with diverse backgrounds and expertise. Our team is passionate
              about what they do and dedicated to providing exceptional service. We offer a comprehensive training
              programme to ensure our team stays at the forefront of industry best practices.
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-3">Our Products</h2>
            <p className="text-gray-700">
              We offer a wide range of products designed to meet the needs of our clients. Our products are made with
              high-quality materials and are built to last. We also offer customisation options to tailor our products
              to your specific requirements. We use advanced fibre technology in our manufacturing processes.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Contact Us</h2>
            <p className="text-gray-700">
              If you have any questions or would like to learn more about our services, please don't hesitate to contact
              us.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
