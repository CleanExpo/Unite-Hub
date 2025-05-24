import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, X } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$0",
      period: "forever",
      description: "Perfect for small teams getting started",
      features: [
        "Up to 5 team members",
        "3 projects",
        "Basic task management",
        "Email support",
        "1GB storage",
        "Basic reporting"
      ],
      notIncluded: [
        "Advanced analytics",
        "Custom workflows",
        "Priority support",
        "API access"
      ],
      popular: false,
      cta: "Get Started Free"
    },
    {
      name: "Professional",
      price: "$12",
      period: "per user/month",
      description: "For growing teams that need more power",
      features: [
        "Up to 25 team members",
        "Unlimited projects",
        "Advanced task management",
        "Priority email support",
        "50GB storage",
        "Advanced reporting",
        "Custom workflows",
        "Time tracking",
        "Gantt charts"
      ],
      notIncluded: [
        "API access",
        "Custom integrations",
        "Dedicated support"
      ],
      popular: true,
      cta: "Start Free Trial"
    },
    {
      name: "Enterprise",
      price: "$25",
      period: "per user/month",
      description: "For large organizations with advanced needs",
      features: [
        "Unlimited team members",
        "Unlimited projects",
        "All Professional features",
        "24/7 phone support",
        "500GB storage",
        "Custom reporting",
        "API access",
        "Custom integrations",
        "Advanced security",
        "Dedicated account manager",
        "Custom training",
        "SLA guarantee"
      ],
      notIncluded: [],
      popular: false,
      cta: "Contact Sales"
    }
  ];

  const faqs = [
    {
      question: "Can I change plans at any time?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing adjustments."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! We offer a 14-day free trial for our Professional and Enterprise plans. No credit card required to start."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. Enterprise customers can also pay by invoice."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Absolutely. You can cancel your subscription at any time. Your account will remain active until the end of your current billing period."
    },
    {
      question: "Do you offer discounts for annual billing?",
      answer: "Yes! Save 20% when you choose annual billing on any paid plan. The discount is applied automatically at checkout."
    },
    {
      question: "Is my data secure?",
      answer: "Yes, we take security seriously. All data is encrypted in transit and at rest, and we're SOC 2 Type II compliant."
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
            Simple, Transparent
            <span className="block text-purple-600">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Choose the plan that&apos;s right for your team. Start free and scale as you grow.
          </p>
          <div className="inline-flex items-center bg-white rounded-lg p-1 shadow-sm border">
            <button className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-medium">
              Monthly
            </button>
            <button className="px-4 py-2 rounded-md text-gray-600 text-sm font-medium">
              Annual (Save 20%)
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative h-full ${plan.popular ? 'border-purple-500 shadow-lg scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  <CardDescription className="mt-4">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3 opacity-50">
                        <X className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    asChild 
                    className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    <Link href="/register">{plan.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of teams already using Unite Group to manage their projects better.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">Start Free Trial</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-purple-600">
              <Link href="/features">View Features</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
