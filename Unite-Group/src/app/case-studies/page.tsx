"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export default function CaseStudies() {
  // Sample case studies data
  const caseStudies = [
    {
      id: 1,
      title: "Digital Transformation for ABC Manufacturing",
      description: "How we helped a traditional manufacturing company implement IoT solutions to improve operational efficiency by 35%.",
      image: "/images/handshake-gear.png",
      industry: "Manufacturing",
      services: ["Digital Transformation", "IoT Implementation", "Process Automation"],
      results: "35% improvement in operational efficiency",
      year: "2024",
      link: "/case-studies/abc-manufacturing"
    },
    {
      id: 2,
      title: "E-Commerce Overhaul for XYZ Retail",
      description: "Complete redesign and backend implementation for a retail chain, resulting in 85% increase in online sales.",
      image: "/software-code-blue-teal.png",
      industry: "Retail",
      services: ["E-Commerce Development", "UX Design", "Payment Integration"],
      results: "85% increase in online sales",
      year: "2024",
      link: "/case-studies/xyz-retail"
    },
    {
      id: 3,
      title: "Data Analytics Platform for Financial Services Firm",
      description: "Custom analytics dashboard development for a financial services company to track client portfolios and market trends.",
      image: "/modern-office-collaboration.png",
      industry: "Finance",
      services: ["Custom Software Development", "Data Analytics", "Dashboard Design"],
      results: "42% reduction in reporting time",
      year: "2023",
      link: "/case-studies/financial-services-analytics"
    },
    {
      id: 4,
      title: "Cloud Migration for Healthcare Provider",
      description: "Secure migration of patient data and applications to a cloud-based infrastructure with HIPAA compliance.",
      image: "/placeholder.jpg",
      industry: "Healthcare",
      services: ["Cloud Migration", "Security Implementation", "Compliance Consulting"],
      results: "99.9% uptime and full HIPAA compliance",
      year: "2023",
      link: "/case-studies/healthcare-cloud-migration"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-teal-400">UG</span> UNITE Group
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-slate-300 hover:text-white transition-colors">Services</Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/book-consultation">Book Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-6">
            Our Success
            <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Stories
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Explore how we've helped businesses across various industries achieve their technology and business goals with our strategic consulting approach.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mb-6">
            <Badge className="bg-slate-700 hover:bg-slate-600 text-white">All Industries</Badge>
            <Badge className="bg-slate-700 hover:bg-slate-600 text-white">Manufacturing</Badge>
            <Badge className="bg-slate-700 hover:bg-slate-600 text-white">Retail</Badge>
            <Badge className="bg-slate-700 hover:bg-slate-600 text-white">Finance</Badge>
            <Badge className="bg-slate-700 hover:bg-slate-600 text-white">Healthcare</Badge>
            <Badge className="bg-slate-700 hover:bg-slate-600 text-white">Technology</Badge>
          </div>
        </div>
      </section>

      {/* Case Studies Grid */}
      <section className="py-10 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {caseStudies.map((study) => (
              <Card key={study.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors overflow-hidden h-full flex flex-col">
                <div className="relative h-52 w-full">
                  <Image 
                    src={study.image} 
                    alt={study.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
                  <Badge className="absolute top-4 right-4 bg-slate-800/80 text-teal-400 backdrop-blur-sm">
                    {study.industry}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant="outline" className="text-slate-400 border-slate-600">
                      {study.year}
                    </Badge>
                    <Badge className="bg-green-900/50 text-green-400 border-green-800">
                      {study.results}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl text-white">{study.title}</CardTitle>
                  <CardDescription className="text-slate-300">{study.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-4 flex-grow">
                  <div className="flex flex-wrap gap-2 mt-3">
                    {study.services.map((service, idx) => (
                      <Badge key={idx} className="bg-slate-700 text-slate-200">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t border-slate-700">
                  <Button asChild variant="ghost" className="text-teal-400 hover:text-teal-300 hover:bg-slate-700 w-full justify-between">
                    <Link href={study.link}>
                      View Case Study
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            Schedule your $550 consultation session today and start your journey toward business transformation and growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white px-8 py-6 text-lg">
              <Link href="/book-consultation">
                Book Your Consultation
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-700 px-8 py-6 text-lg">
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
