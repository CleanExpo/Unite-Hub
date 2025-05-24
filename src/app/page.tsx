import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed w-full backdrop-blur-md bg-black/20 z-50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <h1 className="text-2xl font-bold">Unite Group</h1>
          <div className="flex gap-4">
            <Link href="/login" className="text-white/80 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-purple-600 hover:bg-purple-700">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 text-center">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-6xl font-bold mb-6 leading-tight">
            Project Management
            <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Reimagined
            </span>
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
            Unite Group brings teams together with intelligent workflows,
            real-time collaboration, and insights that drive results.
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
              <Link href="/features">Explore Features</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
