import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  ArrowRight,
  Search,
  BarChart,
  Globe,
  FileText,
  LinkIcon,
  MapPin,
  CheckCircle,
  TrendingUp,
  Zap,
  Shield,
} from "lucide-react"

export default function SeoServicesPage() {
  return (
    <div className="min-h-screen bg-[#0a192f]">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4">
                <div className="flex items-center space-x-2 bg-[#64ffda]/10 px-3 py-1 rounded-full">
                  <Search className="h-4 w-4 text-[#64ffda]" />
                  <span className="text-[#64ffda] text-sm font-medium">SEO Services</span>
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
                Boost Your Online Visibility & Drive Organic Growth
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Our data-driven SEO strategies help you rank higher in search results, attract qualified traffic, and
                increase conversions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-6 py-3">
                  <Link href="/contact">
                    Get a Free SEO Audit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-6 py-3"
                >
                  <Link href="#case-studies">View Case Studies</Link>
                </Button>
              </div>
            </div>
            <div className="relative h-[400px] rounded-lg overflow-hidden">
              <Image
                src="/placeholder.svg?height=800&width=800&query=SEO analytics dashboard with charts and graphs in blue teal color scheme"
                alt="SEO Services"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our SEO Services</h2>
            <p className="mt-4 text-lg text-gray-300">
              Comprehensive search engine optimization solutions to improve your online presence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">SEO Audit & Strategy</h3>
              <p className="text-gray-300 mb-4">
                Comprehensive analysis of your website's SEO performance and customized strategy development.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Technical SEO audit</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Competitor analysis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Keyword research & strategy</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Globe className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">On-Page SEO</h3>
              <p className="text-gray-300 mb-4">
                Optimization of your website's content and structure to improve search engine rankings.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Content optimization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Meta tags & schema markup</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>URL & site structure optimization</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <LinkIcon className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Off-Page SEO</h3>
              <p className="text-gray-300 mb-4">
                Building your website's authority through high-quality backlinks and online presence.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Link building campaigns</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Digital PR & outreach</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Brand mentions & citations</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Content Strategy & Creation</h3>
              <p className="text-gray-300 mb-4">
                Development of SEO-optimized content that engages users and ranks well in search results.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Content gap analysis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>SEO copywriting</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Blog & article creation</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Local SEO</h3>
              <p className="text-gray-300 mb-4">
                Strategies to improve your visibility in local search results and attract nearby customers.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Google Business Profile optimization</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Local citation building</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Local content & link building</span>
                </li>
              </ul>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <BarChart className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">SEO Analytics & Reporting</h3>
              <p className="text-gray-300 mb-4">
                Comprehensive tracking and analysis of your SEO performance with actionable insights.
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Rank tracking & monitoring</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Traffic & conversion analysis</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="mr-2 h-4 w-4 text-[#64ffda] shrink-0 mt-1" />
                  <span>Regular performance reports</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Process */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Our SEO Process</h2>
            <p className="mt-4 text-lg text-gray-300">
              A methodical approach to improving your search engine rankings and driving results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Research & Analysis</h3>
              <p className="text-gray-300">
                We conduct thorough research on your industry, competitors, target audience, and keywords.
              </p>
              <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Strategy Development</h3>
              <p className="text-gray-300">
                We create a customized SEO strategy based on our findings and your specific business goals.
              </p>
              <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Implementation</h3>
              <p className="text-gray-300">
                We execute the strategy through on-page optimization, content creation, and off-page tactics.
              </p>
              <div className="hidden lg:block absolute top-8 left-16 w-full h-0.5 bg-gradient-to-r from-[#64ffda] to-transparent"></div>
            </div>

            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#64ffda] text-[#0a192f] font-bold text-xl mb-4">
                4
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Monitoring & Refinement</h3>
              <p className="text-gray-300">
                We continuously track performance, analyze results, and refine our approach for optimal outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Results You Can Expect</h2>
            <p className="mt-4 text-lg text-gray-300">
              Our SEO services deliver measurable improvements in your online performance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">+75%</h3>
              <p className="text-xl font-semibold text-[#64ffda] mb-3">Organic Traffic Increase</p>
              <p className="text-gray-300">
                Average increase in organic search traffic for our clients within the first 6 months.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <Search className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Top 10</h3>
              <p className="text-xl font-semibold text-[#64ffda] mb-3">Search Rankings</p>
              <p className="text-gray-300">
                We help our clients achieve first-page rankings for their most valuable keywords.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[#64ffda]/10 flex items-center justify-center">
                  <BarChart className="h-8 w-8 text-[#64ffda]" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">+120%</h3>
              <p className="text-xl font-semibold text-[#64ffda] mb-3">Conversion Rate Growth</p>
              <p className="text-gray-300">
                Our SEO strategies focus on attracting qualified traffic that converts into leads and sales.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Why Choose Us</h2>
            <p className="mt-4 text-lg text-gray-300">Benefits of partnering with UNITE Group for your SEO needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Data-Driven Approach</h3>
              <p className="text-gray-300">
                We base our strategies on comprehensive data analysis and industry best practices, not guesswork.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Transparent Reporting</h3>
              <p className="text-gray-300">
                We provide clear, detailed reports that show exactly what we're doing and the results we're achieving.
              </p>
            </div>

            <div className="bg-[#1a2f55] p-6 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-[#64ffda]/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-[#64ffda]" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">White Hat Techniques</h3>
              <p className="text-gray-300">
                We only use ethical, sustainable SEO practices that build long-term success and avoid penalties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 bg-[#112240]">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to Improve Your Rankings?</h2>
          <p className="mt-4 text-lg text-gray-300">
            Contact us today to get a free SEO audit and discover how we can help your business grow online.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild className="bg-[#64ffda] text-[#0a192f] hover:bg-[#4fd1c7] font-semibold px-8 py-3 text-lg">
              <Link href="/contact">
                Get Your Free SEO Audit
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="border-[#64ffda] text-[#64ffda] hover:bg-[#64ffda] hover:text-[#0a192f] px-8 py-3 text-lg"
            >
              <Link href="/services">View All Services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
