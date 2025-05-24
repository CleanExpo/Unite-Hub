import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Users, BarChart3, Calendar, MessageSquare, Shield } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Team Collaboration",
      description: "Work together seamlessly with real-time updates, shared workspaces, and integrated communication tools.",
      benefits: ["Real-time collaboration", "Shared workspaces", "Team messaging", "File sharing"]
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-green-600" />,
      title: "Advanced Analytics",
      description: "Get insights into your team's performance with detailed reports, custom dashboards, and data visualization.",
      benefits: ["Custom dashboards", "Performance metrics", "Data visualization", "Export reports"]
    },
    {
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      title: "Project Planning",
      description: "Plan and track projects with Gantt charts, milestone tracking, and automated scheduling.",
      benefits: ["Gantt charts", "Milestone tracking", "Resource planning", "Timeline management"]
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-orange-600" />,
      title: "Communication Hub",
      description: "Centralize all project communication with integrated chat, comments, and notification systems.",
      benefits: ["Integrated chat", "Comment threads", "Smart notifications", "Email integration"]
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: "Enterprise Security",
      description: "Keep your data secure with enterprise-grade security, role-based permissions, and audit trails.",
      benefits: ["Role-based access", "Data encryption", "Audit trails", "Compliance ready"]
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-teal-600" />,
      title: "Task Management",
      description: "Organize work with powerful task management, custom workflows, and automation rules.",
      benefits: ["Custom workflows", "Task automation", "Priority management", "Progress tracking"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-gray-900">Unite Group</Link>
          <div className="flex gap-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for
            <span className="block text-purple-600">Modern Teams</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Everything you need to manage projects, collaborate with your team, and deliver results faster than ever before.
          </p>
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link href="/register">Start Free Trial</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Seamless Integrations
          </h2>
          <p className="text-lg text-gray-600 mb-12">
            Connect with the tools your team already uses and loves.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
            <div className="text-2xl font-bold text-gray-400">Slack</div>
            <div className="text-2xl font-bold text-gray-400">GitHub</div>
            <div className="text-2xl font-bold text-gray-400">Google</div>
            <div className="text-2xl font-bold text-gray-400">Microsoft</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teams already using Unite Group to deliver better results.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
