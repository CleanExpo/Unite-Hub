import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Users, Target, Award, Zap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">About UNITE Group</h1>
                <p className="text-xl text-[#4ecdc4]/90 mb-6">United in vision. Independent in spirit.</p>
                <p className="text-gray-300 mb-6">
                  At UNITE Group, we believe in the power of collaboration and innovation. Our team of experts works
                  together to deliver exceptional results while maintaining the independent thinking that drives
                  creativity and problem-solving.
                </p>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  Our Services
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/logo-large.png"
                  alt="UNITE Group Logo"
                  width={500}
                  height={500}
                  className="mx-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Story</h2>
              <p className="text-gray-300">
                The journey of UNITE Group began with a simple yet powerful idea: to create a company that combines
                expertise across multiple disciplines to provide comprehensive solutions for businesses of all sizes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/our-story.png"
                  alt="Our Story"
                  width={600}
                  height={400}
                  className="rounded-lg border border-[#4ecdc4]/30 relative"
                />
              </div>
              <div>
                <p className="text-gray-300 mb-4">
                  Founded in 2018, UNITE Group was established by a team of industry veterans who recognized the need
                  for integrated business solutions that address the complex challenges of the modern digital landscape.
                </p>
                <p className="text-gray-300 mb-4">
                  Our founders brought together their diverse expertise in education, software development, digital
                  marketing, and business consulting to create a company that could offer truly comprehensive services.
                </p>
                <p className="text-gray-300 mb-4">
                  Over the years, we've grown from a small team of passionate professionals to a thriving organization
                  serving clients across various industries. Throughout our growth, we've remained committed to our core
                  values of excellence, innovation, integrity, and client satisfaction.
                </p>
                <p className="text-gray-300">
                  Today, UNITE Group continues to evolve and expand our service offerings to meet the changing needs of
                  our clients, while staying true to our founding vision of being united in vision and independent in
                  spirit.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Values</h2>
              <p className="text-gray-300">
                Our core values guide everything we do at UNITE Group, from how we work with clients to how we
                collaborate as a team.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Users className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Collaboration</h3>
                <p className="text-gray-300">
                  We believe in the power of teamwork and collaboration, both within our organization and with our
                  clients. By working together, we achieve greater results than we could individually.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Zap className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Innovation</h3>
                <p className="text-gray-300">
                  We constantly seek new and better ways to solve problems and deliver value. Innovation is at the heart
                  of our approach to every project and challenge.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Award className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Excellence</h3>
                <p className="text-gray-300">
                  We are committed to delivering the highest quality in everything we do. We set high standards for
                  ourselves and continuously strive to exceed expectations.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Target className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Integrity</h3>
                <p className="text-gray-300">
                  We conduct our business with honesty, transparency, and ethical practices. We build trust through our
                  actions and stand behind our work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Team Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our Leadership Team</h2>
              <p className="text-gray-300">
                Meet the experienced professionals who lead UNITE Group and drive our mission forward.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg overflow-hidden border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <Image
                  src="/team-member-1.png"
                  alt="Sarah Johnson"
                  width={400}
                  height={400}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">Sarah Johnson</h3>
                  <p className="text-[#4ecdc4] mb-4">Chief Executive Officer</p>
                  <p className="text-gray-300 mb-4">
                    With over 15 years of experience in business leadership and technology, Sarah leads our company with
                    vision and strategic direction.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg overflow-hidden border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <Image
                  src="/team-member-2.png"
                  alt="Michael Chen"
                  width={400}
                  height={400}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">Michael Chen</h3>
                  <p className="text-[#4ecdc4] mb-4">Chief Technology Officer</p>
                  <p className="text-gray-300 mb-4">
                    Michael brings extensive expertise in software development and technology innovation to lead our
                    technical initiatives.
                  </p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg overflow-hidden border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <Image
                  src="/team-member-3.png"
                  alt="Emily Rodriguez"
                  width={400}
                  height={400}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">Emily Rodriguez</h3>
                  <p className="text-[#4ecdc4] mb-4">Director of Education</p>
                  <p className="text-gray-300 mb-4">
                    Emily oversees our educational programs, bringing her background in instructional design and adult
                    learning to create impactful courses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission & Vision Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] p-8 rounded-lg border border-[#4ecdc4]/30">
                <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                <p className="text-gray-300 mb-6">
                  To empower businesses with innovative solutions and expert knowledge that drive growth, efficiency,
                  and success in an ever-evolving digital landscape.
                </p>
                <p className="text-gray-300">
                  We are committed to delivering exceptional value through our comprehensive range of services, helping
                  our clients overcome challenges and capitalize on opportunities.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] p-8 rounded-lg border border-[#4ecdc4]/30">
                <h3 className="text-2xl font-bold text-white mb-4">Our Vision</h3>
                <p className="text-gray-300 mb-6">
                  To be the leading provider of integrated business solutions, recognized for our expertise, innovation,
                  and commitment to client success.
                </p>
                <p className="text-gray-300">
                  We envision a future where businesses of all sizes have access to the tools, knowledge, and support
                  they need to thrive in a competitive marketplace.
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
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Join Our Journey</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Partner with UNITE Group and experience the difference our integrated approach can make for your
                  business.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Contact Us
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Our Services
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
