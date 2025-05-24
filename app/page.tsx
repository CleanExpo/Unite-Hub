import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, Code, Search, Shield, Zap, Globe } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Hero Section */}
      <section className="relative px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Empowering Your Success
              <br />
              <span className="text-[#64ffda]">Through Innovation</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300 sm:text-xl">
              UNITE Group delivers expert-led education, innovative software development, and strategic SEO services to
              help your business thrive.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button
                asChild
                className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-8 py-3 text-lg"
              >
                <Link href="/services">
                  Explore Our Services
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-8 py-3 text-lg"
              >
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>

          {/* Hero Graphic */}
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <div className="flex h-48 w-48 items-center justify-center rounded-full bg-gradient-to-br from-[#64ffda] to-[#4fd1c7] shadow-2xl">
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[#0a192f]">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-[#64ffda] flex items-center justify-center">
                      <Users className="h-8 w-8 text-[#0a192f]" />
                    </div>
                    <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-[#4fd1c7] flex items-center justify-center">
                      <Zap className="h-4 w-4 text-[#0a192f]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Services</h2>
            <p className="mt-4 text-lg text-gray-300">Comprehensive solutions to drive your business forward</p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-[#1a2f55] border-[#64ffda]/20 hover:border-[#64ffda]/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#64ffda]/10">
                  <Code className="h-6 w-6 text-[#64ffda]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">Software Development</h3>
                <p className="mt-2 text-gray-300">
                  Custom software solutions built with cutting-edge technologies to meet your unique business needs.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2f55] border-[#64ffda]/20 hover:border-[#64ffda]/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#64ffda]/10">
                  <Search className="h-6 w-6 text-[#64ffda]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">SEO Services</h3>
                <p className="mt-2 text-gray-300">
                  Strategic SEO optimization to improve your online visibility and drive organic traffic growth.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2f55] border-[#64ffda]/20 hover:border-[#64ffda]/50 transition-colors">
              <CardContent className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#64ffda]/10">
                  <Users className="h-6 w-6 text-[#64ffda]" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">Expert Education</h3>
                <p className="mt-2 text-gray-300">
                  Professional training and educational programs to upskill your team and drive innovation.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Why Choose UNITE Group?</h2>
            <p className="mt-4 text-lg text-gray-300">
              We combine expertise, innovation, and dedication to deliver exceptional results
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda]/10">
                  <Shield className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Trusted Expertise</h3>
              <p className="mt-2 text-gray-300">
                Years of experience delivering successful projects across various industries.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda]/10">
                  <Zap className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Fast Delivery</h3>
              <p className="mt-2 text-gray-300">
                Agile development processes ensure quick turnaround without compromising quality.
              </p>
            </div>

            <div className="text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda]/10">
                  <Globe className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="mt-4 text-xl font-semibold text-white">Global Reach</h3>
              <p className="mt-2 text-gray-300">
                Serving clients worldwide with 24/7 support and multilingual capabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to Transform Your Business?
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Let's discuss how UNITE Group can help you achieve your goals and drive innovation.
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-8 py-3 text-lg">
              <Link href="/contact">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-8 py-3 text-lg"
            >
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
