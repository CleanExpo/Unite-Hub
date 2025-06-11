import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ServiceComparisonTable } from "@/components/services/ServiceComparisonTable";
import { ServiceRecommendationQuiz } from "@/components/services/ServiceRecommendationQuiz";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  Code, 
  Search, 
  BarChart3, 
  Shield, 
  GraduationCap,
  MessageSquare,
  CheckCircle,
  Sparkles,
  Target,
  Users,
  Award,
  Zap
} from "lucide-react";

export const metadata: Metadata = {
  title: "Our Services | Unite Group - Business Solutions & Technology",
  description: "Explore Unite Group's comprehensive business services: Software Development, Strategic SEO, Business Strategy, Quality Assurance, and Expert Education.",
};

const services = [
  {
    title: "Initial Consultation",
    description: "Start your transformation journey with expert guidance",
    href: "/services/initial-consultation",
    icon: <MessageSquare className="h-6 w-6" />,
    price: "$550",
    features: [
      "Business analysis",
      "Strategy roadmap",
      "Risk assessment",
      "ROI projections"
    ],
    color: "from-teal-500 to-cyan-500",
    popular: false
  },
  {
    title: "Software Development",
    description: "Custom solutions that scale with your business",
    href: "/services/software-development",
    icon: <Code className="h-6 w-6" />,
    price: "Custom Quote",
    features: [
      "Web applications",
      "Mobile apps",
      "API development",
      "Cloud solutions"
    ],
    color: "from-blue-500 to-indigo-500",
    popular: true
  },
  {
    title: "Strategic SEO",
    description: "Dominate search results and drive organic growth",
    href: "/services/strategic-seo",
    icon: <Search className="h-6 w-6" />,
    price: "From $2,000/mo",
    features: [
      "SEO audit",
      "Content strategy",
      "Link building",
      "Monthly reports"
    ],
    color: "from-purple-500 to-pink-500",
    popular: false
  },
  {
    title: "Business Strategy",
    description: "Data-driven insights for competitive advantage",
    href: "/services/business-strategy",
    icon: <BarChart3 className="h-6 w-6" />,
    price: "Custom Quote",
    features: [
      "Market analysis",
      "Growth planning",
      "Digital transformation",
      "KPI tracking"
    ],
    color: "from-green-500 to-emerald-500",
    popular: false
  },
  {
    title: "Quality Assurance",
    description: "Ensure excellence in every release",
    href: "/services/quality-assurance",
    icon: <Shield className="h-6 w-6" />,
    price: "From $1,500/mo",
    features: [
      "Test automation",
      "Performance testing",
      "Security audits",
      "Compliance checks"
    ],
    color: "from-orange-500 to-red-500",
    popular: false
  },
  {
    title: "Expert Education",
    description: "Powered by CARSI - Industry-leading certifications and training",
    href: "/services/expert-education",
    icon: <GraduationCap className="h-6 w-6" />,
    price: "From $499",
    features: [
      "IICRC Certifications",
      "Corporate training",
      "Technical workshops",
      "Industry compliance"
    ],
    color: "from-teal-500 to-cyan-500",
    popular: false,
    partnership: "Powered by CARSI"
  }
];

const stats = [
  { value: "500+", label: "Projects Delivered", icon: CheckCircle },
  { value: "99.9%", label: "Client Satisfaction", icon: Award },
  { value: "24/7", label: "Support Available", icon: Users },
  { value: "10+", label: "Years Experience", icon: Target }
];

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600/20 to-cyan-600/20 animate-pulse" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Our Services
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
              Comprehensive business solutions designed to accelerate your growth 
              and transform your digital presence
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500">
                <Link href="/book-consultation">
                  Book Your $550 Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-slate-600 text-white hover:bg-slate-800">
                <Link href="#quiz">
                  Find Your Perfect Service
                  <Sparkles className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={stat.label} className="text-center">
                <stat.icon className="h-8 w-8 text-teal-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Choose Your Path to Success
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Each service is tailored to address specific business challenges and opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <div key={service.title}>
                <Card className="h-full bg-slate-800 border-slate-700 hover:border-teal-600 transition-all hover:shadow-xl group relative overflow-hidden">
                  {service.popular && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  {service.partnership && (
                    <div className="absolute top-4 right-4 z-10">
                      <span className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {service.partnership}
                      </span>
                    </div>
                  )}
                  
                  <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                  
                  <CardHeader>
                    <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${service.color} text-white mb-4`}>
                      {service.icon}
                    </div>
                    <CardTitle className="text-2xl text-white group-hover:text-teal-400 transition-colors">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-lg">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    <div>
                      <div className="text-3xl font-bold text-white mb-2">
                        {service.price}
                      </div>
                      <ul className="space-y-2">
                        {service.features.map((feature) => (
                          <li key={feature} className="flex items-center gap-2 text-slate-400">
                            <CheckCircle className="h-4 w-4 text-teal-500 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Button
                      asChild
                      className={service.popular 
                        ? "w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500"
                        : "w-full bg-slate-700 hover:bg-slate-600"
                      }
                    >
                      <Link href={service.href}>
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Compare Our Services
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Find the perfect combination of services for your business needs
            </p>
          </div>

          <div className="bg-slate-900 rounded-2xl p-8 shadow-xl">
            <ServiceComparisonTable />
          </div>
        </div>
      </section>

      {/* Service Recommendation Quiz */}
      <section id="quiz" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Not Sure Where to Start?
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Take our quick quiz to get personalized service recommendations
            </p>
          </div>

          <div>
            <ServiceRecommendationQuiz />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div>
            <div className="inline-flex p-4 bg-white/10 rounded-full mb-6">
              <Zap className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl mb-8 text-teal-100">
              Let&apos;s discuss how our services can help you achieve your goals
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button asChild size="lg" className="bg-white text-teal-600 hover:bg-slate-100">
                <Link href="/book-consultation">
                  Book Your $550 Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-teal-600">
                <Link href="/contact">
                  Contact Our Team
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
