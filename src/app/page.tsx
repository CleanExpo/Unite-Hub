import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, BarChart3, ArrowRight, Star, Menu, Handshake, Cog } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="fixed w-full backdrop-blur-md bg-slate-900/95 z-50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold text-lg">UG</span>
            </div>
            <h1 className="text-2xl font-bold text-white">UNITE Group</h1>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-slate-300 hover:text-white transition-colors">Services</Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Solutions</Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-teal-500 hover:bg-teal-600 text-white">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
          <div className="md:hidden">
            <Menu className="h-6 w-6 text-white" />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Empowering Your Success
                <span className="block text-transparent bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text">
                  Through Innovation
                </span>
              </h1>
              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                UNITE Group delivers expert-led education, innovative software development, 
                and strategic SEO services to help your business thrive in the digital landscape.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button asChild size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                  <Link href="/contact">
                    Explore Our Services
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  <Link href="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
                <div className="flex items-center justify-center mb-8">
                  <div className="w-32 h-32 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center p-4">
                    <div className="relative w-full h-full">
                      <Image 
                        src="/images/handshake-gear.png" 
                        alt="Handshake and Gear - Partnership Excellence" 
                        width={96}
                        height={96}
                        className="w-full h-full object-contain"
                        priority
                        onError={(e) => {
                          // Fallback to icon if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="hidden w-full h-full items-center justify-center absolute inset-0">
                        <div className="relative">
                          <Cog className="h-12 w-12 text-slate-900 absolute" />
                          <Handshake className="h-8 w-8 text-slate-900 relative top-2 left-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-4">Partnership Excellence</h3>
                  <p className="text-slate-300">
                    Building lasting relationships through innovative solutions and expert guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Our Core Services
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Comprehensive solutions designed to accelerate your business growth
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Expert Education</CardTitle>
                <CardDescription className="text-slate-300">
                  Professional training and development programs to enhance your team&apos;s capabilities and drive innovation.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center mb-4">
                  <Cog className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Software Development</CardTitle>
                <CardDescription className="text-slate-300">
                  Custom software solutions built with cutting-edge technologies to streamline your operations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl text-white">Strategic SEO</CardTitle>
                <CardDescription className="text-slate-300">
                  Data-driven SEO strategies to improve your online visibility and drive organic growth.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Why Partner With UNITE Group?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Proven Expertise</h3>
                    <p className="text-slate-300">Years of experience delivering successful projects across diverse industries.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Innovation Focus</h3>
                    <p className="text-slate-300">Cutting-edge solutions that keep you ahead of the competition.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Dedicated Support</h3>
                    <p className="text-slate-300">Ongoing partnership and support to ensure your continued success.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-2xl p-8 border border-teal-500/30">
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Star className="h-10 w-10 text-slate-900" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Excellence Guaranteed</h3>
                  <p className="text-slate-300 text-lg">
                    We&apos;re committed to delivering exceptional results that exceed your expectations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-teal-100">
            Let&apos;s discuss how UNITE Group can help you achieve your goals through innovative solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="bg-white text-teal-600 hover:bg-slate-100">
              <Link href="/contact">Get Started Today</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-lg">UG</span>
                </div>
                <h3 className="text-xl font-bold text-white">UNITE Group</h3>
              </div>
              <p className="text-slate-400 mb-4">
                Empowering businesses through expert education, innovative software development, and strategic SEO services.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Services</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/education" className="hover:text-white transition-colors">Expert Education</Link></li>
                <li><Link href="/development" className="hover:text-white transition-colors">Software Development</Link></li>
                <li><Link href="/seo" className="hover:text-white transition-colors">Strategic SEO</Link></li>
                <li><Link href="/consulting" className="hover:text-white transition-colors">Business Consulting</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="/team" className="hover:text-white transition-colors">Our Team</Link></li>
                <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="/news" className="hover:text-white transition-colors">News</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-white">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="/resources" className="hover:text-white transition-colors">Resources</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">
              © 2025 UNITE Group. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-400 mt-4 md:mt-0">
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
