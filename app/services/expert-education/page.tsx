import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Users,
  BookOpen,
  Briefcase,
  Lightbulb,
  Award,
  CheckCircle,
  Zap,
  Shield,
  GraduationCap,
  Monitor,
  UserPlus,
} from "lucide-react"

export default function ExpertEducationPage() {
  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4">
                <div className="flex items-center space-x-2 bg-[#64ffda]/10 px-3 py-1 rounded-full">
                  <Users className="h-4 w-4 text-[#64ffda]" />
                  <span className="text-[#64ffda] text-sm font-medium">Expert Education</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
                Empower Your Team with Expert-Led Training
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Our professional education programs help your team develop new skills, improve productivity, and drive
                innovation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-6 py-3">
                  <Link href="/contact">
                    Schedule a Consultation
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-6 py-3"
                >
                  <Link href="#programs">Explore Programs</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image
                src="/placeholder.svg?height=800&width=800&query=professional training workshop with team collaboration in blue teal color scheme"
                alt="Expert Education"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Programs Section */}
      <section id="programs" className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our Training Programs</h2>
            <p className="mt-4 text-lg text-gray-300">
              Comprehensive education solutions designed to meet your specific business needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Monitor className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Technical Skills Training</h3>
              <p className="text-gray-300 mb-4">
                Hands-on training in programming, software development, data analysis, and other technical skills.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Web & mobile development</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Data science & analytics</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Cloud computing & DevOps</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Briefcase className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Leadership Development</h3>
              <p className="text-gray-300 mb-4">
                Programs designed to enhance leadership skills, strategic thinking, and management capabilities.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Executive leadership training</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Team management & motivation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Strategic decision making</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Lightbulb className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Digital Transformation</h3>
              <p className="text-gray-300 mb-4">
                Training to help your organization navigate and succeed in the digital age.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Digital strategy & innovation</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Agile methodologies</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Change management</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Professional Certifications</h3>
              <p className="text-gray-300 mb-4">
                Preparation courses for industry-recognized certifications and qualifications.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Project management (PMP, PRINCE2)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>IT certifications (AWS, Azure, CISSP)</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Marketing & digital skills</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <UserPlus className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Soft Skills Development</h3>
              <p className="text-gray-300 mb-4">
                Programs focused on enhancing communication, collaboration, and interpersonal skills.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Effective communication</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Problem-solving & critical thinking</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Emotional intelligence</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <GraduationCap className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Customized Learning Programs</h3>
              <p className="text-gray-300 mb-4">
                Tailored training solutions designed specifically for your organization's unique needs.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Needs assessment & program design</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Industry-specific training</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Ongoing support & evaluation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Methods */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Flexible Delivery Methods</h2>
            <p className="mt-4 text-lg text-gray-300">
              We offer multiple training formats to accommodate your team's needs and preferences
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">In-Person Workshops</h3>
              <p className="text-gray-300">
                Immersive, hands-on training sessions conducted at your location or our training facilities.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <Monitor className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Virtual Live Training</h3>
              <p className="text-gray-300">
                Interactive online sessions with real-time instruction, discussions, and collaborative activities.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Self-Paced Learning</h3>
              <p className="text-gray-300">
                Comprehensive online courses and resources that allow learners to progress at their own pace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Why Choose Our Training</h2>
            <p className="mt-4 text-lg text-gray-300">
              Benefits of partnering with UNITE Group for your educational needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Award className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Expert Instructors</h3>
              <p className="text-gray-300">
                Our trainers are industry professionals with extensive real-world experience and teaching expertise.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Practical Application</h3>
              <p className="text-gray-300">
                Our programs focus on practical skills and real-world applications that can be immediately implemented.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Customized Approach</h3>
              <p className="text-gray-300">
                We tailor our training programs to address your specific challenges, goals, and industry context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Measurable Results</h2>
            <p className="mt-4 text-lg text-gray-300">
              Our training programs deliver tangible improvements in skills, productivity, and business outcomes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">+85%</h3>
              <p className="text-xl font-semibold text-[#64ffda] mb-3">Skill Improvement</p>
              <p className="text-gray-300">
                Average skill improvement reported by participants after completing our training programs.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <Zap className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">+40%</h3>
              <p className="text-xl font-semibold text-[#64ffda] mb-3">Productivity Increase</p>
              <p className="text-gray-300">
                Average productivity improvement reported by organizations after team training.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <Users className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">+65%</h3>
              <p className="text-xl font-semibold text-[#64ffda] mb-3">Employee Retention</p>
              <p className="text-gray-300">
                Improved employee retention rates for organizations that invest in professional development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Empower Your Team?</h2>
          <p className="mt-4 text-lg text-gray-300">
            Contact us today to discuss your training needs and discover how our expert education programs can help your
            organization thrive.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-8 py-3 text-lg">
              <Link href="/contact">
                Schedule a Consultation
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
