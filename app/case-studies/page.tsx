import Link from "next/link"
import Image from "next/image"
import { caseStudies, type CaseStudy } from "@/lib/case-studies-data"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

// Import new section components
import IndustriesServedSection from "@/components/case-studies/industries-served-section"
import AggregateStatsSection from "@/components/case-studies/aggregate-stats-section"
import OurProcessSection from "@/components/case-studies/our-process-section"
import CtaSection from "@/components/case-studies/cta-section"

export const metadata = {
  title: "Client Success Stories | Unite Group",
  description:
    "Explore detailed case studies showcasing how Unite Group delivers transformative results for businesses across various industries.",
}

const CaseStudyCard = ({ study }: { study: CaseStudy }) => (
  <Card className="flex flex-col h-full bg-slate-900 border-slate-700/80 hover:border-cyan-500/60 transition-all duration-300 ease-in-out shadow-lg hover:shadow-cyan-500/20">
    <CardHeader className="pb-4">
      <div className="flex items-center gap-4 mb-3">
        {study.logoUrl && (
          <Image
            src={study.logoUrl || "/placeholder.svg"}
            alt={`${study.client} Logo`}
            width={40}
            height={40}
            className="rounded-md bg-white p-0.5"
          />
        )}
        <CardTitle className="text-xl text-white">{study.client}</CardTitle>
      </div>
      <Badge variant="outline" className="border-cyan-400 text-cyan-400 text-xs w-fit">
        {study.industry}
      </Badge>
    </CardHeader>
    <CardContent className="flex-grow">
      <p className="text-slate-400 text-sm mb-3 leading-relaxed line-clamp-3">{study.overview}</p>
      <h4 className="text-slate-300 text-sm font-semibold mb-1 mt-4">Key Result:</h4>
      <div className="flex items-center gap-2 text-green-400">
        <CheckCircle size={16} />
        <p className="text-sm font-medium">
          {study.results[0].value} {study.results[0].label}
        </p>
      </div>
    </CardContent>
    <CardFooter>
      <Button
        asChild
        variant="outline"
        className="w-full bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-all"
      >
        <Link href={`/case-studies/${study.id}`}>
          Read Full Case Study <ArrowRight size={16} className="ml-2" />
        </Link>
      </Button>
    </CardFooter>
  </Card>
)

export default function CaseStudiesPage() {
  return (
    <div className="bg-slate-950 text-white min-h-screen">
      <header className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">Our Proven Impact</h1>
          <p className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto">
            Discover how we've partnered with businesses like yours to overcome challenges, innovate, and achieve
            remarkable growth. Each story highlights our commitment to delivering tangible results.
          </p>
        </div>
      </header>

      {/* New Section: Industries Served */}
      <IndustriesServedSection />

      {/* New Section: Aggregate Stats */}
      <AggregateStatsSection />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <h2 className="text-3xl font-semibold text-center text-white mb-10 md:mb-12">Explore Our Success Stories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {caseStudies.map((study) => (
            <CaseStudyCard key={study.id} study={study} />
          ))}
        </div>
      </main>

      {/* New Section: Our Process */}
      <OurProcessSection />

      {/* New Section: CTA */}
      <CtaSection />
    </div>
  )
}
