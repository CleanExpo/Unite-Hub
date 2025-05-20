import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "Education & Training | UNITE Group",
  description:
    "UNITE Group offers 24/7 access to industry-approved professional development courses with IICRC-approved continuing education credits.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/education`,
    title: "Education & Training | UNITE Group",
    description:
      "UNITE Group offers 24/7 access to industry-approved professional development courses with IICRC-approved continuing education credits.",
    images: [
      {
        url: `${siteUrl}/og-education.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group Education",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Education & Training | UNITE Group",
    description:
      "UNITE Group offers 24/7 access to industry-approved professional development courses with IICRC-approved continuing education credits.",
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
                <div className="inline-block bg-[#4ecdc4]/20 px-4 py-2 rounded-full mb-6">
                  <span className="text-[#4ecdc4] font-medium">Adult Education Centre</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                  UNITE: Bridging Science and Education in Professional Development
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  At UNITE Group, we offer 24/7 access to industry-approved professional development courses. Our online
                  training is designed for professionals looking to expand their skills while earning Continuing
                  Education Credits (CECs). Our courses are IICRC-approved, ensuring high-quality education that meets
                  industry standards.
                </p>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                  LEARN MORE
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/education-hero.png"
                  alt="Professional Education"
                  width={600}
                  height={400}
                  className="rounded-lg border border-[#4ecdc4]/30 relative"
                />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#001428] to-transparent"></div>
        </section>

        <div style={{ padding: "20px" }}>
          <h1 style={{ textAlign: "centre", marginBottom: "20px" }}>Education</h1>

          <section style={{ marginBottom: "30px" }}>
            <h2>University of Example</h2>
            <p>
              <strong>Degree:</strong> Bachelor of Science in Computer Science
            </p>
            <p>
              <strong>Dates:</strong> 2018 - 2022
            </p>
            <p>
              <strong>Description:</strong> A comprehensive programme covering data structures, algorithms, software
              engineering, and database management. The curriculum was designed to optimise problem-solving skills and
              prepare students for careers in the tech industry.
            </p>
          </section>

          <section style={{ marginBottom: "30px" }}>
            <h2>Coding Bootcamp</h2>
            <p>
              <strong>Organisation:</strong> Tech Academy
            </p>
            <p>
              <strong>Dates:</strong> Summer 2022
            </p>
            <p>
              <strong>Description:</strong> An intensive training programme focused on web development technologies,
              including React, Node.js, and MongoDB. The bootcamp helped me customise my skills and build full-stack
              applications.
            </p>
          </section>

          <section>
            <h2>Online Courses</h2>
            <ul>
              <li>
                <strong>Course:</strong> Advanced JavaScript Concepts
                <p>
                  <strong>Platform:</strong> Coursera
                </p>
              </li>
              <li>
                <strong>Course:</strong> Data Science with Python
                <p>
                  <strong>Platform:</strong> edX
                </p>
              </li>
              <li>
                <strong>Course:</strong> Introduction to Machine Learning
                <p>
                  <strong>Platform:</strong> Udacity
                </p>
              </li>
            </ul>
            <p>
              These courses have enhanced my understanding of modern technologies and allowed me to explore new areas of
              interest. I am particularly interested in the application of machine learning to solve real-world
              problems. The colour scheme of the course materials was also quite helpful for visual learning. I also
              learned about different types of optical fibre.
            </p>
          </section>

          <footer style={{ marginTop: "30px", textAlign: "centre", colour: "grey" }}>
            <p>© 2024 My Portfolio</p>
          </footer>
        </div>
      </main>
    </div>
  )
}
