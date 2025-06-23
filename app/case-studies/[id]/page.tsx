import { caseStudies, type CaseStudy, type Technology } from "@/lib/case-studies-data"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap, Lightbulb, Target, Workflow, Cpu, TrendingUp, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

// Helper to get a specific case study
function getCaseStudy(id: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.id === id)
}

// Generate metadata dynamically
export async function generateMetadata({ params }: { params: { id: string } }) {
  const study = getCaseStudy(params.id)
  if (!study) {
    return {
      title: "Case Study Not Found",
    }
  }
  return {
    title: `${study.client} Case Study | Unite Group`,
    description: `Detailed case study of our work with ${study.client}: ${study.overview}`,
  }
}

// Generate static paths for all case studies
export async function generateStaticParams() {
  return caseStudies.map((study) => ({
    id: study.id,
  }))
}

const ResultPill = ({ value, label, icon: Icon }: { value: string; label: string; icon?: LucideIcon }) => (
  <div className="bg-green-600/10 border border-green-500/30 text-green-300 p-4 rounded-lg text-center shadow-md flex flex-col items-center justify-center min-h-[120px]">
    {Icon && <Icon className="w-8 h-8 mx-auto mb-2 text-green-400" />}
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm mt-1">{label}</p>
  </div>
)

const TechnologyCard = ({ tech }: { tech: Technology }) => (
  <Card className="bg-slate-800/50 border-slate-700/30 hover:border-cyan-500/50 transition-all">
    <CardContent className="p-4 flex items-center space-x-3">
      {tech.icon && <tech.icon size={24} className="text-cyan-400 flex-shrink-0" />}
      <div>
        <p className="font-semibold text-white text-sm">{tech.name}</p>
        <p className="text-xs text-slate-400">{tech.category}</p>
      </div>
    </CardContent>
  </Card>
)

export default function SingleCaseStudyPage({ params }: { params: { id: string } }) {
  const study = getCaseStudy(params.id)

  if (!study) {
    notFound()
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Header Section */}
      <header className="relative h-[350px] md:h-[450px]">
        {study.heroImageUrl && (
          <Image
            src={study.heroImageUrl || "/placeholder.svg"}
            alt={`${study.client} project visual`}
            layout="fill"
            objectFit="cover"
            className="opacity-20"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-end h-full pb-12 md:pb-20">
          <div className="flex items-center gap-4 mb-4">
            {study.logoUrl && (
              <Image
                src={study.logoUrl || "/placeholder.svg"}
                alt={`${study.client} Logo`}
                width={72}
                height={72}
                className="rounded-lg bg-white p-1.5 shadow-xl"
              />
            )}
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">{study.client}</h1>
              <Badge variant="secondary" className="mt-2 bg-cyan-500 text-slate-950 text-md px-3 py-1">
                {study.industry}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <Button
          asChild
          variant="outline"
          className="mb-10 bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-colors"
        >
          <Link href="/case-studies">
            <ArrowLeft size={18} className="mr-2" /> Back to All Case Studies
          </Link>
        </Button>

        <div className="grid lg:grid-cols-3 gap-10 md:gap-12">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-12">
            {/* Challenge Section */}
            <section id="challenge">
              <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                <Zap size={30} className="mr-3 text-amber-400" /> The Challenge
              </h2>
              <p className="text-slate-300 leading-relaxed mb-4 text-lg">{study.challenge}</p>
              {study.challengeDetails && study.challengeDetails.length > 0 && (
                <ul className="space-y-2 list-disc list-inside text-slate-400 pl-1">
                  {study.challengeDetails.map((detail, index) => (
                    <li key={index} className="leading-relaxed">
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Project Goals Section */}
            <section id="project-goals">
              <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                <Target size={30} className="mr-3 text-green-400" /> Project Goals & Objectives
              </h2>
              <div className="space-y-3">
                {study.projectGoals.map((goal, index) => (
                  <div
                    key={index}
                    className="flex items-start p-3 bg-slate-900/50 border border-slate-700/40 rounded-lg"
                  >
                    {goal.icon ? (
                      <goal.icon size={22} className="mr-3 mt-1 text-green-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 size={22} className="mr-3 mt-1 text-green-400 flex-shrink-0" />
                    )}
                    <p className="text-slate-300 leading-relaxed">{goal.goal}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Our Strategic Solution Section */}
            <section id="solution">
              <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                <Lightbulb size={30} className="mr-3 text-yellow-400" /> Our Strategic Solution
              </h2>
              <p className="text-slate-300 leading-relaxed mb-6 text-lg">{study.solutionIntro}</p>
              <div className="space-y-6">
                {study.solutionPoints.map((point, index) => (
                  <Card key={index} className="bg-slate-900/70 border-slate-700/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center">
                        {point.icon && <point.icon size={24} className="mr-3 text-cyan-400" />}
                        {point.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-400 leading-relaxed">{point.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Our Approach & Methodology Section */}
            <section id="approach">
              <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                <Workflow size={30} className="mr-3 text-purple-400" /> Our Approach & Methodology
              </h2>
              <div className="space-y-6">
                {study.approach.map((phase, index) => (
                  <Card key={index} className="bg-slate-900/70 border-slate-700/50 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-xl text-white flex items-center">
                        {phase.icon && <phase.icon size={24} className="mr-3 text-purple-400" />}
                        {phase.phase}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-400 leading-relaxed">{phase.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Key Technologies Utilized Section */}
            <section id="technologies">
              <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                <Cpu size={30} className="mr-3 text-sky-400" /> Key Technologies Utilized
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {study.technologies.map((tech, index) => (
                  <TechnologyCard key={index} tech={tech} />
                ))}
              </div>
            </section>

            {/* Future Outlook Section */}
            <section id="future-outlook">
              <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                <TrendingUp size={30} className="mr-3 text-lime-400" /> Future Outlook & Long-Term Impact
              </h2>
              <div className="space-y-3">
                {study.futureOutlook.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start p-3 bg-slate-900/50 border border-slate-700/40 rounded-lg"
                  >
                    {item.icon ? (
                      <item.icon size={22} className="mr-3 mt-1 text-lime-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 size={22} className="mr-3 mt-1 text-lime-400 flex-shrink-0" />
                    )}
                    <p className="text-slate-300 leading-relaxed">{item.point}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Column */}
          <aside className="lg:col-span-1 space-y-8 sticky top-24 self-start">
            <Card className="bg-slate-900 border-slate-700/50 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-cyan-400">Services Provided</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {study.services.map((service) => (
                  <div key={service.name} className="flex items-center gap-3 text-slate-300">
                    <service.icon size={20} className="text-cyan-400" />
                    <span>{service.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {study.testimonial && (
              <Card className="bg-slate-900 border-cyan-500/30 shadow-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-3">
                    {study.avatarUrl && (
                      <Image
                        src={study.avatarUrl || "/placeholder.svg"}
                        alt={study.testimonial.author}
                        width={48}
                        height={48}
                        className="rounded-full border-2 border-cyan-500"
                      />
                    )}
                    <div>
                      <p className="font-semibold text-white text-md">{study.testimonial.author}</p>
                      <p className="text-sm text-slate-400">{study.testimonial.role}</p>
                    </div>
                  </div>
                  <blockquote className="text-slate-300 italic text-md leading-relaxed border-l-4 border-cyan-500 pl-4">
                    "{study.testimonial.quote}"
                  </blockquote>
                </CardHeader>
              </Card>
            )}
          </aside>
        </div>

        {/* Measurable Results Section */}
        <section id="results" className="mt-16 md:mt-20 pt-12 border-t border-slate-700/50">
          <h2 className="text-4xl font-semibold text-white mb-10 text-center">Measurable Results & Impact</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {study.results.map((result) => (
              <ResultPill key={result.label} value={result.value} label={result.label} icon={result.icon} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
