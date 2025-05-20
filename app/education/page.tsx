import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, GraduationCap, Award, Clock, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { NewsletterForm } from "@/components/newsletter-form"

export default function EducationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-[#4ecdc4]/20 px-4 py-2 rounded-full mb-6">
                  <span className="text-[#4ecdc4] font-medium">Adult Education Center</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                  UNITE: Bridging Science and Education in Professional Development
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  At UNITE Group, we offer 24/7 access to industry-approved professional development courses. Our online
                  training is designed for professionals looking to expand their skills while earning Continuing
                  Education Credits (CECs). Our courses are IICRC-approved, ensuring high-quality education that meets
                  industry standards.
                </p>
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                  LEARN MORE
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/education-hero.png"
                  alt="Professional Education"
                  width={600}
                  height={400}
                  className="rounded-lg border border-[#4ecdc4]/30 relative"
                />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#001428] to-transparent"></div>
        </section>

        {/* Why Choose Our Education Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Why Choose Our Education Programs</h2>
              <p className="text-gray-300">
                Our comprehensive education programs are designed to provide you with the knowledge and skills you need
                to excel in your field.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-[#002a42] to-[#00395d] border-[#4ecdc4]/20">
                <CardContent className="p-6">
                  <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                    <Award className="h-8 w-8 text-[#4ecdc4]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">IICRC Approved</h3>
                  <p className="text-gray-300">
                    All our courses are IICRC-approved, ensuring you receive industry-recognized certifications and
                    credits.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-[#002a42] to-[#00395d] border-[#4ecdc4]/20">
                <CardContent className="p-6">
                  <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                    <Clock className="h-8 w-8 text-[#4ecdc4]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">24/7 Access</h3>
                  <p className="text-gray-300">
                    Learn at your own pace with unlimited access to course materials anytime, anywhere.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-[#002a42] to-[#00395d] border-[#4ecdc4]/20">
                <CardContent className="p-6">
                  <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                    <Users className="h-8 w-8 text-[#4ecdc4]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Expert Instructors</h3>
                  <p className="text-gray-300">
                    Learn from industry professionals with years of experience and practical knowledge.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-[#002a42] to-[#00395d] border-[#4ecdc4]/20">
                <CardContent className="p-6">
                  <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                    <GraduationCap className="h-8 w-8 text-[#4ecdc4]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Continuing Education</h3>
                  <p className="text-gray-300">
                    Earn valuable Continuing Education Credits (CECs) to maintain your professional certifications.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Get exclusive updates and offers!</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Subscribe to our newsletter to receive the latest course updates, special offers, and industry news.
                </p>
                <NewsletterForm />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to advance your career?</h2>
              <p className="text-xl text-gray-300 mb-8">Explore our courses and start earning valuable CECs today.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                  Browse Courses
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                  Contact Us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
