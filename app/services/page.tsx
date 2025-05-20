import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "Our Services | UNITE Group",
  description:
    "Comprehensive solutions designed to help your business grow and succeed in today's competitive landscape.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/services`,
    title: "Our Services | UNITE Group",
    description:
      "Comprehensive solutions designed to help your business grow and succeed in today's competitive landscape.",
    images: [
      {
        url: `${siteUrl}/og-services.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Services | UNITE Group",
    description:
      "Comprehensive solutions designed to help your business grow and succeed in today's competitive landscape.",
    images: [`${siteUrl}/og-services.png`],
  },
}

export default function ServicesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">Our Services</h1>
              <p className="text-xl text-[#4ecdc4]/90 mb-8">
                Comprehensive solutions designed to help your business grow and succeed in today's competitive
                landscape.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="#education">
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                    Education
                  </Button>
                </Link>
                <Link href="#credits">
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                    IICRC Credits
                  </Button>
                </Link>
                <Link href="#software">
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                    Software Development
                  </Button>
                </Link>
                <Link href="#seo">
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                    SEO
                  </Button>
                </Link>
                <Link href="#consulting">
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                    Consulting
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Service Card 1 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <img src="https://via.placeholder.com/600x400" alt="Service 1" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Web Design</h2>
                <p className="text-gray-600">
                  We offer professional web design services to help your organisation establish a strong online
                  presence. We customise our designs to meet your specific needs.
                </p>
                <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Learn More
                </button>
              </div>
            </div>

            {/* Service Card 2 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <img src="https://via.placeholder.com/600x400" alt="Service 2" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Digital Marketing</h2>
                <p className="text-gray-600">
                  Our digital marketing programme is designed to optimise your online visibility and drive targeted
                  traffic to your website.
                </p>
                <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Learn More
                </button>
              </div>
            </div>

            {/* Service Card 3 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <img src="https://via.placeholder.com/600x400" alt="Service 3" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Content Creation</h2>
                <p className="text-gray-600">
                  We create engaging and informative content that resonates with your audience and helps you achieve
                  your business goals.
                </p>
                <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Learn More
                </button>
              </div>
            </div>

            {/* Service Card 4 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <img src="https://via.placeholder.com/600x400" alt="Service 4" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">SEO Services</h2>
                <p className="text-gray-600">
                  We optimise your website for search engines to improve your rankings and drive organic traffic.
                </p>
                <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Learn More
                </button>
              </div>
            </div>

            {/* Service Card 5 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <img src="https://via.placeholder.com/600x400" alt="Service 5" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Branding</h2>
                <p className="text-gray-600">
                  We help you create a strong brand identity that resonates with your target audience.
                </p>
                <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Learn More
                </button>
              </div>
            </div>

            {/* Service Card 6 */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <img src="https://via.placeholder.com/600x400" alt="Service 6" className="w-full h-48 object-cover" />
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Consulting</h2>
                <p className="text-gray-600">
                  We provide expert consulting services to help you achieve your business goals.
                </p>
                <button className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
