import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Code, Zap, Layout, Globe, CheckCircle, Server } from "lucide-react"

export default function NextjsWebsiteCreatorsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-[#4ecdc4]/20 px-4 py-2 rounded-full mb-6">
                  <span className="text-[#4ecdc4] font-medium">Modern Web Development</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                  Next.js Website Development Services
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Create blazing-fast, SEO-friendly, and feature-rich websites with Next.js, the React framework for
                  production. Our expert developers build modern web experiences that drive results.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Start Your Project
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    View Our Portfolio
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/NextJS-Website-Creators.jpg"
                  alt="Next.js Website Development"
                  width={600}
                  height={400}
                  className="relative rounded-lg border border-[#4ecdc4]/30"
                />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#001428] to-transparent"></div>
        </section>

        {/* Why Next.js Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Why Choose Next.js?</h2>
              <p className="text-gray-300">
                Next.js is the leading React framework for building modern web applications with exceptional performance
                and developer experience.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Zap className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Lightning Fast Performance</h3>
                <p className="text-gray-300">
                  Next.js delivers exceptional speed through automatic code splitting, server-side rendering, and static
                  site generation.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Globe className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">SEO Optimized</h3>
                <p className="text-gray-300">
                  Built-in server-side rendering and static generation make Next.js websites highly discoverable by
                  search engines.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Layout className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Modern User Experiences</h3>
                <p className="text-gray-300">
                  Create dynamic, interactive websites with React components while maintaining fast page loads and
                  smooth navigation.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Server className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Scalable Architecture</h3>
                <p className="text-gray-300">
                  Next.js provides a robust framework that scales with your business, from simple landing pages to
                  complex web applications.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Code className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Developer Friendly</h3>
                <p className="text-gray-300">
                  Built-in features like file-based routing, API routes, and TypeScript support make development faster
                  and more efficient.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Zap className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Versatile Deployment</h3>
                <p className="text-gray-300">
                  Deploy Next.js sites on various platforms with optimized builds for the best performance and user
                  experience.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Next.js Services Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Next.js Development Services</h2>
              <p className="text-gray-300">
                We offer comprehensive Next.js development services to create modern, high-performance websites and web
                applications.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Corporate Websites</h3>
                <p className="text-gray-300 mb-4">
                  Professional, fast-loading corporate websites that showcase your brand, products, and services with a
                  modern design and optimal user experience.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Responsive design for all devices</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">SEO optimization for better visibility</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Content management system integration</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">E-commerce Solutions</h3>
                <p className="text-gray-300 mb-4">
                  High-performance online stores built with Next.js and integrated with popular e-commerce platforms for
                  a seamless shopping experience.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Integration with payment gateways</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Product catalog and inventory management</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Cart and checkout optimization</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Web Applications</h3>
                <p className="text-gray-300 mb-4">
                  Custom web applications with complex functionality, user authentication, and data management built on
                  the robust Next.js framework.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">User authentication and authorization</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">API integration and development</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Real-time data processing</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Content-Rich Platforms</h3>
                <p className="text-gray-300 mb-4">
                  Blogs, news sites, and content platforms that leverage Next.js's static generation for lightning-fast
                  page loads and optimal SEO.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Headless CMS integration</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Content delivery optimization</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                    <span className="text-gray-300">Advanced search functionality</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Development Process Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Next.js Development Process</h2>
              <p className="text-gray-300">
                We follow a structured approach to create exceptional Next.js websites that meet your business
                objectives.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <div className="bg-[#4ecdc4] text-[#001428] w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Discovery & Planning</h3>
                <p className="text-gray-300">
                  We analyze your requirements, define project scope, and create a detailed roadmap for your Next.js
                  website development.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <div className="bg-[#4ecdc4] text-[#001428] w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Design & Prototyping</h3>
                <p className="text-gray-300">
                  Our designers create wireframes and visual designs that align with your brand and focus on user
                  experience.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <div className="bg-[#4ecdc4] text-[#001428] w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Development</h3>
                <p className="text-gray-300">
                  Our Next.js developers build your website with clean, efficient code, following best practices for
                  performance and SEO.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <div className="bg-[#4ecdc4] text-[#001428] w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  4
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Testing & Deployment</h3>
                <p className="text-gray-300">
                  We thoroughly test your website for functionality, performance, and compatibility before deploying it
                  to your chosen platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technologies Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Technologies We Use</h2>
                <p className="text-gray-300 mb-8">
                  We leverage the latest technologies and tools in the Next.js ecosystem to build high-performance,
                  scalable websites.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Core Technologies</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Next.js (Latest Version)</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">React</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">TypeScript</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Node.js</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Styling & UI</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Tailwind CSS</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">CSS Modules</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Styled Components</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">UI Component Libraries</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Data & Content</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">GraphQL</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">REST APIs</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Headless CMS (Contentful, Sanity)</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">MongoDB, PostgreSQL</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Deployment & Infrastructure</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Vercel</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Netlify</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">AWS</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Docker</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/nextjs-technologies.png"
                  alt="Next.js Technologies"
                  width={600}
                  height={400}
                  className="relative rounded-lg border border-[#4ecdc4]/30"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Benefits of Our Next.js Development Services
              </h2>
              <p className="text-gray-300">
                Partner with us for Next.js development and experience these powerful advantages.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Exceptional Performance</h3>
                <p className="text-gray-300">
                  Our Next.js websites deliver lightning-fast load times and smooth user experiences, reducing bounce
                  rates and improving engagement.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Improved SEO Rankings</h3>
                <p className="text-gray-300">
                  Server-side rendering and static generation help your website rank higher in search engines, driving
                  more organic traffic.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Scalable Solutions</h3>
                <p className="text-gray-300">
                  Our Next.js websites are built to grow with your business, easily accommodating new features and
                  increasing traffic.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Modern User Experiences</h3>
                <p className="text-gray-300">
                  We create intuitive, engaging interfaces that keep users on your site longer and increase conversion
                  rates.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Future-Proof Technology</h3>
                <p className="text-gray-300">
                  Next.js is constantly evolving with new features and improvements, ensuring your website remains
                  current and competitive.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Cost-Effective Development</h3>
                <p className="text-gray-300">
                  The efficiency of Next.js development translates to faster build times and lower development costs for
                  your projects.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to build your Next.js website?</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Contact us today to discuss your project and get a free consultation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Start Your Project
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    View Our Portfolio
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
