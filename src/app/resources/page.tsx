import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResourceCard } from "@/components/resources/ResourceCard";
import { NewsletterSubscribe } from "@/components/blog/NewsletterSubscribe";
import { 
  Search, 
  Filter, 
  FileText,
  TrendingUp,
  Download,
  BarChart,
  ChevronRight,
  FileSpreadsheet,
  CheckSquare,
  Book,
  BookOpen,
  Briefcase
} from "lucide-react";
import {
  getResources,
  getFeaturedResources,
  getPopularResources,
  getResourceStats
} from "@/lib/services/resources";
import { getBlogCategories } from "@/lib/services/blog";
import { ResourceType, RESOURCE_TYPE_LABELS } from "@/types/resources";

export const metadata: Metadata = {
  title: "Free Resources & Downloads | Unite Group",
  description: "Download free templates, checklists, whitepapers, and guides to help grow your business. Expert resources for digital transformation.",
};

const typeIcons = {
  whitepaper: FileText,
  template: FileSpreadsheet,
  checklist: CheckSquare,
  ebook: Book,
  guide: BookOpen,
  case_study: Briefcase
};

export default async function ResourcesPage({
  searchParams
}: {
  searchParams: { type?: ResourceType; category?: string; search?: string; page?: string }
}) {
  const currentPage = parseInt(searchParams.page || '1');
  const resourcesPerPage = 9;

  // Fetch data
  const [resources, categories, featuredResources, popularResources, stats] = await Promise.all([
    getResources({
      type: searchParams.type,
      category: searchParams.category,
      search: searchParams.search,
      limit: resourcesPerPage,
      offset: (currentPage - 1) * resourcesPerPage
    }),
    getBlogCategories(),
    getFeaturedResources(3),
    getPopularResources(5),
    getResourceStats()
  ]);

  const totalResources = resources.length; // In a real app, you'd get total count from DB
  const totalPages = Math.ceil(totalResources / resourcesPerPage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div>
            <div className="inline-flex p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full mb-6">
              <Download className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Free Resources & Downloads
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Templates, guides, checklists, and whitepapers to accelerate your business growth
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-teal-400">{stats.totalResources || 0}</div>
                <div className="text-sm text-slate-400">Resources</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-teal-400">{(stats.totalDownloads || 0).toLocaleString()}</div>
                <div className="text-sm text-slate-400">Downloads</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-teal-400">100%</div>
                <div className="text-sm text-slate-400">Free</div>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4">
                <div className="text-3xl font-bold text-teal-400">Expert</div>
                <div className="text-sm text-slate-400">Curated</div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <form action="/resources" method="get" className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    name="search"
                    type="search"
                    placeholder="Search resources..."
                    defaultValue={searchParams.search}
                    className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 h-12"
                  />
                </div>
                <Button type="submit" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 h-12">
                  Search
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Resource Type Filter */}
      <section className="py-8 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            <Link href="/resources">
              <Badge 
                variant={!searchParams.type ? "default" : "secondary"}
                className="whitespace-nowrap cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
              >
                All Resources
              </Badge>
            </Link>
            {Object.entries(RESOURCE_TYPE_LABELS).map(([type, label]) => {
              const Icon = typeIcons[type as ResourceType];
              return (
                <Link key={type} href={`/resources?type=${type}`}>
                  <Badge
                    variant={searchParams.type === type ? "default" : "secondary"}
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
            {/* Resources Grid */}
            <div className="lg:col-span-2">
              {/* Featured Resources */}
              {currentPage === 1 && !searchParams.type && !searchParams.category && !searchParams.search && featuredResources.length > 0 && (
                <div className="mb-12">
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-teal-400" />
                    Featured Resources
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {featuredResources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Resources */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <FileText className="h-6 w-6 text-teal-400" />
                  {searchParams.type ? `${RESOURCE_TYPE_LABELS[searchParams.type]}s` : 'All Resources'}
                </h2>
                
                {resources.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {resources.map((resource, index) => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-400 text-lg">No resources found.</p>
                    <Button asChild className="mt-4">
                      <Link href="/resources">View All Resources</Link>
                    </Button>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <Link
                        key={page}
                        href={`/resources?${new URLSearchParams({
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
              {/* Newsletter */}
              <NewsletterSubscribe variant="card" />

              {/* Popular Resources */}
              {popularResources.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-teal-400" />
                    Most Downloaded
                  </h3>
                  <div className="space-y-4">
                    {popularResources.map((resource) => {
                      const Icon = typeIcons[resource.type];
                      return (
                        <Link
                          key={resource.id}
                          href={`/resources/${resource.slug}`}
                          className="block group"
                        >
                          <div className="flex items-start gap-3">
                            <Icon className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-white group-hover:text-teal-400 transition-colors mb-1">
                                {resource.title}
                              </h4>
                              <div className="flex items-center gap-3 text-sm text-slate-400">
                                <span>{resource.download_count.toLocaleString()} downloads</span>
                                <Badge variant="secondary" className="text-xs">
                                  {RESOURCE_TYPE_LABELS[resource.type]}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Categories */}
              {categories.length > 0 && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Filter className="h-5 w-5 text-teal-400" />
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/resources?category=${category.slug}`}
                        className="block"
                      >
                        <Badge
                          variant={searchParams.category === category.slug ? "default" : "secondary"}
                          className="w-full justify-start cursor-pointer hover:bg-teal-600 hover:text-white transition-colors"
                          style={searchParams.category === category.slug ? { backgroundColor: category.color } : {}}
                        >
                          {category.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Need a Custom Solution?
            </h2>
            <p className="text-xl mb-8 text-teal-100">
              Let&apos;s discuss how we can create tailored strategies for your business
            </p>
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
              <Link href="/book-consultation">
                Book Your Consultation
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
