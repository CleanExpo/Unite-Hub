// app/services/page.tsx (Services Overview Page)
"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Briefcase, Zap } from "lucide-react"
import { services } from "@/lib/services-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { iconMap } from "@/lib/icon-map" // Assuming iconMap is moved to lib

export default function ServicesOverviewPage() {
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
          <Briefcase className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">Our Comprehensive Services</h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Unite Group offers a full spectrum of technology and consulting services designed to empower your business,
            drive innovation, and achieve sustainable growth. Explore how we can help you transform.
          </p>
          <Button size="lg" asChild className="bg-cyan-500 hover:bg-cyan-600 text-white group">
            <Link href="/contact">
              Discuss Your Project{" "}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </motion.section>

      {/* Services Listing Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Explore Our Solutions</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Tailored expertise to meet your unique challenges and unlock new opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => {
              const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Zap
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="h-full"
                >
                  <Card className="bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl h-full flex flex-col hover:border-cyan-500/50 transition-all duration-300 group">
                    <CardHeader>
                      <div className="mb-4">
                        <IconComponent className="w-10 h-10 text-cyan-400" />
                      </div>
                      <CardTitle className="text-2xl text-white group-hover:text-cyan-300 transition-colors">
                        {service.title}
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-sm min-h-[60px]">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-end">
                      <Button
                        asChild
                        variant="outline"
                        className="mt-auto border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white w-full group-hover:bg-cyan-500 group-hover:text-white transition-colors"
                      >
                        <Link href={service.link}>
                          Learn More <ArrowRight size={16} className="ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Unite Group Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            Partner with Experts for Lasting Success
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-10">
            At Unite Group, we combine deep industry knowledge with cutting-edge technology to deliver solutions that
            not only meet your current needs but also anticipate future challenges. Our client-centric approach ensures
            we're more than just a vendor – we're your dedicated partner in growth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-cyan-500 hover:bg-cyan-600 text-white group">
              <Link href="/#unite-advantage">
                The Unite Advantage{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white group"
            >
              <Link href="/#case-studies">View Our Success Stories</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
