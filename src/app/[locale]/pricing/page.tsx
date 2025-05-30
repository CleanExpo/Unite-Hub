import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Users, Code, Search } from "lucide-react";

export default function Pricing() {
  const services = [
    {
      name: "Initial Consultation",
      price: "$550",
      period: "1 hour session",
      description: "Comprehensive business analysis and strategic planning session",
      icon: <Clock className="h-8 w-8 text-teal-600" />,
      features: [
        "In-depth business assessment",
        "Technology needs analysis",
        "Strategic roadmap development",
        "Custom solution recommendations",
        "Implementation timeline",
        "Resource requirement planning",
        "Follow-up summary report",
        "30-day email support"
      ],
      popular: true,
      cta: "Book Consultation"
    },
    {
      name: "Expert Education",
      price: "Scope-based",
      period: "custom pricing",
      description: "Professional training and development programs",
      icon: <Users className="h-8 w-8 text-purple-600" />,
      features: [
        "Custom curriculum development",
        "Expert-led training sessions",
        "Hands-on workshops",
        "Team capability enhancement",
        "Industry best practices",
        "Certification programs",
        "Ongoing mentorship",
        "Progress tracking & assessment"
      ],
      popular: false,
      cta: "Request Quote"
    },
    {
      name: "Software Development",
      price: "Scope-based",
      period: "custom pricing",
      description: "Cutting-edge software solutions built with latest technologies",
      icon: <Code className="h-8 w-8 text-blue-600" />,
      features: [
        "Custom application development",
        "Modern tech stack implementation",
        "Scalable architecture design",
        "User experience optimization",
        "Quality assurance & testing",
        "Deployment & maintenance",
        "Performance optimization",
        "Ongoing technical support"
      ],
      popular: false,
      cta: "Request Quote"
    },
    {
      name: "Strategic SEO",
      price: "Scope-based",
      period: "custom pricing",
      description: "Data-driven SEO strategies to improve online visibility",
      icon: <Search className="h-8 w-8 text-green-600" />,
      features: [
        "Comprehensive SEO audit",
        "Keyword research & strategy",
        "Technical SEO optimization",
        "Content strategy development",
        "Local SEO enhancement",
        "Performance monitoring",
        "Competitor analysis",
        "Monthly reporting & insights"
      ],
      popular: false,
      cta: "Request Quote"
    }
  ];

  const faqs = [
    {
      question: "How does the consultation process work?",
      answer: "Our $550 consultation includes a comprehensive 1-hour session where we analyze your business needs, discuss technology solutions, and create a strategic roadmap. You'll receive a detailed summary report and 30 days of follow-up support."
    },
    {
      question: "How is scope-based pricing determined?",
      answer: "After your initial consultation, we provide detailed quotes based on project scope, complexity, timeline, and resource requirements. All pricing is transparent with no hidden fees."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, bank transfers, and can arrange invoice billing for larger projects. Payment terms are flexible and discussed during consultation."
    },
    {
      question: "Do you offer ongoing support?",
      answer: "Yes! All our services include appropriate support periods. Software development includes maintenance options, and we offer ongoing consulting relationships for continued growth."
    },
    {
      question: "Can you work with our existing team?",
      answer: "Absolutely. We specialize in collaborating with existing teams, providing training, mentorship, and seamless integration with your current processes and technologies."
    },
    {
      question: "What industries do you serve?",
      answer: "We work across all industries, with particular expertise in technology, healthcare, finance, education, and professional services. Our solutions are tailored to your specific industry needs."
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
            Transparent, Value-Driven
            <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Pricing
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Start with our comprehensive consultation, then scale with custom solutions designed for your specific needs.
          </p>
          <div className="inline-flex items-center bg-slate-800 rounded-lg p-1 shadow-lg border border-slate-700">
            <div className="px-4 py-2 rounded-md bg-teal-600 text-white text-sm font-medium">
              Professional Services
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <Card key={index} className={`relative h-full bg-slate-800 border-slate-700 text-white ${service.popular ? 'border-teal-500 shadow-lg shadow-teal-500/20 scale-105' : ''}`}>
                {service.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-teal-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Start Here
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {service.icon}
                  </div>
                  <CardTitle className="text-xl text-white">{service.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-white">{service.price}</span>
                    <span className="text-slate-400 ml-2 text-sm">{service.period}</span>
                  </div>
                  <CardDescription className="mt-4 text-slate-300">{service.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-4 w-4 text-teal-400 flex-shrink-0" />
                        <span className="text-slate-300 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    className={`w-full ${service.popular ? 'bg-teal-600 hover:bg-teal-700' : 'bg-slate-700 hover:bg-slate-600'}`}
                  >
                    <Link href="/contact">{service.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Our Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Consultation</h3>
              <p className="text-slate-300">
                Start with our comprehensive $550 consultation to understand your needs and create a strategic roadmap.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Custom Quote</h3>
              <p className="text-slate-300">
                Receive a detailed, transparent quote based on your specific project scope and requirements.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Implementation</h3>
              <p className="text-slate-300">
                Expert execution with ongoing support, ensuring your success every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-teal-100">
            Start with our comprehensive consultation and discover how UNITE Group can accelerate your success.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
              <Link href="/contact">Book $550 Consultation</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
              <Link href="/features">View Our Services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
