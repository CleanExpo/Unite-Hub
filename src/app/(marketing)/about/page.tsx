import { Metadata } from 'next';
import { Target, Users, Zap, Shield, Globe, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'About Us | Unite-Hub',
  description: 'Learn about Unite-Hub - AI-powered marketing automation and CRM for modern businesses',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6">About Unite-Hub</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We're on a mission to make marketing automation accessible, intelligent, and effective for businesses of all sizes.
          </p>
        </div>

        {/* Mission Section */}
        <div className="mb-16">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 md:p-12">
            <div className="flex items-start gap-4 mb-4">
              <Target className="h-8 w-8 text-primary flex-shrink-0" />
              <div>
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-lg text-muted-foreground mb-4">
                  To empower businesses with AI-driven marketing automation that builds genuine relationships,
                  not just transactions. We believe in combining cutting-edge technology with human-centered
                  design to create tools that work for you, not against you.
                </p>
                <p className="text-lg text-muted-foreground">
                  Founded in 2024, Unite-Hub emerged from the frustration of using complex, enterprise-grade
                  marketing tools that required entire teams to operate. We built something different—intuitive,
                  powerful, and accessible.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Innovation First</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We leverage the latest AI technology (Claude by Anthropic) to deliver features that
                  didn't exist before—like intelligent contact scoring, automated content generation,
                  and predictive analytics.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>User-Centric Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Every feature is designed with real user workflows in mind. We obsess over details,
                  reduce complexity, and ensure you can accomplish tasks in seconds, not hours.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Privacy & Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your data is yours. We implement enterprise-grade security (RLS, encryption, MFA)
                  and never sell your information. GDPR and CCPA compliant from day one.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Transparency</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We believe in open communication. Our pricing is straightforward, our AI usage is
                  disclosed, and we publish regular updates about what we're building.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Customer Success</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your success is our success. We provide responsive support, comprehensive documentation,
                  and proactive guidance to help you get the most out of Unite-Hub.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Continuous Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We ship new features weekly, gather user feedback obsessively, and iterate rapidly.
                  Unite-Hub today is 10x better than Unite-Hub six months ago.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Story Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-lg text-muted-foreground mb-4">
              Unite-Hub was born from a simple observation: most marketing automation tools are built for
              Fortune 500 companies, not for the thousands of agencies, consultants, and growing businesses
              that need powerful automation without enterprise complexity.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              After years of working with clunky CRMs and over-engineered marketing platforms, our founders
              asked: "What if we built something that just works?" Not a tool that requires certification
              courses to use. Not software that costs more than your salary. Just intelligent, elegant
              automation that amplifies what you're already great at.
            </p>
            <p className="text-lg text-muted-foreground mb-4">
              We started with the hardest problems first:
            </p>
            <ul className="text-lg text-muted-foreground mb-4">
              <li>How do we automatically score leads without requiring manual setup?</li>
              <li>How do we generate personalized content that doesn't sound robotic?</li>
              <li>How do we analyze thousands of emails without hiring data scientists?</li>
              <li>How do we make drip campaigns visual and intuitive, not code-based?</li>
            </ul>
            <p className="text-lg text-muted-foreground mb-4">
              The answer: AI-first architecture combined with world-class UX. By leveraging Claude's advanced
              reasoning capabilities and Next.js 15's performance, we built a platform that feels fast,
              intelligent, and delightful to use.
            </p>
            <p className="text-lg text-muted-foreground">
              Today, Unite-Hub is trusted by agencies, consultants, and growth teams across the globe. We're
              still a small, focused team, but we're growing—and we'd love for you to join us on this journey.
            </p>
          </div>
        </div>

        {/* Tech Stack Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-6">Built on Modern Technology</h2>
          <div className="bg-muted/50 border rounded-lg p-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Frontend</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Next.js 16 with App Router & Turbopack</li>
                  <li>• React 19 with Server Components</li>
                  <li>• TypeScript for type safety</li>
                  <li>• Tailwind CSS + shadcn/ui</li>
                  <li>• Framer Motion for animations</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Backend</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Supabase PostgreSQL with RLS</li>
                  <li>• NextAuth.js for authentication</li>
                  <li>• 143 API endpoints</li>
                  <li>• Row-level security policies</li>
                  <li>• Real-time subscriptions</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">AI Layer</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Claude Opus 4 (Extended Thinking)</li>
                  <li>• Claude Sonnet 4.5 (Fast operations)</li>
                  <li>• Claude Haiku 4.5 (Quick tasks)</li>
                  <li>• Prompt caching for cost optimization</li>
                  <li>• OpenAI Whisper for transcription</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Infrastructure</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Vercel for hosting (99.9% uptime)</li>
                  <li>• Supabase Storage for media files</li>
                  <li>• Stripe for payments</li>
                  <li>• Gmail API for email integration</li>
                  <li>• End-to-end encryption</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-6">Join Our Team</h2>
          <p className="text-center text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals who are passionate about building products
            that make a difference. Check out our open positions.
          </p>
          <div className="text-center">
            <a
              href="/careers"
              className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              View Open Positions →
            </a>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Want to Learn More?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Have questions about Unite-Hub? Want to discuss a partnership? We'd love to hear from you.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="/contact"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Contact Us
            </a>
            <a
              href="mailto:hello@unite-hub.com"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
