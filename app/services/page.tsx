import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, GraduationCap, BarChart, Code, Search, Lightbulb, ArrowRight } from "lucide-react"

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

        {/* Education Service */}
        <section id="education" className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-6">
                  <GraduationCap className="h-10 w-10 text-[#4ecdc4]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Expert-Led Online Education</h2>
                <p className="text-gray-300 mb-4">
                  Our expert-led online education programs provide comprehensive, accessible learning experiences
                  designed to enhance your skills and knowledge in various fields.
                </p>
                <p className="text-gray-300 mb-6">
                  Whether you're looking to advance your career, expand your expertise, or stay current with industry
                  trends, our courses offer the flexibility and quality you need to succeed.
                </p>
                <h3 className="text-xl font-bold text-white mb-4">Key Features:</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Industry-leading instructors with real-world experience</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Interactive learning experiences with practical applications</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Flexible scheduling to fit your busy lifestyle</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Comprehensive course materials and resources</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Certificates of completion for all courses</span>
                  </li>
                </ul>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  Explore Our Courses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/education-service.png"
                  alt="Expert-Led Online Education"
                  width={600}
                  height={400}
                  className="rounded-lg border border-[#4ecdc4]/30 relative"
                />
              </div>
            </div>
          </div>
        </section>

        {/* IICRC Credits Service */}
        <section id="credits" className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/iicrc-credits.png"
                  alt="IICRC Continuing Education Credits"
                  width={600}
                  height={400}
                  className="rounded-lg border border-[#4ecdc4]/30 relative"
                />
              </div>
              <div className="order-1 md:order-2">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-6">
                  <BarChart className="h-10 w-10 text-[#4ecdc4]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">IICRC Continuing Education Credits</h2>
                <p className="text-gray-300 mb-4">
                  Maintain your professional certifications with our accredited IICRC continuing education programs,
                  designed to keep you up-to-date with the latest industry standards and practices.
                </p>
                <p className="text-gray-300 mb-6">
                  Our courses are recognized by the Institute of Inspection, Cleaning and Restoration Certification
                  (IICRC) and provide the credits you need to maintain your professional standing.
                </p>
                <h3 className="text-xl font-bold text-white mb-4">Benefits:</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">IICRC-approved courses for continuing education credits</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Convenient online format to fit your schedule</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Courses taught by industry experts with extensive experience</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Immediate certificate delivery upon course completion</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Comprehensive course materials and resources</span>
                  </li>
                </ul>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  View Available Credits
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Software Development Service */}
        <section id="software" className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-6">
                  <Code className="h-10 w-10 text-[#4ecdc4]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Innovative Software Development</h2>
                <p className="text-gray-300 mb-4">
                  Our team of experienced developers creates custom software solutions tailored to your specific
                  business needs, helping you streamline operations, improve efficiency, and drive growth.
                </p>
                <p className="text-gray-300 mb-6">
                  From web and mobile applications to enterprise software and integration solutions, we leverage
                  cutting-edge technologies to deliver high-quality, scalable products that solve real business
                  problems.
                </p>
                <h3 className="text-xl font-bold text-white mb-4">Our Development Services:</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Custom web application development</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Mobile app development (iOS and Android)</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Enterprise software solutions</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">API development and integration</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Cloud-based solutions and migrations</span>
                  </li>
                </ul>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  Discuss Your Project
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/software-development.png"
                  alt="Innovative Software Development"
                  width={600}
                  height={400}
                  className="rounded-lg border border-[#4ecdc4]/30 relative"
                />
              </div>
            </div>
          </div>
        </section>

        {/* SEO Service */}
        <section id="seo" className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/seo-service.png"
                  alt="Search Engine Optimisation (SEO)"
                  width={600}
                  height={400}
                  className="rounded-lg border border-[#4ecdc4]/30 relative"
                />
              </div>
              <div className="order-1 md:order-2">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-6">
                  <Search className="h-10 w-10 text-[#4ecdc4]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Search Engine Optimisation (SEO)</h2>
                <p className="text-gray-300 mb-4">
                  Improve your online visibility and drive more qualified traffic to your website with our comprehensive
                  SEO services, designed to help you rank higher in search engine results.
                </p>
                <p className="text-gray-300 mb-6">
                  Our data-driven approach combines technical expertise, content strategy, and link building to create
                  sustainable, long-term results that grow your business.
                </p>
                <h3 className="text-xl font-bold text-white mb-4">Our SEO Services Include:</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Comprehensive website audit and analysis</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Keyword research and competitive analysis</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">On-page and technical SEO optimization</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Content strategy and creation</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Link building and off-page optimization</span>
                  </li>
                </ul>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  Get a Free SEO Audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Consulting Service */}
        <section id="consulting" className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-6">
                  <Lightbulb className="h-10 w-10 text-[#4ecdc4]" />
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Business Consulting</h2>
                <p className="text-gray-300 mb-4">
                  Our experienced consultants provide strategic guidance to help your business overcome challenges,
                  capitalize on opportunities, and achieve sustainable growth.
                </p>
                <p className="text-gray-300 mb-6">
                  We work closely with you to understand your unique needs and develop tailored solutions that align
                  with your business goals and vision.
                </p>
                <h3 className="text-xl font-bold text-white mb-4">Consulting Areas:</h3>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Business strategy and planning</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Process optimization and efficiency</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Digital transformation and technology adoption</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Market analysis and competitive positioning</span>
                  </li>
                  <li className="flex items-start">
                    <ChevronRight className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                    <span className="text-gray-300">Growth strategy and business development</span>
                  </li>
                </ul>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  Schedule a Consultation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/business-consulting.png"
                  alt="Business Consulting"
                  width={600}
                  height={400}
                  className="rounded-lg border border-[#4ecdc4]/30 relative"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Contact us today to discuss how our services can help your business grow and succeed.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Contact Us
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Request a Quote
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
