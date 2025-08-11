"use client";

import { useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useActionState } from "react";
import { motion } from "framer-motion";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  Clock,
  Briefcase,
  DollarSignIcon,
  Send,
  Search,
  PhoneCall,
  FileTextIcon,
  CheckCircle,
  Lightbulb,
  Users,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { submitContactForm } from "./actions";
import { services } from "@/lib/services-data"; // Re-using services data
import { cn } from "@/lib/utils";

const contactFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  company: z.string().optional(),
  serviceInterestedIn: z.string().min(1, "Please select a service"),
  budgetRange: z.string().min(1, "Please select a budget range"),
  projectTimeline: z.enum(["ASAP", "1-3 months", "3-6 months", "6+ months"], {
    required_error: "Project timeline is required",
  }),
  projectDescription: z
    .string()
    .min(10, "Please provide a brief project description (min. 10 characters)"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

const budgetOptions = [
  "Under A$5,000",
  "A$5,000 - A$15,000",
  "A$15,000 - A$30,000",
  "A$30,000 - A$50,000",
  "A$50,000+",
  "Not Sure Yet",
];

const timelineOptions: {
  value: ContactFormValues["projectTimeline"];
  label: string;
}[] = [
  { value: "ASAP", label: "ASAP" },
  { value: "1-3 months", label: "1-3 Months" },
  { value: "3-6 months", label: "3-6 Months" },
  { value: "6+ months", label: "6+ Months" },
];

const contactDetails = [
  {
    icon: MailIcon,
    title: "Email",
    lines: ["unitegroup.in@gmail.com", "24 hours Response"], // Corrected email
    href: "mailto:unitegroup.in@gmail.com",
  },
  {
    icon: MapPinIcon,
    title: "Office",
    lines: ["Brisbane, QLD"],
  },
  {
    icon: Clock,
    title: "Business Hours",
    lines: ["Mon - Fri: 8:00 AM - 5:00 PM AEST"],
  },
];

const whatHappensNextSteps = [
  {
    icon: Search,
    title: "We Review",
    description:
      "Our team reviews your requirements and prepares a customized approach.",
  },
  {
    icon: PhoneCall,
    title: "We Connect",
    description: "We'll schedule a call to discuss your project in detail.",
  },
  {
    icon: FileTextIcon,
    title: "We Deliver",
    description:
      "Get a comprehensive proposal with timeline and investment details.",
  },
];

const whyPartnerItems = [
  {
    icon: CheckCircle,
    text: "Proven track record of delivering transformative results.",
  },
  {
    icon: Lightbulb,
    text: "Innovative solutions tailored to your unique business needs.",
  },
  { icon: Users, text: "Dedicated team of experts committed to your success." },
  {
    icon: DollarSignIcon,
    text: "Transparent pricing and focus on maximizing your ROI.",
  },
];

const contactFaqs = [
  {
    id: "contact-faq1",
    question: "What information should I include in my project description?",
    answer:
      "Please provide as much detail as possible, including your project goals, specific challenges you're facing, any existing systems or technologies involved, and your expected outcomes. The more information you give us, the better we can tailor our initial response.",
  },
  {
    id: "contact-faq2",
    question: "How long does it take to get a proposal?",
    answer:
      "After our initial connection call (Step 2), where we discuss your project in detail, you can typically expect a comprehensive proposal within 3-5 business days, depending on the complexity of your requirements.",
  },
  {
    id: "contact-faq3",
    question: "Do you offer consultations for projects outside Australia?",
    answer:
      "Yes, while we are based in Australia, we serve clients globally. We are equipped to handle remote consultations and project delivery for international businesses. Please specify your location when you get in touch.",
  },
];

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(
    submitContactForm,
    null
  );

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      company: "",
      serviceInterestedIn: "",
      budgetRange: "",
      projectTimeline: undefined,
      projectDescription: "",
    },
  });

  useEffect(() => {
    if (state?.success) {
      form.reset();
    }
  }, [state, form]);

  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden"
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/25 via-transparent to-violet-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-purple-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/20 via-transparent to-slate-700/30"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/25 via-transparent to-purple-800/20"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-purple-500/20 to-violet-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-violet-500/18 to-purple-500/20 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.85, 1] }}
            transition={{
              duration: 35,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 8,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-purple-400/45 rounded-full bg-gradient-to-br from-purple-500/18 to-transparent"
            animate={{ 
              x: [0, -18, 0], 
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-violet-400/40 bg-gradient-to-br from-violet-500/15 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 15, 0], 
              y: [0, 20, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Star Shapes - Unique to contact page */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-16 h-16 border-2 border-purple-300/50 bg-gradient-to-br from-purple-400/20 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }}
            animate={{ 
              x: [0, 20, 0], 
              y: [0, -25, 0], 
              rotate: [0, 180, 0],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-12 h-12 border-2 border-violet-300/50 bg-gradient-to-br from-violet-400/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }}
            animate={{ 
              x: [0, -18, 0], 
              y: [0, 25, 0], 
              rotate: [0, -180, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-4 h-4 bg-gradient-to-r from-purple-400/60 to-violet-400/60 rounded-full shadow-lg shadow-purple-400/30"
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-violet-400/60 to-purple-400/60 rounded-full shadow-lg shadow-violet-400/30"
            animate={{ 
              y: [0, 25, 0],
              opacity: [0.7, 1, 0.7],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <motion.div
            className="absolute top-2/3 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-purple-300/70 to-violet-300/70 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          <motion.div
            className="absolute bottom-2/3 right-1/3 w-2 h-2 bg-gradient-to-r from-violet-300/70 to-purple-300/70 rounded-full"
            animate={{ 
              y: [0, 18, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 7,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Get in Touch
          </motion.h1>
          <motion.p 
            className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Ready to transform your business? Let's discuss how Unite Group can
            help you achieve your goals.
          </motion.p>
        </div>
      </motion.section>

      {/* Contact Information Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/15 via-transparent to-violet-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/25 via-transparent to-purple-900/18"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/12 via-transparent to-slate-700/20"></div>
          
          {/* Subtle Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-br from-purple-500/12 to-violet-500/10 rounded-full filter blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-violet-500/10 to-purple-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Floating Dots */}
          <motion.div
            className="absolute top-1/6 right-1/4 w-2 h-2 bg-purple-400/50 rounded-full"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-1/4 w-1.5 h-1.5 bg-violet-400/50 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {contactDetails.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <Card className="bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl h-full text-center hover:border-purple-500/30 hover:shadow-purple-500/20 transition-all duration-300 group">
                  <CardHeader className="items-center">
                    <div className="p-3 bg-cyan-500/10 rounded-full mb-3 group-hover:bg-purple-500/15 transition-colors duration-300">
                      <item.icon className="w-8 h-8 text-cyan-400 group-hover:text-purple-400 transition-colors duration-300" />
                    </div>
                    <CardTitle className="text-xl text-white">
                      {item.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {item.lines.map((line) => (
                      <p key={line} className="text-slate-300 text-sm">
                        {item.href && item.lines.indexOf(line) === 0 ? (
                          <a
                            href={item.href}
                            className="hover:text-purple-400 transition-colors"
                          >
                            {line}
                          </a>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact-form" className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/20 via-transparent to-violet-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-purple-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/18 via-transparent to-slate-700/25"></div>
          
          {/* Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-72 h-72 bg-gradient-to-br from-purple-500/15 to-violet-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-violet-500/12 to-purple-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Shapes */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-purple-400/35 rounded-full bg-gradient-to-br from-purple-500/15 to-transparent"
            animate={{ 
              x: [0, -12, 0], 
              y: [0, -10, 0], 
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-violet-400/30 bg-gradient-to-br from-violet-500/12 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 15, 0], 
              y: [0, 18, 0], 
              rotate: [0, -60, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-purple-400/50 to-violet-400/50 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-gradient-to-r from-violet-400/50 to-purple-400/50 rounded-full"
            animate={{ 
              y: [0, 18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Start Your Journey
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Fill out the form below and we'll get back to you within 24
              business hours.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Card className="bg-slate-800/70 backdrop-blur-sm p-6 sm:p-8 md:p-10 border-slate-700/60 shadow-2xl hover:border-purple-500/30 hover:shadow-purple-500/20 transition-all duration-300">
            <CardContent className="p-0">
              <Form {...form}>
                <form
                  action={formAction}
                    onSubmit={form.handleSubmit((data) => {
                      const formData = new FormData();
                      Object.entries(data).forEach(([key, value]) => {
                        if (value) formData.append(key, value);
                      });
                      formAction(formData);
                    })}
                  className="space-y-8"
                >
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">
                            First Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="John"
                              {...field}
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">
                            Last Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Doe"
                              {...field}
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Email *
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="john@company.com"
                            {...field}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">
                            Phone (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="+1 (555) 123-4567"
                              {...field}
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">
                            Company (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acme Corporation"
                              {...field}
                              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="serviceInterestedIn"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">
                            Service Interested In *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              {services.map((service) => (
                                <SelectItem
                                  key={service.id}
                                  value={service.title}
                                  className="hover:bg-slate-700"
                                >
                                  {service.title}
                                </SelectItem>
                              ))}
                              <SelectItem
                                value="Other"
                                className="hover:bg-slate-700"
                              >
                                Other / Not Sure
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budgetRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-300">
                            Budget Range *
                          </FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                                <SelectValue placeholder="Select budget range" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                              {budgetOptions.map((budget) => (
                                <SelectItem
                                  key={budget}
                                  value={budget}
                                  className="hover:bg-slate-700"
                                >
                                  {budget}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="projectTimeline"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-slate-300">
                          Project Timeline *
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4"
                          >
                            {timelineOptions.map((option) => (
                              <FormItem
                                key={option.value}
                                className="flex items-center space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <RadioGroupItem
                                    value={option.value}
                                    className="border-slate-500 text-cyan-500 focus:ring-cyan-500"
                                  />
                                </FormControl>
                                <FormLabel className="font-normal text-slate-300">
                                  {option.label}
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="projectDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300">
                          Tell us about your project *
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Please describe your project goals, challenges, and how we can help..."
                            rows={5}
                            {...field}
                            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold text-lg py-3.5 group"
                    disabled={isPending}
                  >
                    {isPending ? "Sending..." : "Send Message"}
                    {!isPending && (
                      <Send
                        size={20}
                        className="ml-2 group-hover:translate-x-1 transition-transform"
                      />
                    )}
                  </Button>

                  {state && (
                    <div
                      className={cn(
                        "mt-4 text-center p-3 rounded-md text-sm",
                        state.success
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      )}
                    >
                      {state.message}
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
          </motion.div>
        </div>
      </section>

      {/* What Happens Next Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-violet-900/15 via-transparent to-purple-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/25 via-transparent to-violet-900/18"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-900/12 via-transparent to-slate-700/20"></div>
          
          {/* Subtle Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-br from-violet-500/12 to-purple-500/10 rounded-full filter blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-purple-500/10 to-violet-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Floating Dots */}
          <motion.div
            className="absolute top-1/6 right-1/4 w-2 h-2 bg-violet-400/50 rounded-full"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-1/4 w-1.5 h-1.5 bg-purple-400/50 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              What Happens Next?
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              We're excited to learn about your project. Here's our simple
              process to get started.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {whatHappensNextSteps.map((step, idx) => (
              <motion.div
                key={step.title}
                className="bg-slate-800/70 backdrop-blur-sm p-8 rounded-xl shadow-xl border border-slate-700/50 hover:border-purple-500/30 hover:shadow-purple-500/20 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.15 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="relative mb-6">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-700 text-cyan-400 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 border-slate-950">
                    {idx + 1}
                  </div>
                  <step.icon className="w-12 h-12 text-cyan-400 mx-auto mt-8" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2 mt-4">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Location Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/20 via-transparent to-violet-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-purple-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/18 via-transparent to-slate-700/25"></div>
          
          {/* Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-72 h-72 bg-gradient-to-br from-purple-500/15 to-violet-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-violet-500/12 to-purple-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Shapes */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-purple-400/35 rounded-full bg-gradient-to-br from-purple-500/15 to-transparent"
            animate={{ 
              x: [0, -12, 0], 
              y: [0, -10, 0], 
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-violet-400/30 bg-gradient-to-br from-violet-500/12 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 15, 0], 
              y: [0, 18, 0], 
              rotate: [0, -60, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-purple-400/50 to-violet-400/50 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-gradient-to-r from-violet-400/50 to-purple-400/50 rounded-full"
            animate={{ 
              y: [0, 18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <MapPinIcon size={40} className="text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Our Location
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Visit us at our office in the heart of Ipswich CBD, Queensland.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.2 }}
            className="aspect-video bg-slate-800 rounded-xl shadow-2xl border border-slate-700/50 overflow-hidden"
          >
            <Image
              src="/union-place-ipswich-map.png"
              alt="Map of Unite Group office in Ipswich CBD"
              width={1200}
              height={675}
              className="w-full h-full object-cover"
            />
          </motion.div>
          <p className="text-center mt-4 text-sm text-slate-400">
            Brisbane, QLD, Australia
          </p>
        </div>
      </section>

      {/* Why Partner with Unite Group Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-violet-900/15 via-transparent to-purple-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/25 via-transparent to-violet-900/18"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-purple-900/12 via-transparent to-slate-700/20"></div>
          
          {/* Subtle Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-br from-violet-500/12 to-purple-500/10 rounded-full filter blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-purple-500/10 to-violet-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Floating Dots */}
          <motion.div
            className="absolute top-1/6 right-1/4 w-2 h-2 bg-violet-400/50 rounded-full"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-1/4 w-1.5 h-1.5 bg-purple-400/50 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Briefcase size={40} className="text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Why Partner with Unite Group?
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              We're committed to your success, offering more than just services
              – we offer a partnership.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {whyPartnerItems.map((item, idx) => (
              <motion.div
                key={idx}
                className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-lg shadow-lg flex items-start space-x-4 hover:border-purple-500/30 hover:shadow-purple-500/20 transition-all duration-300 border border-slate-700/50"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-6 h-6 text-cyan-400 mt-1 flex-shrink-0" />
                <p className="text-slate-300">{item.text}</p>
              </motion.div>
            ))}
          </div>
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Button
              size="lg"
              asChild
              className="bg-cyan-500 hover:bg-cyan-600 text-white group"
            >
              <Link href="/#unite-advantage">
                Discover The Unite Advantage{" "}
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Snippet Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/20 via-transparent to-violet-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-purple-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/18 via-transparent to-slate-700/25"></div>
          
          {/* Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-72 h-72 bg-gradient-to-br from-purple-500/15 to-violet-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-violet-500/12 to-purple-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Shapes */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-purple-400/35 rounded-full bg-gradient-to-br from-purple-500/15 to-transparent"
            animate={{ 
              x: [0, -12, 0], 
              y: [0, -10, 0], 
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-violet-400/30 bg-gradient-to-br from-violet-500/12 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 15, 0], 
              y: [0, 18, 0], 
              rotate: [0, -60, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-purple-400/50 to-violet-400/50 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-gradient-to-r from-violet-400/50 to-purple-400/50 rounded-full"
            animate={{ 
              y: [0, 18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            className="text-center mb-12 md:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <HelpCircle size={40} className="text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Quick answers to common questions about getting started with us.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
          <Accordion type="single" collapsible className="w-full">
            {contactFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                  className="bg-slate-800/70 backdrop-blur-sm border-slate-700/80 rounded-lg mb-3 px-2 hover:border-purple-500/30 transition-all duration-300"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle
                      size={20}
                      className="text-cyan-400 mr-3 flex-shrink-0"
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
          </motion.div>
        </div>
      </section>
    </div>
  );
}
