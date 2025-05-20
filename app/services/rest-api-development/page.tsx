import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Code, Server, Database, Cloud, CheckCircle } from "lucide-react"

export default function RestApiDevelopmentPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-[#4ecdc4]/20 px-4 py-2 rounded-full mb-6">
                  <span className="text-[#4ecdc4] font-medium">API Development</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                  Custom REST API Development Services
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Build powerful, scalable, and secure APIs that connect your applications and services. Our expert
                  developers create custom REST APIs that drive your business forward.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/REST-API-Connections.png"
                  alt="REST API Connections"
                  width={600}
                  height={400}
                  className="relative rounded-lg border border-[#4ecdc4]/30"
                />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#001428] to-transparent"></div>
        </section>

        {/* What is REST API Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">What is a REST API?</h2>
              <p className="text-gray-300">
                REST (Representational State Transfer) APIs are a standardized approach to building web services that
                allow different systems to communicate and share data efficiently.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Server className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Scalable Architecture</h3>
                <p className="text-gray-300">
                  REST APIs use a stateless architecture that makes them highly scalable and able to handle large
                  numbers of requests efficiently.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Code className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Language Independent</h3>
                <p className="text-gray-300">
                  REST APIs can be developed in any programming language and can communicate with applications built on
                  different platforms.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Database className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Data Exchange</h3>
                <p className="text-gray-300">
                  REST APIs typically use JSON or XML formats for data exchange, making them lightweight and easy to
                  work with for developers.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our API Development Process */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our API Development Process</h2>
              <p className="text-gray-300">
                We follow a structured approach to create robust, secure, and efficient REST APIs tailored to your
                specific business needs.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="space-y-8">
                  <div className="flex items-start">
                    <div className="bg-[#4ecdc4] text-[#001428] w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-4 mt-1">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Requirements Analysis</h3>
                      <p className="text-gray-300">
                        We work closely with you to understand your business goals, technical requirements, and the
                        specific needs of your API.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#4ecdc4] text-[#001428] w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-4 mt-1">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">API Design</h3>
                      <p className="text-gray-300">
                        Our team designs the API architecture, endpoints, data models, and authentication mechanisms
                        based on best practices.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#4ecdc4] text-[#001428] w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-4 mt-1">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Development</h3>
                      <p className="text-gray-300">
                        We develop the API using modern technologies and frameworks, ensuring clean code and optimal
                        performance.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#4ecdc4] text-[#001428] w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-4 mt-1">
                      4
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Testing & Documentation</h3>
                      <p className="text-gray-300">
                        We thoroughly test the API for functionality, security, and performance, and provide
                        comprehensive documentation.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="bg-[#4ecdc4] text-[#001428] w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold mr-4 mt-1">
                      5
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Deployment & Maintenance</h3>
                      <p className="text-gray-300">
                        We deploy your API to your preferred environment and provide ongoing maintenance and support.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2 relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <div className="relative bg-gradient-to-br from-[#001428] to-[#00253e] p-8 rounded-lg border border-[#4ecdc4]/30">
                  <h3 className="text-2xl font-bold text-white mb-6">Technologies We Use</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#4ecdc4] mr-3 mt-0.5" />
                      <span className="text-gray-300">Node.js with Express for JavaScript-based APIs</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#4ecdc4] mr-3 mt-0.5" />
                      <span className="text-gray-300">Python with Django REST Framework</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#4ecdc4] mr-3 mt-0.5" />
                      <span className="text-gray-300">Java with Spring Boot</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#4ecdc4] mr-3 mt-0.5" />
                      <span className="text-gray-300">MongoDB, PostgreSQL, MySQL for data storage</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#4ecdc4] mr-3 mt-0.5" />
                      <span className="text-gray-300">Docker and Kubernetes for containerization</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#4ecdc4] mr-3 mt-0.5" />
                      <span className="text-gray-300">AWS, Azure, or Google Cloud for hosting</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-6 w-6 text-[#4ecdc4] mr-3 mt-0.5" />
                      <span className="text-gray-300">Swagger/OpenAPI for documentation</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Benefits of Our REST API Services</h2>
              <p className="text-gray-300">
                Our custom REST API development services provide numerous advantages for your business.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Improved Integration</h3>
                <p className="text-gray-300">
                  Connect your applications, services, and third-party platforms seamlessly, enabling better data flow
                  and functionality.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Enhanced Scalability</h3>
                <p className="text-gray-300">
                  Our APIs are designed to handle growth, allowing your systems to scale efficiently as your business
                  expands.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Increased Efficiency</h3>
                <p className="text-gray-300">
                  Streamline operations and automate processes by enabling different systems to communicate effectively.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Better User Experience</h3>
                <p className="text-gray-300">
                  Create more responsive and feature-rich applications by leveraging efficient API communication.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Future-Proof Solutions</h3>
                <p className="text-gray-300">
                  Our APIs are built with longevity in mind, using modern standards and practices that adapt to changing
                  technologies.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Robust Security</h3>
                <p className="text-gray-300">
                  We implement industry-standard security measures to protect your data and ensure secure API
                  transactions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">REST API Use Cases</h2>
              <p className="text-gray-300">
                Our REST APIs power a wide range of applications and services across various industries.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Mobile Applications</h3>
                <p className="text-gray-300 mb-4">
                  Power your mobile apps with robust backend APIs that handle data storage, user authentication, and
                  business logic.
                </p>
                <div className="flex items-center">
                  <Cloud className="h-6 w-6 text-[#4ecdc4] mr-2" />
                  <span className="text-[#4ecdc4]">Backend services for iOS and Android apps</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Web Applications</h3>
                <p className="text-gray-300 mb-4">
                  Create dynamic web applications with APIs that handle data processing, user management, and
                  third-party integrations.
                </p>
                <div className="flex items-center">
                  <Cloud className="h-6 w-6 text-[#4ecdc4] mr-2" />
                  <span className="text-[#4ecdc4]">SPA and progressive web app backends</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">IoT Devices</h3>
                <p className="text-gray-300 mb-4">
                  Connect and manage IoT devices with APIs that handle device registration, data collection, and remote
                  control.
                </p>
                <div className="flex items-center">
                  <Cloud className="h-6 w-6 text-[#4ecdc4] mr-2" />
                  <span className="text-[#4ecdc4]">Smart home and industrial IoT solutions</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">E-commerce Platforms</h3>
                <p className="text-gray-300 mb-4">
                  Build powerful e-commerce solutions with APIs for product management, order processing, and payment
                  integration.
                </p>
                <div className="flex items-center">
                  <Cloud className="h-6 w-6 text-[#4ecdc4] mr-2" />
                  <span className="text-[#4ecdc4]">Online stores and marketplace platforms</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to build your REST API?</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Contact us today to discuss your API development needs and get a free consultation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Learn More
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
