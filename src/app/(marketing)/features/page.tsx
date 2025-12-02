import { Metadata } from 'next';
import {
  Brain, Mail, Zap, BarChart3, Users, Clock,
  Target, MessageSquare, FileText, Video, Search,
  GitBranch, Sparkles, Shield, Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TextLoop } from '@/components/ui/text-loop';

export const metadata: Metadata = {
  title: 'Features | Unite-Hub',
  description: 'Discover powerful AI-driven features for marketing automation and CRM',
};

export default function FeaturesPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4">AI-Powered Automation</Badge>
          <h1 className="text-5xl font-bold mb-6">Everything You Need to Scale</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Unite-Hub combines cutting-edge AI with intuitive design to automate your marketing workflows,
            nurture leads, and build genuine customer relationships—all in one platform.
          </p>
        </div>

        {/* Core Features Grid */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Intelligence */}
            <Card className="border-primary/50">
              <CardHeader>
                <Brain className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>AI Contact Intelligence</CardTitle>
                <CardDescription>
                  Automatically score and qualify leads using Claude AI's advanced reasoning
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• 0-100 composite scoring (engagement, sentiment, intent)</li>
                  <li>• Automatic "Hot Lead" identification</li>
                  <li>• Job title and role analysis</li>
                  <li>• Status progression tracking</li>
                </ul>
              </CardContent>
            </Card>

            {/* Content Generation */}
            <Card className="border-primary/50">
              <CardHeader>
                <Sparkles className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>AI Content Generation</CardTitle>
                <CardDescription>
                  Create personalized emails, proposals, and campaigns in seconds
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Extended Thinking for high-quality content</li>
                  <li>• Personalized based on contact data</li>
                  <li>• Multiple content types (email, proposal, case study)</li>
                  <li>• Draft review and editing workflow</li>
                </ul>
              </CardContent>
            </Card>

            {/* Email Processing */}
            <Card className="border-primary/50">
              <CardHeader>
                <Mail className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Intelligent Email Processing</CardTitle>
                <CardDescription>
                  Automatically analyze emails and extract actionable insights
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Intent extraction (question, request, complaint, etc.)</li>
                  <li>• Sentiment analysis (positive, neutral, negative)</li>
                  <li>• Auto-linking to CRM contacts</li>
                  <li>• Smart email threading</li>
                </ul>
              </CardContent>
            </Card>

            {/* Drip Campaigns */}
            <Card>
              <CardHeader>
                <GitBranch className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Visual Drip Campaigns</CardTitle>
                <CardDescription>
                  Build sophisticated email sequences with drag-and-drop simplicity
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Conditional branching (if/else logic)</li>
                  <li>• Multiple trigger types (manual, tag, score)</li>
                  <li>• A/B testing support</li>
                  <li>• Wait steps and time delays</li>
                </ul>
              </CardContent>
            </Card>

            {/* Media Intelligence */}
            <Card>
              <CardHeader>
                <Video className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Media Intelligence</CardTitle>
                <CardDescription>
                  Upload, transcribe, and analyze videos, audio, and documents with AI
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• OpenAI Whisper transcription (video/audio)</li>
                  <li>• Claude AI analysis (summary, key points, entities)</li>
                  <li>• Full-text search across transcripts</li>
                  <li>• Automatic file organization</li>
                </ul>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <BarChart3 className="h-10 w-10 mb-2 text-primary" />
                <CardTitle>Real-Time Analytics</CardTitle>
                <CardDescription>
                  Track campaign performance, engagement, and ROI in live dashboards
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-2">
                  <li>• Email open and click tracking</li>
                  <li>• Campaign performance metrics</li>
                  <li>• Contact engagement history</li>
                  <li>• Lead scoring trends</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Powerful Integrations</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Gmail</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                OAuth 2.0, sync, send, track opens/clicks
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Globe className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Google Drive</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                File storage, document collaboration
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Stripe</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Payment processing, subscriptions
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="h-8 w-8 mx-auto mb-2 text-primary" />
                <CardTitle className="text-lg">Google Calendar</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Scheduling, meeting automation
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Advanced Capabilities</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full p-3 h-fit">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Workspace Isolation</h3>
                <p className="text-muted-foreground">
                  Enterprise-grade data separation with Row Level Security (RLS). Each workspace
                  is completely isolated—team members can only access their organization's data.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full p-3 h-fit">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Role-Based Permissions</h3>
                <p className="text-muted-foreground">
                  Granular access control with roles (owner, admin, member). Control who can
                  create campaigns, manage contacts, or access sensitive data.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full p-3 h-fit">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Full-Text Search</h3>
                <p className="text-muted-foreground">
                  Lightning-fast search across contacts, campaigns, emails, and media transcripts
                  using PostgreSQL's advanced text search capabilities.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full p-3 h-fit">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Smart Tagging</h3>
                <p className="text-muted-foreground">
                  Organize contacts with custom tags. Use tags in drip campaign triggers,
                  segmentation, and automated workflows.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full p-3 h-fit">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Audit Logging</h3>
                <p className="text-muted-foreground">
                  Complete audit trail of all actions. Track who did what, when, and from where.
                  Essential for compliance and security.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="bg-primary/10 rounded-full p-3 h-fit">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Multi-Channel Support</h3>
                <p className="text-muted-foreground">
                  Email, SMS, WhatsApp integration (coming soon). Manage all customer communications
                  from one unified inbox.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transformation Showcase */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-4">See the Transformation</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            Watch how Unite-Hub transforms your marketing workflow from manual chaos to automated excellence
          </p>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-red-600">❌ Without Unite-Hub</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span>
                  <span>Manual email sorting and follow-ups</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span>
                  <span>Leads slip through cracks constantly</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span>
                  <span>Hours spent on repetitive tasks</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-red-600">✗</span>
                  <span>No clear lead scoring or prioritization</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4 text-green-600">✅ With Unite-Hub</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>AI-powered email analysis and scoring</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Hot leads automatically identified</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>10+ hours saved per week per team member</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Intelligent composite lead scoring (0-100)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Models Section */}
        <div className="mb-20 bg-muted/50 border rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Powered by Claude AI</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We use Anthropic's state-of-the-art AI models to deliver intelligent features
              that actually work. Choose from:
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary/10 rounded-lg p-4 mb-3">
                <h3 className="font-semibold mb-1">Claude Opus 4</h3>
                <p className="text-sm text-muted-foreground">Extended Thinking</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Complex reasoning for content generation and strategic analysis
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-lg p-4 mb-3">
                <h3 className="font-semibold mb-1">Claude Sonnet 4.5</h3>
                <p className="text-sm text-muted-foreground">Fast & Accurate</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Standard operations, email processing, intent extraction
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 rounded-lg p-4 mb-3">
                <h3 className="font-semibold mb-1">Claude Haiku 4.5</h3>
                <p className="text-sm text-muted-foreground">Ultra-Fast</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Quick tasks, documentation, simple queries
              </p>
            </div>
          </div>
        </div>

        {/* Feature Comparison Table */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold">Feature</th>
                  <th className="text-center p-4 font-semibold">Starter</th>
                  <th className="text-center p-4 font-semibold">Pro</th>
                  <th className="text-center p-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">Contacts</td>
                  <td className="text-center p-4 text-muted-foreground">500</td>
                  <td className="text-center p-4 text-muted-foreground">5,000</td>
                  <td className="text-center p-4 text-muted-foreground">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">AI Content Generation</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Email Tracking</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Drip Campaigns</td>
                  <td className="text-center p-4 text-muted-foreground">5</td>
                  <td className="text-center p-4 text-muted-foreground">50</td>
                  <td className="text-center p-4 text-muted-foreground">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Media Transcription</td>
                  <td className="text-center p-4 text-muted-foreground">10 hrs/mo</td>
                  <td className="text-center p-4 text-muted-foreground">100 hrs/mo</td>
                  <td className="text-center p-4 text-muted-foreground">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Workspaces</td>
                  <td className="text-center p-4 text-muted-foreground">1</td>
                  <td className="text-center p-4 text-muted-foreground">5</td>
                  <td className="text-center p-4 text-muted-foreground">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Team Members</td>
                  <td className="text-center p-4 text-muted-foreground">3</td>
                  <td className="text-center p-4 text-muted-foreground">25</td>
                  <td className="text-center p-4 text-muted-foreground">Unlimited</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Priority Support</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">Custom Integrations</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4">✓</td>
                </tr>
                <tr>
                  <td className="p-4">SSO (SAML)</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4">—</td>
                  <td className="text-center p-4">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Feature Highlight */}
        <div className="mb-20 bg-gradient-to-r from-blue-50 to-teal-50 border rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">What Customers Love Most</h2>
          </div>
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-2xl font-semibold text-primary mb-4">
              <TextLoop interval={4000}>
                <span>🚀 10+ hours saved per week</span>
                <span>🎯 Hot leads instantly identified</span>
                <span>📧 Personalized content in seconds</span>
                <span>📊 AI-powered lead scoring</span>
              </TextLoop>
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" asChild>
              <a href="/pricing">View Pricing</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="/contact">Contact Sales</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
