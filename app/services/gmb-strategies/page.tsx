import Image from "next/image"
import { Button } from "@/components/ui/button"
import { ChevronRight, Search, BarChart, Users, Star, CheckCircle } from "lucide-react"

export default function GmbStrategiesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-block bg-[#4ecdc4]/20 px-4 py-2 rounded-full mb-6">
                  <span className="text-[#4ecdc4] font-medium">Local Business Marketing</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                  Google My Business Optimization Strategies
                </h1>
                <p className="text-xl text-gray-300 mb-8">
                  Boost your local presence, attract more customers, and grow your business with our expert Google My
                  Business optimization services.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Improve Your Local Presence
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Learn More
                  </Button>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/GMB-Strategies.jpg"
                  alt="Google My Business Strategies"
                  width={600}
                  height={400}
                  className="relative rounded-lg border border-[#4ecdc4]/30"
                />
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#001428] to-transparent"></div>
        </section>

        {/* Why GMB is Important Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Why Google My Business is Critical for Your Success
              </h2>
              <p className="text-gray-300">
                Google My Business (GMB) is a powerful tool that can significantly impact your local visibility and
                customer engagement.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Search className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Improved Local Visibility</h3>
                <p className="text-gray-300">
                  Appear in local search results and Google Maps when potential customers search for products or
                  services in your area.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <Users className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Enhanced Customer Trust</h3>
                <p className="text-gray-300">
                  Build credibility with potential customers through verified business information, photos, and customer
                  reviews.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20 hover:border-[#4ecdc4]/50 transition-all">
                <div className="bg-[#4ecdc4]/10 p-3 rounded-full w-fit mb-4">
                  <BarChart className="h-8 w-8 text-[#4ecdc4]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">Valuable Insights</h3>
                <p className="text-gray-300">
                  Gain access to important data about how customers find your business and interact with your listing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our GMB Services Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Our GMB Optimization Services</h2>
              <p className="text-gray-300">
                We offer comprehensive Google My Business optimization services to help you maximize your local
                presence.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Profile Optimization</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">
                      Complete and accurate business information (name, address, phone number, website)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Compelling business description with relevant keywords</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Selection of appropriate business categories</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">High-quality photos and videos that showcase your business</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Review Management</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Strategies to encourage positive customer reviews</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Professional responses to both positive and negative reviews</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Monitoring and addressing fake or inappropriate reviews</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Analysis of review trends to improve customer satisfaction</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Content Strategy</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Regular posting of engaging updates, offers, and events</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">
                      Creation of Google Posts that highlight your products, services, and promotions
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Development of a content calendar for consistent posting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">
                      Optimization of content with relevant keywords and calls-to-action
                    </span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Performance Monitoring</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">Regular analysis of GMB Insights to track performance metrics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">
                      Monitoring of search queries that trigger your business listing
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">
                      Tracking of customer actions (calls, website visits, direction requests)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                    <span className="text-gray-300">
                      Monthly reporting with actionable insights and recommendations
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* GMB Best Practices Section */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="absolute -inset-4 bg-[#4ecdc4]/20 rounded-lg blur-xl"></div>
                <Image
                  src="/gmb-best-practices.png"
                  alt="GMB Best Practices"
                  width={600}
                  height={400}
                  className="relative rounded-lg border border-[#4ecdc4]/30"
                />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">GMB Best Practices We Implement</h2>
                <p className="text-gray-300 mb-6">
                  Our team follows proven strategies and best practices to maximize the effectiveness of your Google My
                  Business listing.
                </p>
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-[#4ecdc4] mr-3" />
                      <span className="text-white font-medium">Complete and accurate information</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-[#4ecdc4] mr-3" />
                      <span className="text-white font-medium">Regular posting of updates and offers</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-[#4ecdc4] mr-3" />
                      <span className="text-white font-medium">Prompt responses to customer questions</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-[#4ecdc4] mr-3" />
                      <span className="text-white font-medium">Professional management of customer reviews</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-[#4ecdc4] mr-3" />
                      <span className="text-white font-medium">High-quality photos and videos</span>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] p-4 rounded-lg">
                    <div className="flex items-center">
                      <Star className="h-5 w-5 text-[#4ecdc4] mr-3" />
                      <span className="text-white font-medium">Utilization of all available GMB features</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Benefits of Our GMB Optimization Services
              </h2>
              <p className="text-gray-300">
                Partner with us for Google My Business optimization and experience these powerful benefits.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Increased Local Visibility</h3>
                <p className="text-gray-300">
                  Improve your ranking in local search results and Google Maps, making it easier for nearby customers to
                  find your business.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">More Website Traffic</h3>
                <p className="text-gray-300">
                  Drive more qualified visitors to your website through your optimized GMB listing, increasing the
                  potential for conversions.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Higher Customer Engagement</h3>
                <p className="text-gray-300">
                  Encourage more customer interactions through reviews, questions, and direct messages, building
                  stronger relationships.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Enhanced Brand Reputation</h3>
                <p className="text-gray-300">
                  Build trust and credibility with potential customers through positive reviews and professional
                  responses.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Valuable Customer Insights</h3>
                <p className="text-gray-300">
                  Gain a better understanding of your customers through GMB analytics, helping you make informed
                  business decisions.
                </p>
              </div>
              <div className="bg-gradient-to-br from-[#001428] to-[#00253e] rounded-lg p-6 border border-[#4ecdc4]/20">
                <h3 className="text-xl font-bold text-white mb-3">Competitive Advantage</h3>
                <p className="text-gray-300">
                  Stand out from competitors who aren't fully utilizing GMB, capturing more attention and business in
                  your local market.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to boost your local presence?</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Contact us today to discuss how our GMB optimization services can help your business grow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium" size="lg">
                    Get Started
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10" size="lg">
                    Learn More
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
