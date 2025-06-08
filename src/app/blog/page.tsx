import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  BookOpen,
  PenTool,
  Lightbulb,
  Target,
  TrendingUp,
  MessageSquare,
  ChevronRight,
  Sparkles
} from "lucide-react";

export const metadata: Metadata = {
  title: "Blog & Resources | Unite Group - Business Insights",
  description: "Explore our latest articles on business strategy, technology, SEO, and digital transformation. Get insights from industry experts.",
};

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div>
            <div className="inline-flex p-3 bg-gradient-to-br from-teal-600 to-cyan-600 rounded-full mb-6">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Blog & Resources
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Insights, tutorials, and strategies to help you grow your business 
              and stay ahead of the competition
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
              Blog Coming Soon!
            </h2>
            <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">
              We&apos;re crafting insightful content to help you navigate the digital landscape. 
              Stay tuned for expert articles, industry insights, and practical guides!
            </p>

            {/* Content Types Preview */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <PenTool className="h-8 w-8 text-teal-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Industry Insights</h3>
                <p className="text-sm text-slate-400">Latest trends and analysis</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <Lightbulb className="h-8 w-8 text-cyan-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">How-To Guides</h3>
                <p className="text-sm text-slate-400">Practical tutorials and tips</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <Target className="h-8 w-8 text-purple-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Strategy Articles</h3>
                <p className="text-sm text-slate-400">Business growth tactics</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <TrendingUp className="h-8 w-8 text-pink-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">SEO & Marketing</h3>
                <p className="text-sm text-slate-400">Digital marketing expertise</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <BookOpen className="h-8 w-8 text-orange-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Tech Tutorials</h3>
                <p className="text-sm text-slate-400">Development best practices</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <MessageSquare className="h-8 w-8 text-blue-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Expert Interviews</h3>
                <p className="text-sm text-slate-400">Insights from leaders</p>
              </div>
            </div>

            <Button asChild size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500">
              <Link href="/book-consultation">
                Get Expert Advice Now
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
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-8 text-teal-100">
              Let our expertise guide your digital transformation journey
            </p>
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
              <Link href="/book-consultation">
                Book Your $550 Consultation
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
