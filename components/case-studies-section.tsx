"use client"

import Image from "next/image"
import Link from "next/link"
import { caseStudies, type CaseStudy } from "@/lib/case-studies-data"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CheckCircle, TrendingUp, Zap, ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="bg-slate-800/50 p-4 rounded-lg text-center h-full flex flex-col justify-center">
    <p className="text-3xl md:text-4xl font-bold text-cyan-400">{value}</p>
    <p className="text-sm text-slate-400 mt-1">{label}</p>
  </div>
)

const FeaturedCaseStudyContent = ({ study }: { study: CaseStudy }) => (
  <Card className="bg-slate-900 border-slate-700/50 overflow-hidden shadow-2xl">
    <div className="grid md:grid-cols-12 gap-0">
      <div className="md:col-span-7 p-6 md:p-8">
        <div className="flex items-center gap-4 mb-6">
          {study.logoUrl && (
            <Image
              src={study.logoUrl || "/placeholder.svg"}
              alt={`${study.client} logo`}
              width={48}
              height={48}
              className="rounded-lg bg-white p-1 shadow-md"
            />
          )}
          <div>
            <h3 className="text-2xl lg:text-3xl font-semibold text-white">{study.client}</h3>
            <p className="text-sm text-cyan-400 font-medium">{study.industry}</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-lg text-slate-200 mb-1 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Challenge
            </h4>
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{study.challenge}</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg text-slate-200 mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" /> Key Outcome
            </h4>
            <p className="text-slate-300 text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>
                {study.results[0].value} {study.results[0].label}
              </span>
            </p>
          </div>
          <Button asChild variant="link" className="text-cyan-400 hover:text-cyan-300 p-0 h-auto">
            <Link href={`/case-studies/${study.id}`}>
              Read Full Story <ArrowRight size={16} className="ml-1" />
            </Link>
          </Button>
        </div>
      </div>
      <div className="md:col-span-5 bg-slate-800/60 p-6 md:p-8 border-t md:border-t-0 md:border-l border-slate-700/50 flex flex-col justify-center">
        <h4 className="font-semibold text-lg text-slate-200 mb-4 text-center md:text-left">Top Results</h4>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {study.results.slice(0, 2).map(
            (
              result, // Show first 2 results
            ) => (
              <StatCard key={result.label} value={result.value} label={result.label} />
            ),
          )}
        </div>
      </div>
    </div>
  </Card>
)

export default function CaseStudiesSection() {
  const featuredStudies = caseStudies.slice(0, 3) // Feature first 3 case studies

  if (!featuredStudies || featuredStudies.length === 0) {
    return null
  }
  return (
    <section id="case-studies-home" className="py-16 md:py-24 bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-white mb-4">
            Proven Results: Our Client Success Stories
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300">
            We don't just promise results—we deliver them. Explore how we've transformed businesses like yours.
          </p>
        </motion.div>

        <Tabs defaultValue={featuredStudies[0].id} className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 mb-8 bg-slate-800/50 border border-slate-700 h-auto p-1.5 rounded-lg shadow-md">
            {featuredStudies.map((study) => (
              <TabsTrigger
                key={study.id}
                value={study.id}
                className="data-[state=active]:bg-slate-700 data-[state=active]:text-white data-[state=active]:shadow-xl text-slate-300 py-2.5 px-3 text-sm font-medium transition-all duration-200 ease-in-out rounded-md"
              >
                {study.client}
              </TabsTrigger>
            ))}
          </TabsList>
          {featuredStudies.map((study) => (
            <TabsContent key={study.id} value={study.id} className="focus-visible:ring-0 focus-visible:ring-offset-0">
              <motion.div
                key={study.id}
                initial={{ opacity: 0.8, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                <FeaturedCaseStudyContent study={study} />
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
        <div className="text-center mt-12">
          <Button
            asChild
            size="lg"
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-8 py-3 rounded-lg shadow-md transition-colors duration-300"
          >
            <Link href="/case-studies">
              View All Case Studies <ArrowRight size={20} className="ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
