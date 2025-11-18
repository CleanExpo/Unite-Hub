import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, ArrowRight, Newspaper } from 'lucide-react';

export const metadata = {
  title: 'Blog - Unite-Hub',
  description: 'Latest news, updates, and insights about AI-powered marketing automation.',
};

export default function BlogPage() {
  const featuredPost = {
    title: 'Introducing Unite-Hub: AI-Powered Marketing Automation',
    excerpt: 'Discover how our AI-first approach is revolutionizing CRM and marketing automation for modern businesses.',
    date: '2025-01-15',
    author: 'Unite-Hub Team',
    category: 'Product',
    image: '/blog/featured.jpg',
  };

  const posts = [
    {
      title: '5 Ways AI is Transforming Customer Relationship Management',
      excerpt: 'Learn how artificial intelligence is reshaping how businesses interact with customers.',
      date: '2025-01-10',
      category: 'AI & ML',
    },
    {
      title: 'Building Effective Drip Campaigns in 2025',
      excerpt: 'Best practices for creating automated email campaigns that convert.',
      date: '2025-01-05',
      category: 'Marketing',
    },
    {
      title: 'How to Score Leads with AI Intelligence',
      excerpt: 'Implement intelligent lead scoring to focus on your hottest prospects.',
      date: '2024-12-28',
      category: 'Product',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="border-b bg-gradient-to-b from-background to-muted/20 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Newspaper className="h-16 w-16 text-primary" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Blog & Insights
            </h1>
            <p className="text-xl text-muted-foreground">
              Latest updates, insights, and best practices for AI-powered marketing.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <Card className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="bg-muted/30 flex items-center justify-center p-12">
                  <div className="text-center">
                    <Newspaper className="h-24 w-24 text-muted-foreground mx-auto" />
                  </div>
                </div>
                <CardHeader className="p-8">
                  <div className="space-y-4">
                    <Badge>{featuredPost.category}</Badge>
                    <CardTitle className="text-3xl">{featuredPost.title}</CardTitle>
                    <CardDescription className="text-base">
                      {featuredPost.excerpt}
                    </CardDescription>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground pt-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(featuredPost.date).toLocaleDateString()}
                      </div>
                      <span>by {featuredPost.author}</span>
                    </div>
                    <Button className="mt-4" asChild>
                      <Link href={`/blog/${featuredPost.title.toLowerCase().replace(/\s+/g, '-')}`}>
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Posts */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Recent Posts</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card key={post.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Badge className="w-fit mb-2">{post.category}</Badge>
                    <CardTitle className="text-xl mb-3">{post.title}</CardTitle>
                    <CardDescription>{post.excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Calendar className="h-4 w-4" />
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                    <Link
                      href={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Read more <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Coming Soon Notice */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-muted-foreground">
              📝 More articles coming soon! Subscribe to our newsletter to stay updated.{' '}
              <Link href="/contact" className="text-primary hover:underline">Contact us</Link> for content suggestions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
