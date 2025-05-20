import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Smartphone, Zap, Shield, Globe, CheckCircle } from "lucide-react"

export default function AppDevelopmentPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-[#4ecdc4]/20 px-4 py-2 rounded-full mb-6">
                  <span className="text-[#4ecdc4] font-medium">Mobile Solutions</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                  Custom Mobile App Development
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Transform your ideas into powerful, user-friendly mobile applications. Our expert developers create
                  custom iOS and Android apps that engage users and drive business growth.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Start Your Project
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Our Portfolio
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/App-Development.jpg"
                  alt="Mobile App Development"
                  width={600}
                  height={400}
                  className="relative rounded-lg border border-[#4ecdc4]/30"
                />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#001428] to-transparent"></div>
        </section>

        {/* Services Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our App Development Services</h2>
              <p className="text-gray-300">
                We offer comprehensive mobile app development services to meet your business needs and user
                expectations.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Smartphone className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">iOS App Development</h3>
                <p className="text-gray-300">
                  Custom iPhone and iPad applications built with Swift and Objective-C, designed to provide exceptional
                  user experiences on Apple devices.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Smartphone className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Android App Development</h3>
                <p className="text-gray-300">
                  Feature-rich Android applications developed with Kotlin and Java, optimized for the diverse range of
                  Android devices in the market.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Globe className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Cross-Platform Development</h3>
                <p className="text-gray-300">
                  Efficient multi-platform apps built with React Native, Flutter, or Xamarin, allowing you to reach both
                  iOS and Android users with a single codebase.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Zap className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">UI/UX Design</h3>
                <p className="text-gray-300">
                  Intuitive and engaging user interfaces designed to enhance user experience, increase engagement, and
                  align with your brand identity.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Shield className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">App Maintenance & Support</h3>
                <p className="text-gray-300">
                  Ongoing maintenance, updates, and technical support to ensure your app remains secure, up-to-date, and
                  compatible with the latest OS versions.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Zap className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">App Modernization</h3>
                <p className="text-gray-300">
                  Revitalize existing applications with modern technologies, improved features, and enhanced user
                  experiences to meet current market demands.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Development Process */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our App Development Process</h2>
              <p className="text-gray-300">
                We follow a structured, collaborative approach to create exceptional mobile applications that meet your
                business objectives.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <div className="bg-[#4ecdc4] text-[#001428] w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Discovery & Planning</h3>
                <p className="text-gray-300">
                  We analyze your requirements, define the app's scope, features, and technical specifications, and
                  create a detailed project roadmap.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <div className="bg-[#4ecdc4] text-[#001428] w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold text-white mb-3">UI/UX Design</h3>
                <p className="text-gray-300">
                  Our designers create wireframes, prototypes, and visual designs that focus on user experience,
                  accessibility, and your brand identity.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <div className="bg-[#4ecdc4] text-[#001428] w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Development</h3>
                <p className="text-gray-300">
                  Our developers build the app using the most appropriate technologies, following best practices and
                  coding standards for quality and performance.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <div className="bg-[#4ecdc4] text-[#001428] w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mb-6">
                  4
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Testing & Launch</h3>
                <p className="text-gray-300">
                  We conduct thorough testing for functionality, usability, performance, and security before deploying
                  your app to the appropriate app stores.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technologies Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Technologies We Use</h2>
                <p className="text-gray-300 mb-8">
                  We leverage the latest technologies and frameworks to build high-performance, scalable, and secure
                  mobile applications.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Native Development</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Swift for iOS</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Objective-C for iOS</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Kotlin for Android</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Java for Android</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Cross-Platform</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">React Native</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Flutter</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Xamarin</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Ionic</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Backend & APIs</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Node.js</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Firebase</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">AWS</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">RESTful APIs</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-4">Tools & Platforms</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Xcode</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Android Studio</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Visual Studio Code</span>
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-2" />
                        <span className="text-gray-300">Git & GitHub</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/app-development-tech.png"
                  alt="App Development Technologies"
                  width={600}
                  height={400}
                  className="relative rounded-lg border border-[#4ecdc4]/30"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Choose Our App Development Services
              </h2>
              <p className="text-gray-300">
                Partner with us for mobile app development and experience the difference our expertise and approach can
                make.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Experienced Team</h3>
                <p className="text-gray-300">
                  Our developers have years of experience creating successful mobile applications across various
                  industries and platforms.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">User-Centered Design</h3>
                <p className="text-gray-300">
                  We prioritize user experience, creating intuitive interfaces that engage users and drive app adoption
                  and retention.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Quality Assurance</h3>
                <p className="text-gray-300">
                  Rigorous testing processes ensure your app is stable, secure, and performs well across all target
                  devices.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Transparent Communication</h3>
                <p className="text-gray-300">
                  Regular updates and clear communication throughout the development process keep you informed and
                  involved.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Scalable Solutions</h3>
                <p className="text-gray-300">
                  We build apps that can grow with your business, accommodating increasing users and expanding features.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Post-Launch Support</h3>
                <p className="text-gray-300">
                  Our relationship doesn't end at launch—we provide ongoing maintenance, updates, and support for your
                  app.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to build your mobile app?</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Contact us today to discuss your app idea and get a free consultation.
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
