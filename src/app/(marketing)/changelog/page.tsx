import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles, Bug, Zap, Shield } from 'lucide-react';

export const metadata = {
  title: 'Changelog - Unite-Hub',
  description: 'See what is new in Unite-Hub. Latest features, improvements, and bug fixes.',
};

export default function ChangelogPage() {
  const releases = [
    {
      version: '1.2.0',
      date: '2025-01-18',
      badge: 'Latest',
      items: [
        {
          type: 'feature',
          title: 'JWT-Authenticated API Routes',
          description: 'Fixed critical RLS policy issues with proper JWT context handling',
          icon: Shield,
        },
        {
          type: 'feature',
          title: 'Marketing Pages',
          description: 'Added comprehensive marketing pages: docs, blog, support, API, integrations, changelog',
          icon: Sparkles,
        },
        {
          type: 'improvement',
          title: 'Enhanced Logging',
          description: 'Better error messages and debugging information across all API routes',
          icon: Zap,
        },
      ],
    },
    {
      version: '1.1.0',
      date: '2025-01-15',
      items: [
        {
          type: 'feature',
          title: 'AI Content Generation',
          description: 'Extended Thinking for personalized marketing content generation',
          icon: Sparkles,
        },
        {
          type: 'feature',
          title: 'Contact Intelligence',
          description: 'AI-powered lead scoring with composite scoring algorithm',
          icon: Zap,
        },
        {
          type: 'improvement',
          title: 'Email Service',
          description: 'Multi-provider email fallback (SendGrid → Resend → Gmail)',
          icon: Zap,
        },
      ],
    },
    {
      version: '1.0.0',
      date: '2025-01-01',
      badge: 'MVP',
      items: [
        {
          type: 'feature',
          title: 'Initial Release',
          description: 'Unite-Hub MVP with core CRM and marketing automation features',
          icon: Sparkles,
        },
        {
          type: 'feature',
          title: 'Gmail Integration',
          description: 'OAuth 2.0 email sync, tracking, and sending',
          icon: Sparkles,
        },
        {
          type: 'feature',
          title: 'Drip Campaigns',
          description: 'Visual campaign builder with conditional branching',
          icon: Sparkles,
        },
      ],
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return Sparkles;
      case 'bug':
        return Bug;
      case 'improvement':
        return Zap;
      default:
        return Sparkles;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-green-600';
      case 'bug':
        return 'bg-red-600';
      case 'improvement':
        return 'bg-blue-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Changelog
            </h1>
            <p className="text-xl text-muted-foreground">
              Track the latest features, improvements, and bug fixes.
              We ship fast and iterate continuously.
            </p>
          </div>
        </div>
      </section>

      {/* Releases */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-12">
              {releases.map((release) => (
                <div key={release.version}>
                  {/* Release Header */}
                  <div className="flex items-center gap-4 mb-6">
                    <h2 className="text-3xl font-bold">v{release.version}</h2>
                    {release.badge && (
                      <Badge className="bg-primary">{release.badge}</Badge>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground ml-auto">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(release.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</span>
                    </div>
                  </div>

                  {/* Release Items */}
                  <div className="space-y-4">
                    {release.items.map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className={`p-2 rounded-lg ${getBadgeColor(item.type)} text-white`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <CardTitle className="text-lg">{item.title}</CardTitle>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {item.type}
                                  </Badge>
                                </div>
                                <CardDescription>{item.description}</CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Subscribe */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="text-muted-foreground">
              Follow us on social media or check back here regularly for the latest updates.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
