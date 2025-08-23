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

  const courses = [
    {
      id: "carpet-cleaning",
      name: "Carpet Cleaning Basics Course",
      url: "https://carsi.com.au/product-category/view-all/",
      description: "Carpet and Upholstery Cleaning Courses",
      image: "/images/image1.jpg",
      icon: Award,
    },
    {
      id: "admin-management",
      name: "Business Management Fundamentals",
      url: "https://carsi.com.au/product-category/view-all/",
      description: "Admin, Marketing and Management Courses",
      image: "/images/image4.png",
      icon: Briefcase,
    },
    {
      id: "health-infectious",
      name: "Infection Control Fundamentals",
      url: "https://carsi.com.au/product-category/view-all/",
      description: "Health and Infectious Cleaning Courses",
      image: "/images/image3.jpg",
      icon: Building,
    },
    {
      id: "air-quality",
      name: "Air Quality Fundamentals",
      url: "https://carsi.com.au/product-category/view-all/",
      description: "Air Quality Courses",
      image: "/images/image4.jpg",
      icon: Cloud,
    },
    {
      id: "mould-remediation",
      name: "Mould Remediation Fundamentals",
      url: "https://carsi.com.au/product-category/view-all/",
      description: "Mould and Water Remediation Courses",
      image: "/images/image5.jpg",
      icon: Building,
    },
    {
      id: "workplace-safety",
      name: "Workplace Safety Standards",
      url: "https://carsi.com.au/product-category/view-all/",
      description: "Workplace Health and Safety Courses",
      image: "/images/image6.jpg",
      icon: Settings,
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

// const trainingPackages = [
//   {
//     name: "Workshop Days",
//     price: "On Request",
//     description: "Single-day intensive workshop for your team.",
//     features: [
//       "Expert-led instruction",
//       "Custom curriculum",
//       "Hands-on exercises",
//       "Digital materials",
//       "Completion certificates",
//       "Follow-up resources",
//     ],
//     idealFor: "Quick skill boost",
//     isPopular: false,
//   },
//   {
//     name: "Learning Program - CARSI Membership",
//     priceLevels: [
//       {
//         level: "Free Library",
//         price: "Free",
//         details: "Access to basic resources",
//       },
//       {
//         level: "Foundation",
//         price: "A$44/mo",
//         details: "Weekly sessions, basic mentoring",
//       },
//       {
//         level: "Growth",
//         price: "A$99/mo",
//         details: "Personal mentoring, project assignments, certification prep",
//       },
//     ],
//     description: "Comprehensive learning journey with ongoing support.",
//     features: [
//       "Access to CARSI resources",
//       "Structured learning paths",
//       "Progress tracking",
//     ],
//     idealFor: "Deep skill development",
//     isPopular: true,
//   },
//   {
//     name: "Enterprise Academy",
//     price: "Coming Soon",
//     description: "Build a culture of continuous learning.",
//     features: [
//       "Unlimited participants",
//       "Custom learning paths",
//       "Leadership programs",
//       "Technical bootcamps",
//       "Learning portal",
//       "Quarterly reviews",
//       "Executive briefings",
//     ],
//     idealFor: "Organization-wide transformation",
//     isPopular: false,
//   },
// ];

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

const trainingAdvantages = [
  {
    icon: Award,
    title: "IICRC Approved School",
    description: "Obtain IICRC certifications with our approved courses.",
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
        className="py-20 md:py-32 relative overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
            style={{
              backgroundImage: 'url(/images/training.png)'
            }}
          ></div>
          
          {/* Minimal overlay for text readability */}
          <div className="absolute inset-0 bg-slate-950/20"></div>
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
      <section className="py-16 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/35 via-transparent to-teal-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-emerald-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-br from-emerald-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/22 to-emerald-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 left-12 w-18 h-18 border-2 border-emerald-400/50 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent"
            animate={{ 
              x: [0, 12, 0], 
              y: [0, -10, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 right-12 w-14 h-14 border-2 border-teal-400/45 bg-gradient-to-br from-teal-500/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, -10, 0], 
              y: [0, 15, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {heroStatsTraining.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Course Categories Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/25 via-transparent to-teal-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-emerald-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-500/18 to-teal-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-teal-500/15 to-emerald-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 18, 0], scale: [1, 0.98, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-emerald-400/50 to-teal-400/50 rounded-full"
            animate={{ 
              y: [0, -18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-400/50 to-emerald-400/50 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our Training Courses</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Comprehensive training programs designed to enhance your skills and advance your career.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map((course, idx) => (
              <motion.div
                key={course.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-lg shadow-xl border border-slate-700/30 hover:border-emerald-500/40 transition-colors overflow-hidden"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="relative h-64">
                  <Image
                    src={course.image}
                    alt={course.description}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent to-slate-900/80" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-3">{course.description}</h3>
                  <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                    <Link href={course.url}>Learn More</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* View All Courses Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
            style={{
              backgroundImage: 'url(/images/training.png)'
            }}
          ></div>
          
          {/* Minimal overlay for text readability */}
          <div className="absolute inset-0 bg-slate-950/20"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-emerald-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/22 to-emerald-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-emerald-400/50 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent"
            animate={{ 
              x: [0, -15, 0], 
              y: [0, -12, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-teal-400/45 bg-gradient-to-br from-teal-500/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 12, 0], 
              y: [0, 18, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Explore All Training Options</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Access our complete catalog of professional training courses and certifications.
            </p>
          </div>
          <div className="text-center">
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-slate-700/30 hover:border-emerald-500/40 transition-colors"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              <BookOpen className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-white mb-4">Complete Course Catalog</h3>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                Discover our full range of training programs, from foundational courses to advanced certifications. 
                All courses are designed to meet industry standards and help you achieve your professional goals.
              </p>
              <Button size="lg" asChild className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Link href="https://carsi.com.au/product-category/view-all/" target="_blank" rel="noopener noreferrer">
                  View All Courses
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why Train With Us Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/35 via-transparent to-teal-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-emerald-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-emerald-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/22 to-emerald-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-emerald-400/50 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent"
            animate={{ 
              x: [0, -15, 0], 
              y: [0, -12, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-teal-400/45 bg-gradient-to-br from-teal-500/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 12, 0], 
              y: [0, 18, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Why Train With Us?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Choose Unite Group for your professional development and career advancement.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {trainingAdvantages.map((advantage, idx) => (
              <motion.div
                key={advantage.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl text-center border border-slate-700/30 hover:border-emerald-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <advantage.icon className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{advantage.title}</h3>
                <p className="text-slate-300 text-sm">{advantage.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training FAQs Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/20 via-transparent to-teal-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-emerald-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/15 via-transparent to-slate-700/25"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-56 h-56 bg-gradient-to-br from-emerald-500/15 to-teal-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-gradient-to-tl from-teal-500/12 to-emerald-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 0.98, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-emerald-400/40 to-teal-400/40 rounded-full"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-gradient-to-r from-teal-400/40 to-emerald-400/40 rounded-full"
            animate={{ 
              y: [0, 10, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <HelpCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Training FAQs</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Answers to common questions about our training programs and certifications.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {trainingFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700/80 rounded-lg mb-3 px-2 hover:border-emerald-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle size={20} className="text-emerald-400 mr-3 flex-shrink-0" />
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
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/35 via-transparent to-teal-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-emerald-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-emerald-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/22 to-emerald-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-emerald-400/50 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent"
            animate={{ 
              x: [0, -15, 0], 
              y: [0, -12, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-teal-400/45 bg-gradient-to-br from-teal-500/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 12, 0], 
              y: [0, 18, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Flexible Delivery Options</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Choose the learning format that best fits your schedule and learning style.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {deliveryOptions.map((option, idx) => (
              <motion.div
                key={option.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700/30 hover:border-emerald-500/40 transition-colors text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <option.icon className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">{option.title}</h3>
                <p className="text-slate-300 mb-4">Duration: {option.duration} • Participants: {option.participants}</p>
                <ul className="text-sm text-slate-400 space-y-1">
                  {option.features.map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Packages Section */}
      {/*
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/25 via-transparent to-teal-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-emerald-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/20 via-transparent to-slate-700/30"></div>
          
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-500/18 to-teal-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-teal-500/15 to-emerald-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 18, 0], scale: [1, 0.98, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          <motion.div
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-emerald-400/50 to-teal-400/50 rounded-full"
            animate={{ 
              y: [0, -18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-400/50 to-emerald-400/50 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Training Packages</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Choose the training solution that best fits your learning goals and budget.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {trainingPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.name}
                className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-slate-700/30 hover:border-emerald-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-2">{pkg.name}</h3>
                  {pkg.priceLevels ? (
                    <div className="space-y-2">
                      {pkg.priceLevels.map((level, levelIdx) => (
                        <div key={levelIdx} className="text-center">
                          <div className="text-lg font-semibold text-emerald-400">{level.level}</div>
                          <div className="text-2xl font-bold text-emerald-400">{level.price}</div>
                          <div className="text-sm text-slate-400">{level.details}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-3xl font-bold text-emerald-400 mb-2">{pkg.price}</div>
                  )}
                  <p className="text-slate-300 text-sm mt-2">{pkg.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle size={16} className="text-emerald-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/40 via-transparent to-teal-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-transparent to-emerald-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/35 via-transparent to-slate-700/45"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-emerald-500/30 to-teal-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/25 to-emerald-500/30 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 35, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 35,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 7,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-emerald-400/55 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent"
            animate={{ 
              x: [0, -20, 0], 
              y: [0, -15, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-teal-400/50 bg-gradient-to-br from-teal-500/20 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 18, 0], 
              y: [0, 22, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-emerald-400/60 to-teal-400/60 rounded-full shadow-lg shadow-emerald-400/40"
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-teal-400/60 to-emerald-400/60 rounded-full shadow-lg shadow-teal-400/40"
            animate={{ 
              y: [0, 25, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Start Learning Today
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            Ready to Advance Your Career?
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Join thousands of professionals who have transformed their careers with our training programs.
          </p>
          <Button size="lg" asChild className="bg-emerald-500 hover:bg-emerald-600 text-white group text-lg px-10 py-7">
            <Link href="/contact?service=Education%20Training">
              Get Started{" "}
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
