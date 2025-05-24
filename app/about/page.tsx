import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Users, Target, Award, Lightbulb, Shield, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
                About <span className="text-[#64ffda]">UNITE Group</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                We are a forward-thinking technology company dedicated to helping businesses thrive in the digital age
                through innovative software solutions, strategic SEO services, and expert education programs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-6 py-3">
                  <Link href="/contact">
                    Get in Touch
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-6 py-3"
                >
                  <Link href="/services">Our Services</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image src="/modern-office-collaboration.png" alt="UNITE Group Team" fill className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Mission & Vision</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-[#1a2f55] border-[#2a4365]">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-6">
                  <Target className="h-6 w-6 text-[#64ffda]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                <p className="text-gray-300 leading-relaxed">
                  To empower businesses with cutting-edge technology solutions, strategic digital marketing, and
                  comprehensive education programs that drive growth, innovation, and sustainable success in an
                  ever-evolving digital landscape.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2f55] border-[#2a4365]">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-6">
                  <Lightbulb className="h-6 w-6 text-[#64ffda]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                <p className="text-gray-300 leading-relaxed">
                  To be the leading partner for businesses seeking digital transformation, recognized for our innovative
                  solutions, exceptional service quality, and commitment to helping our clients achieve their full
                  potential in the digital economy.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Core Values</h2>
            <p className="mt-4 text-lg text-gray-300">
              The principles that guide everything we do and shape our company culture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Integrity</h3>
              <p className="text-gray-300">
                We conduct business with honesty, transparency, and ethical practices in all our interactions with
                clients, partners, and team members.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Innovation</h3>
              <p className="text-gray-300">
                We embrace cutting-edge technologies and creative solutions to solve complex challenges and deliver
                exceptional value to our clients.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Excellence</h3>
              <p className="text-gray-300">
                We strive for the highest quality in everything we do, from code quality to customer service, ensuring
                exceptional outcomes for our clients.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Expert Team</h2>
            <p className="mt-4 text-lg text-gray-300">Meet the talented professionals who make our success possible</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-[#1a2f55] border-[#2a4365] text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 rounded-full bg-[#64ffda]/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-12 w-12 text-[#64ffda]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Development Team</h3>
                <p className="text-gray-300 mb-4">
                  Experienced software engineers and developers specializing in modern web and mobile technologies.
                </p>
                <div className="text-sm text-gray-400">
                  <p>• Full-stack developers</p>
                  <p>• UI/UX designers</p>
                  <p>• DevOps engineers</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2f55] border-[#2a4365] text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 rounded-full bg-[#64ffda]/10 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-12 w-12 text-[#64ffda]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Marketing Team</h3>
                <p className="text-gray-300 mb-4">
                  SEO specialists and digital marketing experts who drive online visibility and growth.
                </p>
                <div className="text-sm text-gray-400">
                  <p>• SEO strategists</p>
                  <p>• Content creators</p>
                  <p>• Analytics experts</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a2f55] border-[#2a4365] text-center">
              <CardContent className="p-6">
                <div className="w-24 h-24 rounded-full bg-[#64ffda]/10 flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-12 w-12 text-[#64ffda]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Education Team</h3>
                <p className="text-gray-300 mb-4">
                  Professional trainers and educators who deliver comprehensive learning programs.
                </p>
                <div className="text-sm text-gray-400">
                  <p>• Technical instructors</p>
                  <p>• Leadership coaches</p>
                  <p>• Curriculum designers</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Company Stats */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Impact</h2>
            <p className="mt-4 text-lg text-gray-300">Numbers that reflect our commitment to excellence</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#64ffda] mb-2">150+</div>
              <p className="text-white font-semibold mb-1">Projects Completed</p>
              <p className="text-gray-400 text-sm">Successful software solutions delivered</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-[#64ffda] mb-2">50+</div>
              <p className="text-white font-semibold mb-1">Happy Clients</p>
              <p className="text-gray-400 text-sm">Businesses we've helped grow</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-[#64ffda] mb-2">1000+</div>
              <p className="text-white font-semibold mb-1">Students Trained</p>
              <p className="text-gray-400 text-sm">Professionals upskilled through our programs</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-[#64ffda] mb-2">5+</div>
              <p className="text-white font-semibold mb-1">Years Experience</p>
              <p className="text-gray-400 text-sm">Delivering excellence in the industry</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Work Together?</h2>
          <p className="mt-4 text-lg text-gray-300">
            Let's discuss how UNITE Group can help your business achieve its goals and reach new heights.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-8 py-3 text-lg">
              <Link href="/contact">
                Start a Conversation
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-8 py-3 text-lg"
            >
              <Link href="/services">Explore Our Services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
