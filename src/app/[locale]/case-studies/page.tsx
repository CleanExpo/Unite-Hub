import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CaseStudyCard } from "@/components/case-studies/CaseStudyCard";
import { 
  Filter, 
  TrendingUp,
  Building,
  Cpu,
  Heart,
  DollarSign,
  ShoppingBag,
  Factory,
  GraduationCap,
  Hotel,
  Truck,
  Briefcase,
  BarChart,
  ChevronRight,
  Award
} from "lucide-react";
import {
  getCaseStudies,
  getFeaturedCaseStudies,
  getCaseStudyStats,
  getServices
} from "@/lib/services/case-studies";
import { IndustryType, INDUSTRY_LABELS } from "@/types/case-studies";

export const metadata: Metadata = {
  title: "Case Studies & Success Stories | Unite Group",
  description: "Explore our portfolio of successful digital transformation projects. See how we've helped businesses achieve remarkable results.",
};

const industryIcons = {
  technology: Cpu,
  healthcare: Heart,
  finance: DollarSign,
  retail: ShoppingBag,
  manufacturing: Factory,
  education: GraduationCap,
  real_estate: Building,
  hospitality: Hotel,
  logistics: Truck,
  other: Briefcase
};

export default async function CaseStudiesPage({
  searchParams
}: {
  searchParams: { industry?: IndustryType; service?: string; page?: string }
}) {
  const currentPage = parseInt(searchParams.page || '1');
  const caseStudiesPerPage = 9;

  // Fetch data
  const [caseStudies, services, featuredCaseStudies, stats] = await Promise.all([
    getCaseStudies({
      industry: searchParams.industry,
      service: searchParams.service,
      limit: caseStudiesPerPage,
      offset: (currentPage - 1) * caseStudiesPerPage
    }),
    getServices(),
    getFeaturedCaseStudies(3),
    getCaseStudyStats()
  ]);

  const totalCaseStudies = caseStudies.length; // In a real app, you'd get total count from DB
  const totalPages = Math.ceil(totalCaseStudies / caseStudiesPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div>
            <div className="inline-flex p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full mb-6">
              <Award className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Success Stories
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Real results from real businesses. Discover how we&apos;ve helped companies transform and thrive.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-teal-400">{stats.totalCaseStudies || 0}</div>
                <div className="text-sm text-slate-400">Success Stories</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-teal-400">{stats.averageImprovement}%</div>
                <div className="text-sm text-slate-400">Avg. Improvement</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 md:col-span-1 col-span-2">
                <div className="text-3xl font-bold text-teal-400">{Object.keys(stats.industryBreakdown).length}</div>
                <div className="text-sm text-slate-400">Industries Served</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Filter */}
      <section className="py-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Link href="/case-studies">
              <Badge 
                variant={!searchParams.industry ? "default" : "secondary"}
                className="whitespace-nowrap cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
              >
                All Industries
              </Badge>
            </Link>
            {Object.entries(INDUSTRY_LABELS).map(([industry, label]) => {
              const Icon = industryIcons[industry as IndustryType];
              return (
                <Link key={industry} href={`/case-studies?industry=${industry}`}>
                  <Badge
                    variant={searchParams.industry === industry ? "default" : "secondary"}
                    className="whitespace-nowrap cursor-pointer hover:bg-teal-600 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-12">
            {/* Case Studies Grid */}
            <div className="lg:col-span-2">
              {/* Featured Case Studies */}
              {currentPage === 1 && !searchParams.industry && !searchParams.service && featuredCaseStudies.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-teal-400" />
                    Featured Success Stories
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredCaseStudies.map((caseStudy) => (
                      <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Case Studies */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart className="h-6 w-6 text-teal-400" />
                  {searchParams.industry ? `${INDUSTRY_LABELS[searchParams.industry]} Projects` : 'All Case Studies'}
                </h2>
                
                {caseStudies.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {caseStudies.map((caseStudy, index) => (
                      <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-lg">No case studies found.</p>
                    <Button asChild className="mt-4">
                      <Link href="/case-studies">View All Case Studies</Link>
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={`/case-studies?${new URLSearchParams({
                          ...searchParams,
                          page: page.toString()
                        }).toString()}`}
                      >
                        <Button
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={currentPage === page ? "bg-teal-600 hover:bg-teal-700" : ""}
                        >
                          {page}
                        </Button>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Services Filter */}
              {services.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-teal-400" />
                    Filter by Service
                  </h3>
                  <div className="space-y-2">
                    <Link href="/case-studies">
                      <Badge
                        variant={!searchParams.service ? "default" : "secondary"}
                        className="w-full justify-start cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
                      >
                        All Services
                      </Badge>
                    </Link>
                    {services.map((service) => (
                      <Link
                        key={service.id}
                        href={`/case-studies?service=${service.id}`}
                        className="block"
                      >
                        <Badge
                          variant={searchParams.service === service.id ? "default" : "secondary"}
                          className="w-full justify-start cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
                        >
                          {service.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Industry Breakdown */}
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Building className="h-5 w-5 text-teal-400" />
                  Industry Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.industryBreakdown)
                    .filter(([_, count]) => count > 0)
                    .sort(([, a], [, b]) => b - a)
                    .map(([industry, count]) => {
                      const Icon = industryIcons[industry as IndustryType];
                      const percentage = stats.totalCaseStudies > 0 ? Math.round((count / stats.totalCaseStudies) * 100) : 0;
                      return (
                        <div key={industry}>
                          <Link
                            href={`/case-studies?industry=${industry}`}
                            className="flex items-center justify-between group cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <Icon className="h-4 w-4 text-slate-400" />
                              <span className="text-sm text-slate-300 group-hover:text-teal-400 transition-colors">
                                {INDUSTRY_LABELS[industry as IndustryType]}
                              </span>
                            </div>
                            <span className="text-sm text-slate-400">{count}</span>
                          </Link>
                          <div className="mt-1 bg-slate-700 rounded-full h-2">
                            <div 
                              className="bg-teal-600 h-full rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-2">
                  Ready to Be Our Next Success Story?
                </h3>
                <p className="text-teal-100 mb-4">
                  Let&apos;s discuss how we can transform your business
                </p>
                <Button asChild size="sm" className="w-full bg-white text-teal-600 hover:bg-slate-100">
                  <Link href="/book-consultation">
                    Start Your Journey
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
