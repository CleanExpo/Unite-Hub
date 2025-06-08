import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Award,
  Trophy,
  Target,
  TrendingUp,
  BarChart3,
  Briefcase,
  Building,
  ChevronRight,
  Sparkles
} from "lucide-react";

export const metadata: Metadata = {
  title: "Case Studies & Success Stories | Unite Group",
  description: "Explore our portfolio of successful digital transformation projects. See how we've helped businesses achieve remarkable results.",
};

export default function CaseStudiesPage() {
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
          </div>
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700">
            <div className="inline-flex p-4 bg-gradient-to-br from-teal-600/20 to-cyan-600/20 rounded-full mb-6">
              <Sparkles className="h-12 w-12 text-teal-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Case Studies Coming Soon!
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              We&apos;re documenting our success stories to share how we&apos;ve helped businesses like yours achieve exceptional results.
            </p>

            {/* Success Metrics Preview */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <Trophy className="h-8 w-8 text-teal-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">50+ Projects</h3>
                <p className="text-sm text-slate-400">Successfully delivered</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <Target className="h-8 w-8 text-cyan-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">95% Success Rate</h3>
                <p className="text-sm text-slate-400">Client satisfaction</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <TrendingUp className="h-8 w-8 text-purple-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">300% ROI</h3>
                <p className="text-sm text-slate-400">Average client return</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <BarChart3 className="h-8 w-8 text-pink-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Data-Driven</h3>
                <p className="text-sm text-slate-400">Results you can measure</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <Briefcase className="h-8 w-8 text-orange-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">All Industries</h3>
                <p className="text-sm text-slate-400">Diverse experience</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <Building className="h-8 w-8 text-blue-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Enterprise Ready</h3>
                <p className="text-sm text-slate-400">Scalable solutions</p>
              </div>
            </div>

            <Button asChild size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500">
              <Link href="/book-consultation">
                Start Your Success Story
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Be Our Next Success Story?
            </h2>
            <p className="text-xl mb-8 text-teal-100">
              Let&apos;s discuss how we can transform your business
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
