import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Mail, Book, Headphones, ArrowRight, Clock } from 'lucide-react';

export const metadata = {
  title: 'Support - Unite-Hub',
  description: 'Get help with Unite-Hub. Access documentation, contact support, or explore our knowledge base.',
};

export default function SupportPage() {
  const supportOptions = [
    {
      icon: Book,
      title: 'Documentation',
      description: 'Browse our comprehensive guides and tutorials',
      href: '/docs',
      action: 'View Docs',
      color: 'text-blue-600',
    },
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Send us an email and we will respond within 24 hours',
      href: 'mailto:support@unite-hub.com',
      action: 'Send Email',
      color: 'text-green-600',
    },
    {
      icon: MessageCircle,
      title: 'Live Chat',
      description: 'Chat with our support team in real-time',
      href: '#',
      action: 'Start Chat',
      color: 'text-purple-600',
    },
    {
      icon: Headphones,
      title: 'Schedule a Call',
      description: 'Book a 30-minute onboarding session with our team',
      href: '/contact',
      action: 'Book Now',
      color: 'text-orange-600',
    },
  ];

  const faqs = [
    {
      question: 'How do I get started with Unite-Hub?',
      answer: 'Sign up for a free trial, connect your email, and start automating your workflows. Check our Quick Start guide for step-by-step instructions.',
    },
    {
      question: 'What integrations are available?',
      answer: 'Unite-Hub integrates with Gmail, Outlook, Google Calendar, Stripe, and more. Visit our integrations page for the complete list.',
    },
    {
      question: 'How does AI lead scoring work?',
      answer: 'Our AI analyzes email engagement, sentiment, intent signals, and contact behavior to generate a 0-100 score indicating conversion likelihood.',
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! You can export all your contacts, emails, and campaign data at any time in CSV or JSON format.',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              How can we help?
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Get the support you need to succeed with Unite-Hub.
              We're here to help every step of the way.
            </p>
          </div>
        </div>
      </section>

      {/* Support Options */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Get in Touch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {supportOptions.map((option) => (
                <Card key={option.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-muted ${option.color}`}>
                        <option.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="mb-2">{option.title}</CardTitle>
                        <CardDescription>{option.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href={option.href}>
                        {option.action} <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support Hours */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Clock className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">Support Hours</CardTitle>
                <CardDescription>
                  Our support team is available during the following hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <h3 className="font-semibold mb-2">Email Support</h3>
                    <p className="text-sm text-muted-foreground">24/7</p>
                    <p className="text-xs text-muted-foreground mt-1">Response within 24h</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Live Chat</h3>
                    <p className="text-sm text-muted-foreground">Mon-Fri</p>
                    <p className="text-xs text-muted-foreground mt-1">9 AM - 6 PM EST</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Phone Support</h3>
                    <p className="text-sm text-muted-foreground">Enterprise Only</p>
                    <p className="text-xs text-muted-foreground mt-1">24/7 Priority</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-12">
              <p className="text-muted-foreground mb-4">
                Cannot find what you are looking for?
              </p>
              <Button asChild>
                <Link href="/contact">
                  Contact Support <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
