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
        className="py-20 md:py-32 bg-gradient-to-b from-slate-900 to-slate-950"
      >
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Get in Touch
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300">
            Ready to transform your business? Let's discuss how Unite Group can
            help you achieve your goals.
          </p>
        </div>
      </motion.section>

      {/* Contact Information Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {contactDetails.map((item, idx) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <Card className="bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl h-full text-center">
                  <CardHeader className="items-center">
                    <div className="p-3 bg-cyan-500/10 rounded-full mb-3">
                      <item.icon className="w-8 h-8 text-cyan-400" />
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
                            className="hover:text-cyan-400 transition-colors"
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
      <section id="contact-form" className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Start Your Journey
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Fill out the form below and we'll get back to you within 24
              business hours.
            </p>
          </div>

          <Card className="bg-slate-800/50 p-6 sm:p-8 md:p-10 border-slate-700/60 shadow-2xl">
            <CardContent className="p-0">
              <Form {...form}>
                <form
                  action={formAction}
                  onSubmit={form.handleSubmit(() =>
                    formAction(new FormData(form.elementRef.current!))
                  )}
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
        </div>
      </section>

      {/* What Happens Next Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              What Happens Next?
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              We're excited to learn about your project. Here's our simple
              process to get started.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {whatHappensNextSteps.map((step, idx) => (
              <motion.div
                key={step.title}
                className="bg-slate-800 p-8 rounded-xl shadow-xl border border-slate-700/50"
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
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <MapPinIcon size={40} className="text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Our Location
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Visit us at our office in the heart of Ipswich CBD, Queensland.
            </p>
          </div>
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Briefcase size={40} className="text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Why Partner with Unite Group?
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              We're committed to your success, offering more than just services
              – we offer a partnership.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {whyPartnerItems.map((item, idx) => (
              <motion.div
                key={idx}
                className="bg-slate-800 p-6 rounded-lg shadow-lg flex items-start space-x-4"
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
          <div className="text-center mt-12">
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
          </div>
        </div>
      </section>

      {/* FAQ Snippet Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <HelpCircle size={40} className="text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Quick answers to common questions about getting started with us.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {contactFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 border-slate-700/80 rounded-lg mb-3 px-2"
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
        </div>
      </section>
    </div>
  );
}
