import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, Download, Calendar, Award } from "lucide-react"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "CARSI Education & Training | UNITE Group",
  description:
    "UNITE Group offers CARSI-certified professional development courses with IICRC-approved continuing education credits for the cleaning and restoration industry.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/education`,
    title: "CARSI Education & Training | UNITE Group",
    description:
      "UNITE Group offers CARSI-certified professional development courses with IICRC-approved continuing education credits for the cleaning and restoration industry.",
    images: [
      {
        url: `${siteUrl}/og-education.png`,
        width: 1200,
        height: 630,
        alt: "CARSI Education by UNITE Group",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "CARSI Education & Training | UNITE Group",
    description:
      "UNITE Group offers CARSI-certified professional development courses with IICRC-approved continuing education credits for the cleaning and restoration industry.",
    images: [`${siteUrl}/og-education.png`],
  },
}

export default function EducationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  {/* Direct img tag with inline styles for maximum compatibility */}
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/CARSI%20images-4enOeAtKJxRp19qJlew0jidfKfoc1D.png"
                    alt="CARSI"
                    width="24"
                    height="24"
                    style={{ display: "inline-block" }}
                  />
                  <span className="text-white text-lg">CARSI - Cleaning and Restoration Science Institute</span>
                </div>

                {/* Rest of the content remains the same */}
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                  Professional Education for the Cleaning and Restoration Industry
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  UNITE Group, in partnership with CARSI, offers 24/7 access to industry-approved professional
                  development courses. Our online training is designed for cleaning and restoration professionals
                  looking to expand their skills while earning Continuing Education Credits (CECs). All courses are
                  IICRC-approved, ensuring high-quality education that meets industry standards.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/education/courses">
                    <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                      Browse Courses
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

              {/* Rest of the component remains the same */}
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <div className="relative bg-white rounded-lg overflow-hidden">
                  <img
                    src="/education-hero.png"
                    alt="Professional Education"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "auto",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#001428] to-transparent"></div>
        </section>

        {/* Rest of the sections remain the same */}
        {/* CARSI Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose CARSI Education</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#4ecdc4]/20 mb-4 mx-auto">
                  <Award className="h-6 w-6 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Industry-Recognized Certification</h3>
                <p className="text-gray-600 text-center">
                  All courses are IICRC-approved and provide valuable continuing education credits recognized throughout
                  the industry.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#4ecdc4]/20 mb-4 mx-auto">
                  <Calendar className="h-6 w-6 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Flexible Learning</h3>
                <p className="text-gray-600 text-center">
                  Access course materials 24/7 from any device, allowing you to learn at your own pace and on your own
                  schedule.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-[#4ecdc4]/20 mb-4 mx-auto">
                  <Download className="h-6 w-6 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-semibold text-center mb-3">Practical Resources</h3>
                <p className="text-gray-600 text-center">
                  Download valuable resources, templates, and guides that you can immediately apply to your restoration
                  projects.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Courses Section */}
        <section className="py-16">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Featured CARSI Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div style={{ height: "200px", position: "relative" }}>
                  <img
                    src="/course-water-damage.png"
                    alt="Water Damage Restoration"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Water Damage Restoration</h3>
                  <p className="text-gray-600 mb-4">
                    Learn the science and techniques behind effective water damage restoration, from initial assessment
                    to complete structural drying.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">8 CECs</span>
                    <Link
                      href="/education/courses/water-damage"
                      className="text-[#4ecdc4] hover:text-[#4ecdc4]/80 font-medium"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div style={{ height: "200px", position: "relative" }}>
                  <img
                    src="/course-fire-damage.png"
                    alt="Fire Damage Restoration"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Fire Damage Restoration</h3>
                  <p className="text-gray-600 mb-4">
                    Master the specialized techniques required for fire and smoke damage restoration, including odor
                    control and structural cleaning.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">6 CECs</span>
                    <Link
                      href="/education/courses/fire-damage"
                      className="text-[#4ecdc4] hover:text-[#4ecdc4]/80 font-medium"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div style={{ height: "200px", position: "relative" }}>
                  <img
                    src="/course-mold-remediation.png"
                    alt="Mold Remediation"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">Mold Remediation</h3>
                  <p className="text-gray-600 mb-4">
                    Develop expertise in identifying, containing, and remediating mold contamination while ensuring
                    occupant safety and preventing recurrence.
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium bg-blue-100 text-blue-800 py-1 px-2 rounded">7 CECs</span>
                    <Link
                      href="/education/courses/mold-remediation"
                      className="text-[#4ecdc4] hover:text-[#4ecdc4]/80 font-medium"
                    >
                      View Course
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center mt-12">
              <Link href="/education/courses">
                <Button className="bg-[#001428] hover:bg-[#001428]/90 text-white" size="lg">
                  View All Courses
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
