import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Download,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  Book,
  BookOpen,
  Briefcase,
  ChevronRight,
  Sparkles
} from "lucide-react";

export const metadata: Metadata = {
  title: "Free Resources & Downloads | Unite Group",
  description: "Download free templates, checklists, whitepapers, and guides to help grow your business. Expert resources for digital transformation.",
};

export default function ResourcesPage() {
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
            <p className="text-xl text-slate-200 max-w-3xl mx-auto mb-8">
              Templates, guides, checklists, and whitepapers to accelerate your business growth
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
              Resources Coming Soon!
            </h2>
            <p className="text-lg text-slate-200 mb-8 max-w-2xl mx-auto">
              We&apos;re preparing valuable resources to help you succeed. Check back soon for whitepapers, templates, checklists, and more!
            </p>

            {/* Resource Types Preview */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <FileText className="h-8 w-8 text-teal-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Whitepapers</h3>
                <p className="text-sm text-slate-300">In-depth research and insights</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <FileSpreadsheet className="h-8 w-8 text-cyan-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Templates</h3>
                <p className="text-sm text-slate-300">Ready-to-use business documents</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <CheckSquare className="h-8 w-8 text-purple-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Checklists</h3>
                <p className="text-sm text-slate-300">Step-by-step guides</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <Book className="h-8 w-8 text-pink-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">E-books</h3>
                <p className="text-sm text-slate-300">Comprehensive learning materials</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <BookOpen className="h-8 w-8 text-orange-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Guides</h3>
                <p className="text-sm text-slate-300">Practical how-to resources</p>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-6 border border-slate-600">
                <Briefcase className="h-8 w-8 text-blue-400 mb-3 mx-auto" />
                <h3 className="font-semibold text-white mb-2">Case Studies</h3>
                <p className="text-sm text-slate-300">Real-world success stories</p>
              </div>
            </div>

            <Button asChild size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500">
              <Link href="/book-consultation">
                Get Expert Guidance Now
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
              Need a Custom Solution?
            </h2>
            <p className="text-xl mb-8 text-white/90">
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
