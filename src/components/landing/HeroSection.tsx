import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-300 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Australia's Premier Business Solutions Partner
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6"> import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, Sparkles, Zap } from 'lucide-react';
import Image from 'next/image';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-teal-300 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-300 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative container mx-auto px-4 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Australia's Premier Business Solutions Partner
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transform Your Business with{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Unite Group
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Expert consultation, cutting-edge software development, strategic SEO, and professional training. 
              Start with our comprehensive <strong className="text-teal-600">A$550 consultation</strong> to unlock your business potential.
            </p>

            {/* Key benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Brisbane-based experts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">10+ years experience</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">500+ projects delivered</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">24/7 support</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book-consultation">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white">
                  Book A$550 Consultation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>

          {/* Right content - Hero image */}
          <div className="relative animate-fade-in-right">
            <div className="relative z-10">
              <Image
                src="/images/unite-logo.png"
                alt="Unite Group - Business Solutions"
                width={600}
                height={400}
                className="w-full h-auto rounded-2xl shadow-2xl"
                priority
              />
              {/* Floating stats */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                    <Zap className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Client Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl transform rotate-3 scale-105 opacity-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
.Value -replace "'", "'" <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Unite Group
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Expert consultation, cutting-edge software development, strategic SEO, and professional training. 
              Start with our comprehensive <strong className="text-teal-600">A$550 consultation</strong> to unlock your business potential.
            </p>

            {/* Key benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Brisbane-based experts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">10+ years experience</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">500+ projects delivered</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">24/7 support</span>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/book-consultation">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white">
                  Book A$550 Consultation
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/services">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Explore Services
                </Button>
              </Link>
            </div>
          </div>

          {/* Right content - Hero image */}
          <div className="relative animate-fade-in-right">
            <div className="relative z-10">
              <Image
                src="/images/unite-logo.png"
                alt="Unite Group - Business Solutions"
                width={600}
                height={400}
                className="w-full h-auto rounded-2xl shadow-2xl"
                priority
              />
              {/* Floating stats */}
              <div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-teal-100 dark:bg-teal-900/30 p-3 rounded-lg">
                    <Zap className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">99.9%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Client Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl transform rotate-3 scale-105 opacity-10" />
          </div>
        </div>
      </div>
    </section>
  );
}
