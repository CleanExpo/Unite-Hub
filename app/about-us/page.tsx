import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, Eye, Zap, Users, Lightbulb, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function AboutUsPage() {
  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="absolute inset-0 opacity-10">
          <Image src="/abstract-corporate-background.png" alt="Abstract Background" layout="fill" objectFit="cover" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 mb-6">
            About Unite Group
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
            Discover our journey, mission, and the values that drive us to deliver exceptional technology solutions and
            foster innovation.
          </p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-white mb-4">Our Journey So Far</h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                Founded in 2018 with a vision to bridge the gap between complex technology and business growth, Unite
                Group has steadily grown into a trusted partner for organizations seeking transformative digital
                solutions. Our journey began with a small, passionate team and a commitment to client success.
              </p>
              <p className="text-slate-400 mb-4 leading-relaxed">
                Key milestones, like launching our first enterprise-level SaaS platform in 2020 and expanding our AI
                consulting services in 2022, have defined our trajectory. We believe in the power of collaboration,
                continuous learning, and adapting to the ever-evolving tech landscape.
              </p>
            </div>
            <div>
              <Image
                src="/corporate-timeline-montage.png"
                alt="Our Journey Montage"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover aspect-[4/3]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-semibold text-white text-center mb-12">Our Guiding Principles</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700 text-slate-50">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-cyan-400">
                  <Target size={28} className="mr-3" /> Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  To empower businesses with innovative and tailored technology solutions, driving growth, efficiency,
                  and a competitive edge in their respective industries.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700 text-slate-50">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-sky-400">
                  <Eye size={28} className="mr-3" /> Our Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  To be a globally recognized leader in technology consulting and solution delivery, known for our
                  commitment to excellence, integrity, and transformative impact.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700 text-slate-50">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-indigo-400">
                  <Zap size={28} className="mr-3" /> Our Core Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  <li>Client-Centricity</li>
                  <li>Innovation & Excellence</li>
                  <li>Integrity & Transparency</li>
                  <li>Collaboration & Teamwork</li>
                  <li>Continuous Learning</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Culture Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <Image
                src="/company-culture-collaboration.png"
                alt="Company Culture"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover aspect-[4/3]"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl font-semibold text-white mb-4">Our Culture: People First</h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                At Unite Group, we cultivate an environment where creativity, curiosity, and collaboration thrive. We
                invest in our team's growth through continuous training, mentorship programs, and opportunities to work
                on cutting-edge projects.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="h-6 w-6 mr-3 mt-1 text-cyan-400" />
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">Collaborative Spirit:</span> We believe the best ideas
                    come from teamwork and open communication.
                  </p>
                </div>
                <div className="flex items-start">
                  <Lightbulb className="h-6 w-6 mr-3 mt-1 text-cyan-400" />
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">Innovation Driven:</span> We encourage experimentation
                    and provide the freedom to explore new technologies.
                  </p>
                </div>
                <div className="flex items-start">
                  <Heart className="h-6 w-6 mr-3 mt-1 text-cyan-400" />
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">Work-Life Balance:</span> We support our team's
                    well-being with flexible work arrangements and a focus on sustainable performance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-white mb-6">Ready to Partner with Us?</h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8">
            Let's discuss how Unite Group can help your business achieve its technology goals.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition duration-300"
            asChild
          >
            <Link href="/contact">Get in Touch</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
