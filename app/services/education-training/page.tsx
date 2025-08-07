"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap,
  Award,
  Users,
  TrendingUp,
  DollarSignIcon,
  CheckCircle,
  ArrowRight,
  BookOpen,
  Cpu,
  Briefcase,
  Building,
  Smartphone,
  Cloud,
  Settings,
  HelpCircle,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const heroStatsTraining = [
  {
    value: "87%",
    label: "Skill Improvement",
    subLabel: "Average skill advancement",
    icon: TrendingUp,
  },
  {
    value: "92%",
    label: "Knowledge Retention",
    subLabel: "After 6 months",
    icon: BookOpen,
  },
  {
    value: "340%",
    label: "ROI on Training",
    subLabel: "Within first year",
    icon: DollarSignIcon,
  },
  {
    value: "95%",
    label: "Employee Satisfaction",
    subLabel: "Training rating",
    icon: Users,
  },
];

  const courseCategories = [
    {
      id: "carpet-cleaning",
      name: "🧽 Carpet Cleaning Courses (CARSI)",
      icon: Award,
      description: "Professional carpet cleaning and drying techniques for industry professionals.",
      image: "/images/1.png",
      courses: [
        {
          name: "Introduction to Basic Carpet Cleaning and Drying – CCW",
          url: "https://carsi.com.au/product/carpet-cleaning-ccw/",
          description: "Learn carpet construction, damage effects, cleaning equipment, and drying techniques.",
          image: "/images/1.png",
        },
        {
          name: "Carpet Cleaning Basics Course – CARSI",
          url: "https://carsi.com.au/product/carpet-cleaning-basics/",
          description: "Covers safe and professional cleaning of carpets and flooring, plus chemical/environmental factors.",
          image: "/images/2.png",
        },
        {
          name: "Carpet Cleaning Basics Course – CCW x CARSI",
          url: "https://carsi.com.au/product/carpet-cleaning-basics-ccw/",
          description: "A version of the basics course in collaboration with CCW.",
          image: "/images/3.png",
        },
      ],
    },
    {
      id: "management",
      name: "🧭 Management Courses (Leadership & Business)",
      icon: Briefcase,
      description: "Leadership, operations, and business skills for industry professionals.",
      image: "/images/4.png",
      courses: [
        {
          name: "Management & Leadership Programs",
          url: "https://carsi.com.au/product-category/management/",
          description: "Comprehensive management training focused on leadership, operations, and business skills for industry professionals.",
          image: "/images/1.png",
        },
      ],
    },
    {
      id: "restoration-water",
      name: "💧 Restoration & Water Damage Courses",
      icon: Building,
      description: "Specialized courses in restoration and water damage management.",
      image: "/images/5.png",
      courses: [
        {
          name: "Drying Healthcare Facilities (Introduction to Drying in Healthcare Settings)",
          url: "https://carsi.com.au/product/drying-healthcare/",
          description: "Specialized training for drying techniques in healthcare environments.",
          image: "/images/1.png",
        },
      ],
    },
  ];

const deliveryOptions = [
  {
    title: "On-site Workshops",
    duration: "On Request",
    participants: "On Request",
    features: [
      "Hands-on labs",
      "Interactive sessions",
      "Team exercises",
      "Q&A sessions",
    ],
    icon: Users,
  },
  {
    title: "Virtual Training",
    duration: "Flexible",
    participants: "Unlimited",
    features: [
      "Live instruction",
      "Screen sharing",
      "Breakout rooms",
      "Recording available",
    ],
    icon: Smartphone,
  },
  {
    title: "Hybrid Programs",
    duration: "2-12 weeks",
    participants: "Customizable",
    features: [
      "Self-paced + live sessions",
      "Mentorship",
      "Project work",
      "Certification",
    ],
    icon: Cloud,
  },
];

const trainingPackages = [
  {
    name: "Workshop Days",
    price: "On Request",
    description: "Single-day intensive workshop for your team.",
    features: [
      "Expert-led instruction",
      "Custom curriculum",
      "Hands-on exercises",
      "Digital materials",
      "Completion certificates",
      "Follow-up resources",
    ],
    idealFor: "Quick skill boost",
    isPopular: false,
  },
  {
    name: "Learning Program - CARSI Membership",
    priceLevels: [
      {
        level: "Free Library",
        price: "Free",
        details: "Access to basic resources",
      },
      {
        level: "Foundation",
        price: "A$44/mo",
        details: "Weekly sessions, basic mentoring",
      },
      {
        level: "Growth",
        price: "A$99/mo",
        details: "Personal mentoring, project assignments, certification prep",
      },
    ],
    description: "Comprehensive learning journey with ongoing support.",
    features: [
      "Access to CARSI resources",
      "Structured learning paths",
      "Progress tracking",
    ], // Simplified for card
    idealFor: "Deep skill development",
    isPopular: true,
  },
  {
    name: "Enterprise Academy",
    price: "Coming Soon",
    description: "Build a culture of continuous learning.",
    features: [
      "Unlimited participants",
      "Custom learning paths",
      "Leadership programs",
      "Technical bootcamps",
      "Learning portal",
      "Quarterly reviews",
      "Executive briefings",
    ],
    idealFor: "Organization-wide transformation",
    isPopular: false,
  },
];

const whyTrainWithUs = [
  {
    icon: Award,
    title: "CEC's",
    description: "Obtain Cec's with our IICRC approved courses",
  },
  {
    icon: BookOpen,
    title: "Practical, Hands-on Learning",
    description:
      "Our programs emphasize practical application and skill development, not just theory.",
  },
  {
    icon: TrendingUp,
    title: "Career Advancement",
    description:
      "Gain recognized certifications and skills that enhance your professional value and career opportunities.",
  },
  {
    icon: Settings,
    title: "Customizable Solutions",
    description:
      "We tailor training programs to meet the specific needs and goals of your organization.",
  },
];

const trainingFaqs = [
  {
    id: "training-faq1",
    question: "Are your IICRC courses recognized internationally?",
    answer:
      "Yes, IICRC certifications obtained through CARSI, an IICRC Approved School, are globally recognized and respected in the restoration and cleaning industries.",
  },
  {
    id: "training-faq2",
    question: "Can you develop custom training programs for our company?",
    answer:
      "Absolutely. We specialize in creating bespoke corporate training programs tailored to your industry, company culture, specific challenges, and learning objectives. Contact us to discuss your needs.",
  },
  {
    id: "training-faq3",
    question: "What are the prerequisites for enrolling in advanced courses?",
    answer:
      "Prerequisites vary by course. Basic courses usually have no prerequisites, while advanced certifications may require completion of foundational courses or a certain amount of industry experience. Details are provided on each course page on the CARSI website.",
  },
  {
    id: "training-faq4",
    question: "Do you offer online or virtual training options?",
    answer:
      "Yes, we offer a range of delivery options including on-site workshops, live virtual training sessions, and hybrid programs that combine self-paced online learning with interactive sessions. Check the CARSI catalog for specific course formats.",
  },
];

export default function EducationTrainingPage() {
  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-amber-900/30 to-slate-950 relative"
      >
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/placeholder.svg?width=1920&height=1080"
            alt="Abstract Education Network"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <GraduationCap className="w-20 h-20 text-amber-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Expert Education & Training Services
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-6">
            Powered by <span className="font-bold text-amber-300">CARSI</span>
          </p>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Unite Group partners with CARSI to deliver world-class training and
            certifications. From IICRC restoration certifications to corporate
            leadership programs, we provide comprehensive education solutions
            that transform teams and drive business growth.
          </p>
          <div className="flex items-center justify-center space-x-4 mb-10 text-amber-300">
            <span className="flex items-center">
              <Award size={20} className="mr-2" />
              IICRC Approved School
            </span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center">
              <CheckCircle size={20} className="mr-2" />
              500+ Certifications Issued
            </span>
            <span className="text-slate-500">|</span>
            <span className="flex items-center">
              <Users size={20} className="mr-2" />
              Industry Trained Professionals
            </span>
          </div>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button
              size="lg"
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-white group"
            >
              <Link
                href="https://carsi.com.au/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View Full CARSI Catalog{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href="/contact?service=Custom%20Training%20Program">
                Design Custom Program
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Hero Stats Section */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {heroStatsTraining.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <stat.icon className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">
                  {stat.value}
                </div>
                <div className="text-slate-300 mt-1 text-md">{stat.label}</div>
                <div className="text-slate-500 text-xs">{stat.subLabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Categories Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Available Courses
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Professional certification courses through CARSI - IICRC Approved School.
            </p>
          </div>
          
          {courseCategories.map((category, categoryIdx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: categoryIdx * 0.2 }}
              viewport={{ once: true, amount: 0.2 }}
              className="mb-16 last:mb-0"
            >
              <div className="text-center mb-8">
                <category.icon className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                <h3 className="text-2xl md:text-3xl font-semibold text-white mb-3">
                  {category.name}
                </h3>
                <p className="text-slate-400 max-w-2xl mx-auto">
                  {category.description}
                </p>
              </div>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.courses.map((course, idx) => (
                  <motion.div
                    key={course.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    viewport={{ once: true, amount: 0.1 }}
                  >
                    <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg h-full hover:border-amber-500/60 transition-all duration-300 group overflow-hidden">
                      <div className="relative">
                        <Image
                          src={course.image}
                          alt={course.name}
                          width={300}
                          height={150}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                      </div>
                      <CardContent className="p-6">
                        <h4 className="text-lg font-semibold text-white mb-3 group-hover:text-amber-300 transition-colors">
                          {course.name}
                        </h4>
                        <p className="text-slate-400 text-sm mb-4 leading-relaxed">
                          {course.description}
                        </p>
                        <Button
                          asChild
                          className="w-full bg-amber-500 hover:bg-amber-600 text-white group"
                        >
                          <Link
                            href={course.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View Course Details
                            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* View All Courses Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <BookOpen className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Explore Our Full Course Catalogue
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-8">
              Discover 85+ professional courses covering all aspects of restoration, cleaning, and business management.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-4xl mx-auto">
              {[
                { name: "Admin Courses", count: "Essential Skills for Restoration Managers" },
                { name: "Technician Courses", count: "Expert Training for Restoration Techs" },
                { name: "Face-to-Face Courses", count: "In-Person Training by CARSI" },
                { name: "Free Courses", count: "Start Learning Restoration with CARSI" },
              ].map((category, idx) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="bg-slate-800/50 p-4 rounded-lg text-center"
                >
                  <h4 className="text-amber-400 font-semibold mb-1">{category.name}</h4>
                  <p className="text-slate-400 text-sm">{category.count}</p>
                </motion.div>
              ))}
            </div>
            <Button
              size="lg"
              asChild
              className="bg-amber-500 hover:bg-amber-600 text-white group text-lg px-8 py-6"
            >
              <Link
                href="https://carsi.com.au/product-category/view-all/"
                target="_blank"
                rel="noopener noreferrer"
              >
                View All 85+ Courses
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why Train With Us Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Lightbulb className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Why Train With Unite Group & CARSI?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Invest in training that delivers tangible skills and recognized
              credentials.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyTrainWithUs.map((item, idx) => (
              <motion.div
                key={item.title}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training FAQs Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <HelpCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Training FAQs
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Common questions about our education and training programs.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {trainingFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 border-slate-700/80 rounded-lg mb-3 px-2"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle
                      size={20}
                      className="text-amber-400 mr-3 flex-shrink-0"
                    />
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

      {/* Flexible Delivery Options Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Settings className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Flexible Delivery Options
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Choose the format that works best for your team and schedule.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {deliveryOptions.map((option, idx) => (
              <motion.div
                key={option.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg h-full text-center hover:border-amber-500/60 transition-colors">
                  <CardHeader>
                    <option.icon className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                    <CardTitle className="text-xl text-white">
                      {option.title}
                    </CardTitle>
                    <CardDescription className="text-slate-400 text-sm">
                      Duration: {option.duration} • Participants:{" "}
                      {option.participants}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1 text-sm text-slate-300">
                      {option.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Packages Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <DollarSignIcon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Training Packages
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Investment in your team's future starts here.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {trainingPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
                className="flex"
              >
                <Card
                  className={`w-full flex flex-col bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl relative overflow-hidden ${
                    pkg.isPopular
                      ? "border-2 border-amber-500 shadow-amber-500/30"
                      : "border-slate-700"
                  }`}
                >
                  {pkg.isPopular && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="pt-8">
                    <CardTitle className="text-2xl font-semibold text-white mb-1">
                      {pkg.name}
                    </CardTitle>
                    {pkg.priceLevels ? (
                      <div className="mb-2">
                        {pkg.priceLevels.map((level) => (
                          <div
                            key={level.level}
                            className="text-amber-300 mt-1"
                          >
                            <span className="font-semibold text-lg">
                              {level.level}:
                            </span>{" "}
                            <span className="text-2xl font-bold">
                              {level.price}
                            </span>
                            <p className="text-xs text-slate-400">
                              {level.details}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-amber-300 mb-2">
                        {pkg.price}
                      </p>
                    )}
                    <CardDescription className="text-slate-400 text-sm min-h-[40px]">
                      {pkg.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <ul className="space-y-2.5 mb-6 flex-grow">
                      {pkg.features.map((feature, fIdx) => (
                        <li
                          key={fIdx}
                          className="flex items-start text-sm text-slate-300"
                        >
                          <CheckCircle
                            size={18}
                            className="text-amber-400 mr-2.5 mt-0.5 flex-shrink-0"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-500 mb-4">
                      Ideal for: {pkg.idealFor}
                    </p>
                    <Button
                      asChild
                      className={`w-full font-semibold text-lg py-3 mt-auto ${
                        pkg.isPopular
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : "bg-slate-700 hover:bg-slate-600 text-slate-100"
                      }`}
                    >
                      <Link
                        href={`/contact?service=Education%20Training&package=${pkg.name}`}
                      >
                        {pkg.price === "Coming Soon"
                          ? "Learn More"
                          : "Get Started"}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-slate-900">
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            Invest in Your Team's Potential
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Empower your workforce with the skills and knowledge to drive
            innovation and achieve your business objectives. Let's design a
            training program that delivers results.
          </p>
          <Button
            size="lg"
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-white group text-lg px-10 py-7"
          >
            <Link href="/contact?service=Custom%20Training%20Program">
              Discuss Custom Training{" "}
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
