import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, ArrowRight, Code, Smartphone, Search, Globe } from "lucide-react"

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
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Explore Our Services
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Contact Us
                  </Button>
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
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Our Services</h2>
              <p className="text-xl text-[#4ecdc4]/90 max-w-3xl mx-auto">
                We offer a comprehensive range of services designed to help your business grow and succeed in today's
                competitive landscape.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* REST API Development */}
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 shadow-lg border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Code className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">REST API Development</h3>
                <p className="text-gray-300 mb-4">
                  Build powerful, scalable, and secure APIs that connect your applications and services for seamless
                  data exchange.
                </p>
                <Link
                  href="/services/rest-api-development"
                  className="flex items-center text-[#4ecdc4] hover:text-[#4ecdc4]/80 font-medium"
                >
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* App Development */}
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 shadow-lg border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Smartphone className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">App Development</h3>
                <p className="text-gray-300 mb-4">
                  Transform your ideas into powerful, user-friendly mobile applications for iOS and Android platforms.
                </p>
                <Link
                  href="/services/app-development"
                  className="flex items-center text-[#4ecdc4] hover:text-[#4ecdc4]/80 font-medium"
                >
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* GMB Strategies */}
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 shadow-lg border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Search className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">GMB Strategies</h3>
                <p className="text-gray-300 mb-4">
                  Boost your local presence and attract more customers with our expert Google My Business optimization
                  services.
                </p>
                <Link
                  href="/services/gmb-strategies"
                  className="flex items-center text-[#4ecdc4] hover:text-[#4ecdc4]/80 font-medium"
                >
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>

              {/* Next.js Website Creators */}
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 shadow-lg border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Globe className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Next.js Website Creators</h3>
                <p className="text-gray-300 mb-4">
                  Create blazing-fast, SEO-friendly, and feature-rich websites with Next.js, the React framework for
                  production.
                </p>
                <Link
                  href="/services/nextjs-website-creators"
                  className="flex items-center text-[#4ecdc4] hover:text-[#4ecdc4]/80 font-medium"
                >
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  United in vision. Independent in spirit.
                </h2>
                <p className="text-gray-300 mb-4">
                  At UNITE Group, we believe in the power of collaboration and innovation. Our team of experts works
                  together to deliver exceptional results while maintaining the independent thinking that drives
                  creativity and problem-solving.
                </p>
                <p className="text-gray-300 mb-6">
                  Founded on the principles of excellence, integrity, and client satisfaction, we are committed to
                  helping businesses of all sizes achieve their goals through our comprehensive range of services.
                </p>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  Learn More About Us
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <div className="relative bg-gradient-to-br from-[#001428] to-[#00253e] p-8 rounded-lg border border-[#4ecdc4]/30">
                  <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                  <p className="text-gray-300 mb-6">
                    To empower businesses with innovative solutions and expert knowledge that drive growth, efficiency,
                    and success in an ever-evolving digital landscape.
                  </p>
                  <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                  <p className="text-gray-300">
                    To be the leading provider of integrated business solutions, recognized for our expertise,
                    innovation, and commitment to client success.
                  </p>
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
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Ready to take your business to the next level?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Contact us today to learn how our services can help you achieve your business goals.
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
