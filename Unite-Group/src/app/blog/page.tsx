"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Calendar, User, ArrowRight, Clock } from "lucide-react";

export default function Blog() {
  // Sample blog posts data
  const blogPosts = [
    {
      id: 1,
      title: "5 Ways Digital Transformation Can Boost Your Manufacturing Business",
      excerpt: "Explore how digital transformation initiatives can revolutionize manufacturing processes, improve efficiency, and drive growth in today's competitive landscape.",
      image: "/images/handshake-gear.png",
      author: "John Smith",
      date: "May 20, 2025",
      readTime: "7 min read",
      category: "Digital Transformation",
      tags: ["Manufacturing", "IoT", "Industry 4.0"],
      slug: "digital-transformation-manufacturing"
    },
    {
      id: 2,
      title: "The Ultimate Guide to Building a Secure E-Commerce Platform",
      excerpt: "Learn the essential security practices, technologies, and strategies needed to build and maintain a secure e-commerce platform that protects customer data.",
      image: "/software-code-blue-teal.png",
      author: "Sarah Johnson",
      date: "May 15, 2025",
      readTime: "10 min read",
      category: "E-Commerce",
      tags: ["Security", "Payment Processing", "Customer Data"],
      slug: "secure-ecommerce-guide"
    },
    {
      id: 3,
      title: "Leveraging Data Analytics for Business Growth: A Step-by-Step Approach",
      excerpt: "Discover how to implement data analytics in your business operations to uncover insights, drive decision-making, and create sustainable growth strategies.",
      image: "/modern-office-collaboration.png",
      author: "Michael Chen",
      date: "May 10, 2025",
      readTime: "8 min read",
      category: "Data Analytics",
      tags: ["Business Intelligence", "Data-Driven Decisions", "Analytics"],
      slug: "data-analytics-business-growth"
    },
    {
      id: 4,
      title: "Cloud Migration Strategies for Healthcare Organizations",
      excerpt: "A comprehensive guide to navigating the complexities of cloud migration for healthcare providers while maintaining HIPAA compliance and data security.",
      image: "/placeholder.jpg",
      author: "Dr. Emily Parker",
      date: "May 5, 2025",
      readTime: "12 min read",
      category: "Healthcare Tech",
      tags: ["Cloud Computing", "HIPAA", "Data Security"],
      slug: "healthcare-cloud-migration"
    },
    {
      id: 5,
      title: "The Business Value of a $550 Strategic Consultation",
      excerpt: "Understand how a focused strategic consultation can provide immediate insights, actionable recommendations, and long-term value for your business growth.",
      image: "/placeholder-logo.png",
      author: "Phill McGurk",
      date: "May 1, 2025",
      readTime: "6 min read",
      category: "Business Strategy",
      tags: ["Consulting", "ROI", "Strategic Planning"],
      slug: "strategic-consultation-value"
    },
    {
      id: 6,
      title: "Implementing DevOps Practices in Traditional Enterprises",
      excerpt: "Learn practical approaches to introducing DevOps methodologies in established organizations with legacy systems and traditional development practices.",
      image: "/placeholder.jpg",
      author: "Alex Rodriguez",
      date: "April 25, 2025",
      readTime: "9 min read",
      category: "DevOps",
      tags: ["CI/CD", "Automation", "Culture Change"],
      slug: "devops-traditional-enterprises"
    }
  ];

  // Sample categories
  const categories = [
    "All Categories",
    "Digital Transformation",
    "E-Commerce",
    "Data Analytics",
    "Healthcare Tech",
    "Business Strategy",
    "DevOps",
    "Cloud Computing",
    "Cybersecurity"
  ];

  // Featured post (first post)
  const featuredPost = blogPosts[0];

  // Remaining posts
  const remainingPosts = blogPosts.slice(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-teal-400">UG</span> UNITE Group
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-slate-300 hover:text-white transition-colors">Services</Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
              Login
            </Link>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/book-consultation">Book Now</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-bold text-white mb-6">
            Insights &
            <span className="block bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Resources
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-10 max-w-3xl mx-auto">
            Explore our latest articles, guides, and resources to help you navigate the complex world of business technology and strategy.
          </p>
          
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Search articles..." 
                className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 w-full"
              />
            </div>
            <select 
              className="flex h-10 rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              aria-label="Filter by category"
              title="Select a category to filter articles"
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="pb-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-teal-500 pl-4">Featured Article</h2>
          
          <Card className="bg-slate-800 border-slate-700 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <div className="relative h-64 md:h-auto">
                <Image 
                  src={featuredPost.image} 
                  alt={featuredPost.title}
                  fill
                  style={{ objectFit: 'cover' }}
                  className="transition-transform hover:scale-105"
                />
              </div>
              <div className="p-8">
                <Badge className="mb-4 bg-teal-900/50 text-teal-400 border-teal-800">
                  {featuredPost.category}
                </Badge>
                <h3 className="text-2xl font-bold text-white mb-4">{featuredPost.title}</h3>
                <p className="text-slate-300 mb-6">{featuredPost.excerpt}</p>
                
                <div className="flex items-center text-slate-400 text-sm mb-6">
                  <User className="h-4 w-4 mr-1" />
                  <span className="mr-4">{featuredPost.author}</span>
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="mr-4">{featuredPost.date}</span>
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{featuredPost.readTime}</span>
                </div>
                
                <Button asChild className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                  <Link href={`/blog/${featuredPost.slug}`}>
                    Read Article <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* All Posts */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-8 border-l-4 border-teal-500 pl-4">Latest Articles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {remainingPosts.map((post) => (
              <Card key={post.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors overflow-hidden h-full flex flex-col">
                <div className="relative h-48">
                  <Image 
                    src={post.image} 
                    alt={post.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-transform hover:scale-105"
                  />
                  <Badge className="absolute top-4 left-4 bg-slate-800/80 text-teal-400 backdrop-blur-sm">
                    {post.category}
                  </Badge>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-white">{post.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 flex-grow">
                  <CardDescription className="text-slate-300 mb-4">{post.excerpt}</CardDescription>
                  <div className="flex items-center text-slate-400 text-xs mt-4">
                    <User className="h-3 w-3 mr-1" />
                    <span className="mr-3">{post.author}</span>
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{post.date}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 border-t border-slate-700">
                  <Button asChild variant="ghost" className="text-teal-400 hover:text-teal-300 hover:bg-slate-700 w-full justify-between">
                    <Link href={`/blog/${post.slug}`}>
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Subscribe to Our Newsletter</h2>
          <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
            Get the latest insights, articles, and resources delivered straight to your inbox. No spam, just valuable content to help your business grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <Input 
              placeholder="Your email address" 
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
            />
            <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white whitespace-nowrap">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
