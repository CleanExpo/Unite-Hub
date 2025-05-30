import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, Code, Search, Clock, Target, Award, Lightbulb } from "lucide-react";

export default function Features() {
  const services = [
    {
      icon: <Clock className="h-8 w-8 text-teal-400" />,
      title: "Initial Consultation",
      description: "Comprehensive business analysis and strategic planning to understand your unique needs and challenges.",
      benefits: ["In-depth business assessment", "Technology needs analysis", "Strategic roadmap development", "Custom solution recommendations"]
    },
    {
      icon: <Users className="h-8 w-8 text-purple-400" />,
      title: "Expert Education",
      description: "Professional training and development programs designed to enhance your team's capabilities and drive innovation.",
      benefits: ["Custom curriculum development", "Expert-led training sessions", "Hands-on workshops", "Certification programs"]
    },
    {
      icon: <Code className="h-8 w-8 text-blue-400" />,
      title: "Software Development",
      description: "Cutting-edge software solutions built with modern technologies to streamline your operations and boost efficiency.",
      benefits: ["Custom application development", "Modern tech stack implementation", "Scalable architecture design", "Quality assurance & testing"]
    },
    {
      icon: <Search className="h-8 w-8 text-green-400" />,
      title: "Strategic SEO",
      description: "Data-driven SEO strategies to improve your online visibility, drive organic growth, and reach your target audience.",
      benefits: ["Comprehensive SEO audit", "Keyword research & strategy", "Technical SEO optimization", "Performance monitoring"]
    },
    {
      icon: <Target className="h-8 w-8 text-orange-400" />,
      title: "Business Strategy",
      description: "Strategic consulting to help you navigate challenges, identify opportunities, and achieve sustainable growth.",
      benefits: ["Market analysis", "Competitive research", "Growth strategy development", "Performance optimization"]
    },
    {
      icon: <Award className="h-8 w-8 text-red-400" />,
      title: "Quality Assurance",
      description: "Rigorous testing and quality assurance processes to ensure your solutions meet the highest standards.",
      benefits: ["Comprehensive testing", "Performance optimization", "Security audits", "Ongoing maintenance"]
    }
  ];

  const whyChooseUs = [
    {
      icon: <Lightbulb className="h-6 w-6 text-teal-400" />,
      title: "Innovation-Driven",
      description: "We leverage cutting-edge technologies and methodologies to deliver solutions that keep you ahead of the competition."
    },
    {
      icon: <Users className="h-6 w-6 text-purple-400" />,
      title: "Expert Team",
      description: "Our team of seasoned professionals brings years of experience across diverse industries and technologies."
    },
    {
      icon: <Target className="h-6 w-6 text-blue-400" />,
      title: "Results-Focused",
      description: "We are committed to delivering measurable results that directly impact your business growth and success."
    },
    {
      icon: <Award className="h-6 w-6 text-green-400" />,
      title: "Proven Track Record",
      description: "Our portfolio of successful projects demonstrates our ability to deliver exceptional results consistently."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-teal-400">UG</span> UNITE Group
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-white font-medium">Services</Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/contact">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-6">
            Comprehensive Services for
            <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Business Excellence
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            From strategic consultation to cutting-edge development, we provide the expertise and solutions your business needs to thrive in today's digital landscape.
          </p>
          <Button asChild size="lg" className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
            <Link href="/pricing">Start with $550 Consultation</Link>
          </Button>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Our Core Services
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Comprehensive solutions designed to accelerate your business growth and digital transformation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <Card key={index} className="h-full bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors">
                <CardHeader>
                  <div className="mb-4">{service.icon}</div>
                  <CardTitle className="text-xl text-white">{service.title}</CardTitle>
                  <CardDescription className="text-slate-300">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-teal-400 flex-shrink-0" />
                        <span className="text-sm text-slate-300">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Why Choose UNITE Group?
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              We combine expertise, innovation, and dedication to deliver exceptional results for your business.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-300 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Our Proven Process
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              A structured approach that ensures successful outcomes for every project.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Consultation</h3>
              <p className="text-slate-300 text-sm">
                Comprehensive analysis of your business needs and strategic planning session.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Strategy</h3>
              <p className="text-slate-300 text-sm">
                Development of customized solutions and detailed project roadmap.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Implementation</h3>
              <p className="text-slate-300 text-sm">
                Expert execution with regular updates and quality assurance throughout.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Support</h3>
              <p className="text-slate-300 text-sm">
                Ongoing support and optimization to ensure continued success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-teal-100">
            Start with our comprehensive consultation and discover how UNITE Group can accelerate your success.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
              <Link href="/pricing">Book $550 Consultation</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
