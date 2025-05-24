import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Code, Search, Users, CheckCircle } from "lucide-react"

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Our <span className="text-[#64ffda]">Services</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300">
              Comprehensive solutions tailored to meet your business needs and drive growth through innovation and
              expertise.
            </p>
          </div>
        </div>
      </section>

      {/* Services Cards */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Software Development */}
            <Card className="bg-[#112240] border-[#1a2f55] hover:border-[#64ffda] transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="mb-4 w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center">
                  <Code className="h-6 w-6 text-[#64ffda]" />
                </div>
                <CardTitle className="text-2xl text-white">Software Development</CardTitle>
                <CardDescription className="text-gray-400">
                  Custom software solutions built with cutting-edge technologies
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-300">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Custom web & mobile applications</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Enterprise software solutions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>API development & integration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Cloud-based solutions</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full bg-[#0a192f] border border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f]"
                >
                  <Link href="/services/software-development">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* SEO Services */}
            <Card className="bg-[#112240] border-[#1a2f55] hover:border-[#64ffda] transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="mb-4 w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center">
                  <Search className="h-6 w-6 text-[#64ffda]" />
                </div>
                <CardTitle className="text-2xl text-white">SEO Services</CardTitle>
                <CardDescription className="text-gray-400">
                  Strategic optimization to improve your online visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-300">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Comprehensive SEO audits</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>On-page & off-page optimization</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Content strategy & creation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Local SEO & Google Business Profile</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full bg-[#0a192f] border border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f]"
                >
                  <Link href="/services/seo-services">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Expert Education */}
            <Card className="bg-[#112240] border-[#1a2f55] hover:border-[#64ffda] transition-all duration-300">
              <CardHeader className="pb-3">
                <div className="mb-4 w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-[#64ffda]" />
                </div>
                <CardTitle className="text-2xl text-white">Expert Education</CardTitle>
                <CardDescription className="text-gray-400">
                  Professional training programs to upskill your team
                </CardDescription>
              </CardHeader>
              <CardContent className="text-gray-300">
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Technical skills workshops</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Leadership & management training</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Customized learning programs</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-5 w-5 text-[#64ffda] shrink-0 mt-0.5" />
                    <span>Digital transformation training</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className="w-full bg-[#0a192f] border border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f]"
                >
                  <Link href="/services/expert-education">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#0a192f]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Approach</h2>
            <p className="mt-4 text-lg text-gray-300">
              We follow a proven methodology to ensure successful outcomes for every project
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Discovery</h3>
              <p className="text-gray-300">
                We begin by understanding your business, goals, challenges, and requirements in detail.
              </p>
              <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Strategy</h3>
              <p className="text-gray-300">
                We develop a tailored strategy and roadmap to achieve your objectives effectively.
              </p>
              <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Implementation</h3>
              <p className="text-gray-300">
                Our expert team executes the strategy with precision, regular updates, and quality assurance.
              </p>
              <div className="hidden md:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Optimization</h3>
              <p className="text-gray-300">
                We continuously monitor, analyze, and refine our approach to maximize results and ROI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Get Started?</h2>
          <p className="mt-4 text-lg text-gray-300">
            Contact us today to discuss how our services can help your business grow and succeed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-8 py-3 text-lg">
              <Link href="/contact">
                Contact Us
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-8 py-3 text-lg"
            >
              <Link href="/about">Learn About Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
