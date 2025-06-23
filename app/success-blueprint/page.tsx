import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CheckCircle,
  TrendingUp,
  Users,
  Rocket,
  ShieldCheck,
  Target,
  GitFork,
  Settings2,
  ClipboardCheck,
  Layers,
  HeartHandshake,
  Megaphone,
  RefreshCw,
  DatabaseZap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function SuccessBlueprintPage() {
  const blueprintSteps = [
    {
      id: 1,
      title: "Discovery & Strategic Alignment",
      description:
        "Our journey begins with an immersive discovery phase. We conduct in-depth workshops, stakeholder interviews, and market analysis to thoroughly understand your business objectives, operational challenges, and competitive landscape. The key outcome is a clearly defined project scope, strategic roadmap, and success metrics, ensuring complete alignment before any development begins.",
      icon: Target,
      image: "/strategic-planning-meeting.png",
    },
    {
      id: 2,
      title: "Solution Architecture & Prototyping",
      description:
        "Leveraging insights from the discovery phase, our expert architects design a robust, scalable, and future-proof solution. We create detailed technical specifications, data models, and user flow diagrams. Interactive prototypes and wireframes are developed to provide a tangible preview of the user experience, allowing for early feedback and iterative refinement.",
      icon: Layers,
      image: "/ui-ux-design-prototype.png",
    },
    {
      id: 3,
      title: "Agile Development & Iterative Implementation",
      description:
        "We embrace agile methodologies (Scrum/Kanban) to develop your solution in manageable sprints. This iterative approach fosters flexibility, transparency through regular demos, and continuous collaboration. Our development teams prioritize clean code, robust functionality, and adherence to best practices, ensuring a high-quality build throughout the lifecycle.",
      icon: GitFork,
      image: "/agile-team-collaboration.png",
    },
    {
      id: 4,
      title: "Comprehensive Quality Assurance & Testing",
      description:
        "Quality is paramount. Our dedicated QA team implements a multi-layered testing strategy, encompassing functional, integration, performance, security, and usability testing. We utilize both manual and automated testing tools to identify and rectify issues proactively, ensuring the solution is reliable, secure, and performs optimally under all conditions.",
      icon: ClipboardCheck,
      image: "/quality-assurance-testing.png",
    },
    {
      id: 5,
      title: "Seamless Deployment & Go-Live Orchestration",
      description:
        "We meticulously plan and execute the deployment process, whether to cloud environments (AWS, Azure, GCP) or on-premise infrastructure. Our team manages data migration, system configuration, and final checks to ensure a smooth transition. Comprehensive go-live support is provided to address any immediate concerns and ensure operational stability from day one.",
      icon: Settings2,
      image: "/server-deployment-dashboard.png",
    },
    {
      id: 6,
      title: "Continuous Optimization & Proactive Support",
      description:
        "Our commitment extends beyond launch. We offer tailored ongoing support packages, proactive system monitoring, and performance analytics. We work with you to identify opportunities for optimization, feature enhancements, and scaling the solution to meet evolving business needs, ensuring sustained value and long-term success.",
      icon: RefreshCw,
      image: "/customer-support-team-collaboration.png",
    },
  ]

  const guidingPrinciples = [
    {
      title: "Client-Centricity",
      description: "Your success is our primary driver. We tailor every solution to your unique needs and goals.",
      icon: HeartHandshake,
    },
    {
      title: "Transparent Communication",
      description: "Open, honest, and frequent communication is maintained throughout the project lifecycle.",
      icon: Megaphone,
    },
    {
      title: "Agile Adaptability",
      description: "We embrace change and adapt our approach to meet evolving requirements and market dynamics.",
      icon: GitFork,
    },
    {
      title: "Uncompromising Quality",
      description: "We are committed to delivering excellence and robust solutions that stand the test of time.",
      icon: ShieldCheck,
    },
    {
      title: "Data-Driven Decisions",
      description: "We leverage data and analytics to inform strategies and optimize outcomes.",
      icon: DatabaseZap,
    },
    {
      title: "Collaborative Partnership",
      description: "We work as an extension of your team, fostering a true partnership for shared success.",
      icon: Users,
    },
  ]

  const toolsAndMethodologies = [
    "Agile (Scrum, Kanban)",
    "JIRA & Confluence",
    "Figma & Adobe XD",
    "Git & CI/CD Pipelines",
    "Automated Testing Frameworks (Selenium, Cypress)",
    "Cloud Platforms (AWS, Azure, GCP)",
    "DevOps Practices",
    "User Story Mapping",
    "Regular Stakeholder Reviews",
  ]

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/abstract-blueprint-background.png"
            alt="Abstract representation of a strategic success blueprint"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 mb-6">
            Our Client Success Blueprint
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
            A meticulously crafted, proven framework designed to navigate complex challenges and ensure your project's
            triumph from conception to sustained growth.
          </p>
        </div>
      </section>

      {/* Blueprint Overview Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-semibold text-white mb-4">The Pillars of Predictable Excellence</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Our Client Success Blueprint is more than a process; it's a commitment. This comprehensive, step-by-step
              methodology guides every engagement, built on pillars of transparency, deep collaboration, and an
              unwavering focus on delivering tangible, measurable business results.
            </p>
          </div>
          <div className="space-y-20">
            {blueprintSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col md:flex-row items-center gap-8 md:gap-12 ${index % 2 !== 0 ? "md:flex-row-reverse" : ""}`}
              >
                <div className="md:w-1/2">
                  <Image
                    src={step.image || "/placeholder.svg"}
                    alt={`Visual representation of ${step.title}`}
                    width={550}
                    height={400}
                    className="rounded-lg shadow-2xl object-cover aspect-[11/8]"
                  />
                </div>
                <div className="md:w-1/2">
                  <div className="flex items-center mb-4">
                    <step.icon size={36} className="mr-3 text-emerald-400" />
                    <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Guiding Principles Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white mb-4">Our Guiding Principles</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              These core values are embedded in every stage of our Success Blueprint, shaping how we work and ensuring
              we deliver on our promises.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guidingPrinciples.map((principle) => (
              <Card
                key={principle.title}
                className="bg-slate-800 border-slate-700 text-slate-50 p-6 transform hover:scale-105 transition-transform duration-300 shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <principle.icon size={32} className="mr-3 text-emerald-400" />
                  <h3 className="text-xl font-semibold text-white">{principle.title}</h3>
                </div>
                <p className="text-slate-300 text-sm">{principle.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tools & Methodologies Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white mb-4">Empowered by Leading Tools & Methodologies</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We leverage industry-standard tools and proven methodologies to ensure efficiency, quality, and successful
              project delivery.
            </p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <Image
                src="/tech-tools-methodologies-montage.png"
                alt="Montage of technology tools, agile methodology symbols, and collaboration software logos"
                width={500}
                height={350}
                className="rounded-lg shadow-xl object-cover"
              />
            </div>
            <div className="md:w-1/2">
              <ul className="space-y-3">
                {toolsAndMethodologies.map((tool, index) => (
                  <li key={index} className="flex items-center text-slate-300">
                    <CheckCircle className="h-5 w-5 mr-3 text-emerald-400 flex-shrink-0" />
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Case Study Spotlight Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-white mb-4">
              Blueprint in Action: TechStart Solutions E-commerce Revolution
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Discover how our Success Blueprint transformed TechStart Solutions' outdated e-commerce platform into a
              high-performing, revenue-generating powerhouse.
            </p>
          </div>
          <Card className="bg-slate-800 border-slate-700 p-8 md:p-12 shadow-xl">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-3">
                  The Challenge: Stagnation and User Frustration
                </h3>
                <p className="text-slate-300 mb-6">
                  TechStart Solutions, a promising online retailer, was grappling with declining sales and poor user
                  engagement. Their legacy e-commerce platform was slow, difficult to navigate, and lacked modern
                  features, leading to high cart abandonment rates and customer dissatisfaction.
                </p>
                <h3 className="text-2xl font-semibold text-white mb-3">Our Blueprint-Driven Solution</h3>
                <p className="text-slate-300 mb-6">
                  Applying our Success Blueprint, we initiated a thorough discovery (Step 1) to pinpoint core issues.
                  This led to a complete redesign of the user experience and a robust backend architecture (Step 2).
                  Development (Step 3) was executed in agile sprints, allowing for continuous client feedback. Rigorous
                  QA (Step 4) ensured a flawless launch (Step 5).
                </p>
                <h3 className="text-2xl font-semibold text-white mb-3">Tangible Results & Ongoing Success</h3>
                <ul className="space-y-2 text-slate-300 mb-6">
                  <li className="flex items-start">
                    <TrendingUp className="h-5 w-5 mr-2 mt-1 text-emerald-400 flex-shrink-0" />
                    <span>
                      Achieved a <strong>40% increase in conversion rates</strong> within three months post-launch.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Rocket className="h-5 w-5 mr-2 mt-1 text-emerald-400 flex-shrink-0" />
                    <span>
                      Reduced average page load times by <strong>60%</strong>, significantly enhancing user experience.
                    </span>
                  </li>
                  <li className="flex items-start">
                    <ShieldCheck className="h-5 w-5 mr-2 mt-1 text-emerald-400 flex-shrink-0" />
                    <span>
                      Decreased user-reported technical issues by <strong>50%</strong> due to improved stability.
                    </span>
                  </li>
                </ul>
                <p className="text-slate-300">
                  Through ongoing optimization and support (Step 6), TechStart Solutions continues to see growth and
                  adapt to market changes effectively.
                </p>
              </div>
              <div className="mt-8 md:mt-0">
                <Image
                  src="/ecommerce-success-dashboard-analytics.png"
                  alt="Modern dashboard interface showing positive e-commerce analytics charts and graphs for TechStart Solutions"
                  width={600}
                  height={450}
                  className="rounded-lg shadow-2xl object-cover aspect-[4/3]"
                />
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-white mb-6">Ready to Architect Your Success Story?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8">
            Let's apply our proven Client Success Blueprint to your next critical project and achieve outstanding,
            predictable results together.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition duration-300 text-lg"
            asChild
          >
            <Link href="/contact?subject=SuccessBlueprintInquiry">Partner with Us for Success</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
