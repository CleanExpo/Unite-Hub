import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ArrowRight, Code, Database, Globe, Smartphone, Server, Cloud, Shield, Zap, CheckCircle } from "lucide-react"

export default function SoftwareDevelopmentPage() {
  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4">
                <div className="flex items-center space-x-2 bg-[#64ffda]/10 px-3 py-1 rounded-full">
                  <Code className="h-4 w-4 text-[#64ffda]" />
                  <span className="text-[#64ffda] text-sm font-medium">Software Development</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
                Custom Software Solutions for Your Business
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                We build tailored software applications that solve your unique business challenges and drive growth.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-6 py-3">
                  <Link href="/contact">
                    Get a Free Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-6 py-3"
                >
                  <Link href="#portfolio">View Our Portfolio</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image src="/software-code-blue-teal.png" alt="Software Development" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Development Services</h2>
            <p className="mt-4 text-lg text-gray-300">
              Comprehensive software development solutions tailored to your specific needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Web Application Development</h3>
              <p className="text-gray-300 mb-4">
                Custom web applications with responsive design, intuitive UX, and robust functionality.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Progressive Web Apps (PWAs)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>E-commerce platforms</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Customer portals & dashboards</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Mobile App Development</h3>
              <p className="text-gray-300 mb-4">
                Native and cross-platform mobile applications for iOS and Android devices.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Native iOS & Android apps</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Cross-platform solutions (React Native)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>App store optimization & deployment</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Server className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Custom Enterprise Software</h3>
              <p className="text-gray-300 mb-4">
                Scalable enterprise solutions that streamline operations and boost productivity.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>ERP & CRM systems</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Business process automation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Legacy system modernization</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Database Development</h3>
              <p className="text-gray-300 mb-4">
                Robust database solutions for efficient data storage, retrieval, and management.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Database design & optimization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Data migration & integration</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Performance tuning & scaling</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Cloud className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Cloud Solutions</h3>
              <p className="text-gray-300 mb-4">
                Scalable cloud-based applications and infrastructure for maximum flexibility.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Cloud migration strategies</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>AWS, Azure & GCP solutions</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Serverless architecture</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">API Development & Integration</h3>
              <p className="text-gray-300 mb-4">
                Secure and efficient APIs that connect your systems and enable seamless data flow.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>RESTful & GraphQL APIs</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Third-party integrations</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Microservices architecture</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Development Process */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Development Process</h2>
            <p className="mt-4 text-lg text-gray-300">
              A structured approach that ensures quality, efficiency, and successful outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Discovery & Planning</h3>
              <p className="text-gray-300">
                We analyze your requirements, define project scope, and create a detailed development roadmap.
              </p>
              <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Design & Architecture</h3>
              <p className="text-gray-300">
                We create UI/UX designs and establish the technical architecture for your application.
              </p>
              <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Development & Testing</h3>
              <p className="text-gray-300">
                Our developers build your solution using agile methodologies with continuous testing and quality
                assurance.
              </p>
              <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Deployment & Support</h3>
              <p className="text-gray-300">
                We deploy your application and provide ongoing maintenance, support, and enhancements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Technology Stack</h2>
            <p className="mt-4 text-lg text-gray-300">
              We use cutting-edge technologies to build robust, scalable, and high-performance applications
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-[#1a2f55] p-6 rounded-lg h-full flex flex-col items-center justify-center">
                <h3 className="text-xl font-semibold text-white mb-4">Frontend</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>React / Next.js</li>
                  <li>Angular</li>
                  <li>Vue.js</li>
                  <li>TypeScript</li>
                  <li>Tailwind CSS</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-[#1a2f55] p-6 rounded-lg h-full flex flex-col items-center justify-center">
                <h3 className="text-xl font-semibold text-white mb-4">Backend</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>Node.js</li>
                  <li>Python / Django / Flask</li>
                  <li>Java / Spring</li>
                  <li>PHP / Laravel</li>
                  <li>.NET Core</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-[#1a2f55] p-6 rounded-lg h-full flex flex-col items-center justify-center">
                <h3 className="text-xl font-semibold text-white mb-4">Mobile</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>React Native</li>
                  <li>Flutter</li>
                  <li>Swift</li>
                  <li>Kotlin</li>
                  <li>Xamarin</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-[#1a2f55] p-6 rounded-lg h-full flex flex-col items-center justify-center">
                <h3 className="text-xl font-semibold text-white mb-4">Database & Cloud</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>PostgreSQL / MySQL</li>
                  <li>MongoDB / Firebase</li>
                  <li>AWS / Azure / GCP</li>
                  <li>Docker / Kubernetes</li>
                  <li>Redis / Elasticsearch</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Why Choose Us</h2>
            <p className="mt-4 text-lg text-gray-300">
              Benefits of partnering with UNITE Group for your software development needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Expertise & Experience</h3>
              <p className="text-gray-300">
                Our team of seasoned developers has extensive experience across various industries and technologies.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Agile Development</h3>
              <p className="text-gray-300">
                We follow agile methodologies to ensure flexibility, transparency, and faster time-to-market.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Code className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Quality Assurance</h3>
              <p className="text-gray-300">
                Rigorous testing and quality control processes ensure your software is reliable and bug-free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Start Your Project?</h2>
          <p className="mt-4 text-lg text-gray-300">
            Contact us today to discuss your software development needs and get a free consultation.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-8 py-3 text-lg">
              <Link href="/contact">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-8 py-3 text-lg"
            >
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
