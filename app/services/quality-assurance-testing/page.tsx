"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  DollarSignIcon,
  Zap,
  BarChart,
  ThumbsUp,
  Search,
  FileText,
  Settings,
  Cpu,
  ListChecks,
  FlaskConical,
  Eye,
  HelpCircle,
  Briefcase,
  Lightbulb,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const heroStatsQA = [
  { value: "98%", label: "Defect Detection Rate", icon: TrendingUp },
  { value: "95%", label: "Test Coverage", icon: BarChart },
  { value: "80%", label: "Automation Coverage", icon: Zap },
  { value: "99.9%", label: "Critical Bug Prevention", icon: ThumbsUp },
]

const testingServices = [
  {
    title: "Manual Testing",
    icon: Eye,
    description: "Thorough human-driven testing to catch what automation misses.",
    items: [
      "Functional testing",
      "Usability testing",
      "Exploratory testing",
      "User acceptance testing",
      "Cross-browser testing",
      "Mobile device testing",
    ],
  },
  {
    title: "Test Automation",
    icon: Zap,
    description: "Efficient automated testing for faster releases and better coverage.",
    items: [
      "UI automation",
      "API testing",
      "Integration testing",
      "Regression testing",
      "CI/CD integration",
      "Test framework development",
    ],
  },
  {
    title: "Performance Testing",
    icon: TrendingUp,
    description: "Ensure your application performs under real-world conditions.",
    items: [
      "Load testing",
      "Stress testing",
      "Scalability testing",
      "Volume testing",
      "Spike testing",
      "Performance optimization",
    ],
  },
  {
    title: "Security Testing",
    icon: ShieldCheck,
    description: "Identify vulnerabilities before hackers do.",
    items: [
      "Vulnerability assessment",
      "Penetration testing",
      "Security code review",
      "OWASP compliance",
      "Authentication testing",
      "Data protection validation",
    ],
  },
]

const qaProcessSteps = [
  {
    number: "01",
    title: "Requirements Analysis",
    description:
      "Understanding your quality goals and defining test criteria. Includes test planning, risk assessment, and coverage definition.",
    icon: Search,
  },
  {
    number: "02",
    title: "Test Design",
    description:
      "Creating comprehensive test cases and scenarios. Involves test case creation, test data preparation, and environment setup.",
    icon: FileText,
  },
  {
    number: "03",
    title: "Test Execution",
    description:
      "Running tests and documenting results through manual execution, automated testing, and bug reporting.",
    icon: Settings,
  },
  {
    number: "04",
    title: "Results & Optimization",
    description:
      "Analyzing results and improving quality via defect analysis, performance tuning, and process improvement.",
    icon: CheckCircle,
  },
]

const testingTools = [
  { name: "Selenium", category: "Automation" },
  { name: "Cypress", category: "Automation" },
  { name: "Jest", category: "Automation" },
  { name: "Postman", category: "API Testing" },
  { name: "JMeter", category: "Performance" },
  { name: "LoadRunner", category: "Performance" },
  { name: "Appium", category: "Mobile Testing" },
  { name: "TestRail", category: "Test Management" },
  { name: "BrowserStack", category: "Cross-browser" },
  { name: "Jenkins", category: "CI/CD" },
  { name: "OWASP ZAP", category: "Security" },
  { name: "Burp Suite", category: "Security" },
]

const qaPackages = [
  {
    name: "Essential QA",
    price: "A$3,000/project",
    description: "Core testing for small to medium projects.",
    features: [
      "Functional testing",
      "Basic UI/UX testing",
      "Browser compatibility",
      "Test documentation",
      "Bug tracking setup",
      "30-day support",
    ],
    bestFor: "MVPs, small applications",
    isPopular: false,
  },
  {
    name: "Comprehensive Testing",
    price: "A$8,000/project",
    description: "Full testing suite for complex applications.",
    features: [
      "Everything in Essential",
      "Test automation setup",
      "Performance testing",
      "Security assessment",
      "API testing",
      "Regression test suite",
      "90-day support",
    ],
    bestFor: "Enterprise applications",
    isPopular: true,
  },
  {
    name: "Continuous QA",
    price: "A$5,000/month",
    description: "Ongoing testing partnership for continuous delivery.",
    features: [
      "Dedicated QA team",
      "Full test automation",
      "CI/CD integration",
      "Performance monitoring",
      "Security scanning",
      "Weekly reporting",
      "Unlimited testing",
    ],
    bestFor: "Agile teams, SaaS products",
    isPopular: false,
  },
]

const whyChooseUsQA = [
  {
    icon: ListChecks,
    title: "Comprehensive Coverage",
    description: "Our multi-layered testing approach ensures all aspects of your software are thoroughly vetted.",
  },
  {
    icon: Users,
    title: "Dedicated QA Experts",
    description: "Experienced QA engineers who are passionate about quality and meticulous in their work.",
  },
  {
    icon: Zap,
    title: "Efficiency through Automation",
    description: "We leverage smart automation to accelerate testing cycles and improve accuracy.",
  },
  {
    icon: Lightbulb,
    title: "Proactive Defect Prevention",
    description: "Our process focuses on identifying and mitigating risks early in the development lifecycle.",
  },
]

const qaFaqs = [
  {
    id: "qa-faq1",
    question: "What types of applications can you test?",
    answer:
      "We test a wide range of applications, including web applications (SaaS, e-commerce, portals), mobile apps (iOS, Android, cross-platform), APIs, and desktop software. Our expertise covers various industries and complexities.",
  },
  {
    id: "qa-faq2",
    question: "How do you integrate QA into an agile development process?",
    answer:
      "We embed QA throughout the agile sprint cycle. This includes participating in sprint planning, daily stand-ups, and retrospectives. Testing is performed continuously on new features and regression suites are run frequently to catch issues early.",
  },
  {
    id: "qa-faq3",
    question: "What is the difference between Quality Assurance (QA) and Quality Control (QC)?",
    answer:
      "Quality Assurance (QA) is process-oriented and focuses on preventing defects by improving development and testing processes. Quality Control (QC) is product-oriented and focuses on identifying defects in the actual product through testing.",
  },
  {
    id: "qa-faq4",
    question: "Can you help set up a test automation framework from scratch?",
    answer:
      "Yes, we have extensive experience in designing and implementing test automation frameworks tailored to project needs, using tools like Selenium, Cypress, Appium, etc. This includes selecting the right tools, setting up infrastructure, and training your team.",
  },
]

export default function QualityAssurancePage() {
  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-teal-900/30 to-slate-950 relative"
      >
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/abstract-quality-assurance-shield.png"
            alt="Abstract QA Shield"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ShieldCheck className="w-20 h-20 text-teal-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Quality Assurance & Testing
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Ship with confidence. Our comprehensive QA services ensure your software performs flawlessly, delights
            users, and stands up to real-world demands.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-teal-500 hover:bg-teal-600 text-white group">
              <Link href="/contact?service=Quality%20Assurance%20Testing&action=qa_assessment">
                Get QA Assessment <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href="#our-process">View Our Process</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Hero Stats Section */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {heroStatsQA.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <stat.icon className="w-10 h-10 text-teal-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-400 mt-1 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive Testing Services Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <ListChecks className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Comprehensive Testing Services</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Multi-layered testing approach to ensure quality at every level.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testingServices.map((service, idx) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg h-full hover:border-teal-500/60 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <service.icon className="w-10 h-10 text-teal-400" />
                      <CardTitle className="text-2xl text-white">{service.title}</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.items.map((item) => (
                        <li key={item} className="flex items-center text-slate-300 text-sm">
                          <CheckCircle size={16} className="text-teal-400 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Unite Group for QA Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Briefcase className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Why Choose Unite Group for QA & Testing?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Ensure software excellence with our meticulous and expert QA services.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsQA.map((item, idx) => (
              <motion.div
                key={item.title}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-teal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QA & Testing FAQs Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <HelpCircle className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">QA & Testing FAQs</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Your questions about our quality assurance processes answered.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {qaFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 border-slate-700/80 rounded-lg mb-3 px-2"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle size={20} className="text-teal-400 mr-3 flex-shrink-0" />
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-slate-300 text-sm leading-relaxed pb-4 px-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Our QA Process Section */}
      <section id="our-process" className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <FlaskConical className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our QA Process</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Systematic approach to delivering bug-free software.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {qaProcessSteps.map((step, idx) => (
              <motion.div
                key={step.title}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center flex flex-col items-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="relative w-16 h-16 flex items-center justify-center bg-slate-700 text-teal-400 rounded-full text-2xl font-bold mb-4 border-2 border-teal-500/50">
                  {step.number}
                </div>
                <step.icon className="w-8 h-8 text-teal-400 mb-2" />
                <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-sm text-slate-400 flex-grow">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testing Tools & Technologies Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Cpu className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Testing Tools & Technologies</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Industry-leading tools for comprehensive quality assurance.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {testingTools.map((tool, idx) => (
              <motion.div
                key={tool.name}
                className="bg-slate-800/60 p-4 rounded-lg shadow-md text-center border border-slate-700/50"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                viewport={{ once: true, amount: 0.1 }}
              >
                <h4 className="font-semibold text-white text-sm">{tool.name}</h4>
                <p className="text-xs text-teal-300">{tool.category}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QA Service Packages Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <DollarSignIcon className="w-12 h-12 text-teal-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">QA Service Packages</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Flexible testing solutions for every project size and budget.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {qaPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
                className="flex"
              >
                <Card
                  className={`w-full flex flex-col bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl relative overflow-hidden ${pkg.isPopular ? "border-2 border-teal-500 shadow-teal-500/30" : "border-slate-700"}`}
                >
                  {pkg.isPopular && (
                    <div className="absolute top-0 right-0 bg-teal-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                      Recommended
                    </div>
                  )}
                  <CardHeader className="pt-8">
                    <CardTitle className="text-2xl font-semibold text-white mb-1">{pkg.name}</CardTitle>
                    <p className="text-3xl font-bold text-teal-300 mb-2">{pkg.price}</p>
                    <CardDescription className="text-slate-400 text-sm min-h-[40px]">{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <ul className="space-y-2.5 mb-6 flex-grow">
                      {pkg.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm text-slate-300">
                          <CheckCircle size={18} className="text-teal-400 mr-2.5 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-500 mb-4">Best for: {pkg.bestFor}</p>
                    <Button
                      asChild
                      className={`w-full font-semibold text-lg py-3 mt-auto ${pkg.isPopular ? "bg-teal-500 hover:bg-teal-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-100"}`}
                    >
                      <Link href={`/contact?service=Quality%20Assurance%20Testing&package=${pkg.name}`}>
                        Get Started
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Free Assessment CTA Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-teal-500/20 to-cyan-500/20 p-8 md:p-12 rounded-xl shadow-2xl text-center">
            <h2 className="text-3xl font-semibold text-white mb-3">Stop Shipping Bugs. Start Shipping Excellence.</h2>
            <p className="text-slate-300 text-lg max-w-xl mx-auto mb-8">
              Get a free quality assessment and discover how we can improve your software quality while reducing testing
              time and costs.
            </p>
            <Button size="xl" asChild className="bg-teal-500 hover:bg-teal-600 text-white group text-lg px-10 py-7">
              <Link href="/contact?service=Quality%20Assurance%20Testing&action=qa_assessment">
                Get Free Assessment{" "}
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <p className="mt-6 text-sm text-slate-400">
              🐛 98% bug detection rate • ⚡ 50% faster testing • 🛡️ Zero critical defects
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
