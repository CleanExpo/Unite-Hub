import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, ArrowRight, Code, Search } from "lucide-react"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "UNITE Group - Expert-Led Education & Digital Services",
  description:
    "UNITE Group delivers expert-led education, innovative software development, and strategic SEO services to help your business thrive.",
  openGraph: {
    type: "website",
    url: `${siteUrl}`,
    title: "UNITE Group - Expert-Led Education & Digital Services",
    description:
      "UNITE Group delivers expert-led education, innovative software development, and strategic SEO services to help your business thrive.",
    images: [
      {
        url: `${siteUrl}/og-home.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group Homepage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UNITE Group - Expert-Led Education & Digital Services",
    description:
      "UNITE Group delivers expert-led education, innovative software development, and strategic SEO services to help your business thrive.",
    images: [`${siteUrl}/og-home.png`],
  },
}

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-20 md:py-28">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
                  Empowering Your Success Through Innovation
                </h1>
                <p className="text-xl text-[#4ecdc4]/90">
                  UNITE Group delivers expert-led education, innovative software development, and strategic SEO services
                  to help your business thrive.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/services">
                    <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                      Explore Our Services
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button
                      variant="outline"
                      className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
                      size="lg"
                    >
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <Image
                  src="/logo-large.png"
                  alt="UNITE Group Logo"
                  width={400}
                  height={400}
                  className="animate-pulse-slow"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-12 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Education with CARSI Logo */}
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 relative flex items-center justify-center">
                    {/* Using standard img tag with fallback */}
                    <img
                      src="/carsi-logo.png"
                      alt="CARSI - Cleaning and Restoration Science Institute"
                      style={{ maxWidth: "100%", maxHeight: "100%" }}
                      onError={(e) => {
                        // Fallback to a styled div if image fails to load
                        e.currentTarget.style.display = "none"
                        e.currentTarget.parentElement.innerHTML = `
                          <div style="width: 80px; height: 80px; background-color: #4ecdc4; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">C</div>
                        `
                      }}
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert-Led Education</h3>
                <p className="text-gray-600">
                  Upskill your workforce with CARSI-certified education programs, designed to meet the evolving demands
                  of the cleaning and restoration industry.
                </p>
                <Link
                  href="/education"
                  className="inline-flex items-center mt-4 text-[#4ecdc4] hover:text-[#4ecdc4]/80"
                >
                  Learn More
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* Software Development */}
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[#4ecdc4]/20 mb-4">
                  <Code className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Innovative Software Development</h3>
                <p className="text-gray-600">
                  Transform your ideas into reality with our bespoke software solutions, crafted for efficiency and
                  scalability.
                </p>
                <Link
                  href="/services/app-development"
                  className="inline-flex items-center mt-4 text-[#4ecdc4] hover:text-[#4ecdc4]/80"
                >
                  Explore Solutions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* SEO Services */}
              <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-[#4ecdc4]/20 mb-4">
                  <Search className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Strategic SEO Services</h3>
                <p className="text-gray-600">
                  Elevate your online presence with our data-driven SEO strategies, designed to drive traffic and
                  increase conversions.
                </p>
                <Link
                  href="/services/gmb-strategies"
                  className="inline-flex items-center mt-4 text-[#4ecdc4] hover:text-[#4ecdc4]/80"
                >
                  Boost Your Visibility
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
