'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, ArrowRight, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const blogPosts = [
  {
    id: 1,
    title: 'The Future of AI in Enterprise Software',
    excerpt: 'Discover how artificial intelligence is revolutionizing enterprise software development and what it means for your business.',
    author: 'Dr. Sarah Chen',
    authorRole: 'Chief AI Officer',
    date: '2025-01-05',
    readTime: '8 min read',
    category: 'AI & Technology',
    featured: true,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=400&fit=crop'
  },
  {
    id: 2,
    title: 'Building Scalable Cloud Infrastructure: A Complete Guide',
    excerpt: 'Learn the best practices for designing and implementing cloud infrastructure that scales with your business needs.',
    author: 'Michael Rodriguez',
    authorRole: 'VP of Engineering',
    date: '2025-01-03',
    readTime: '12 min read',
    category: 'Cloud Computing',
    featured: false,
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop'
  },
  {
    id: 3,
    title: 'CRM Implementation Success Stories',
    excerpt: 'Real-world examples of how companies transformed their customer relationships with our CRM solution.',
    author: 'Emma Wilson',
    authorRole: 'Customer Success Manager',
    date: '2024-12-28',
    readTime: '6 min read',
    category: 'Case Studies',
    featured: false,
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop'
  },
  {
    id: 4,
    title: 'Security Best Practices for SaaS Applications',
    excerpt: 'Essential security measures every SaaS platform should implement to protect user data and maintain compliance.',
    author: 'James Thompson',
    authorRole: 'Security Architect',
    date: '2024-12-25',
    readTime: '10 min read',
    category: 'Security',
    featured: false,
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=400&fit=crop'
  },
  {
    id: 5,
    title: 'Maximizing ROI with Process Automation',
    excerpt: 'How intelligent automation can streamline your operations and deliver measurable business value.',
    author: 'Lisa Zhang',
    authorRole: 'Head of Innovation',
    date: '2024-12-20',
    readTime: '7 min read',
    category: 'Business Strategy',
    featured: false,
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&h=400&fit=crop'
  },
  {
    id: 6,
    title: 'The Rise of No-Code Solutions in Enterprise',
    excerpt: 'Exploring how no-code platforms are democratizing software development and empowering business users.',
    author: 'David Park',
    authorRole: 'Product Manager',
    date: '2024-12-15',
    readTime: '9 min read',
    category: 'Technology Trends',
    featured: false,
    image: 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=400&fit=crop'
  }
]

const categories = [
  'All Posts',
  'AI & Technology',
  'Cloud Computing',
  'Case Studies',
  'Security',
  'Business Strategy',
  'Technology Trends'
]

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Posts')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)
  const [subscribeMessage, setSubscribeMessage] = useState('')

  const handleNewsletterSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newsletterEmail) return
    
    setSubscribing(true)
    setSubscribeMessage('')
    
    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setSubscribeMessage('Thank you for subscribing!')
        setNewsletterEmail('')
      } else {
        setSubscribeMessage(data.error || 'Something went wrong. Please try again.')
      }
    } catch (error) {
      setSubscribeMessage('Failed to subscribe. Please try again.')
    } finally {
      setSubscribing(false)
    }
  }

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'All Posts' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const featuredPost = blogPosts.find(post => post.featured)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Unite Group Blog
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, updates, and expert perspectives on technology, business transformation, and industry trends.
          </p>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'secondary'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </motion.div>

        {/* Featured Post */}
        {featuredPost && selectedCategory === 'All Posts' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-12"
          >
            <Card className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="h-64 md:h-full">
                  <img
                    src={featuredPost.image}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-4">Featured</Badge>
                  <h2 className="text-3xl font-bold mb-4">{featuredPost.title}</h2>
                  <p className="text-gray-600 mb-6">{featuredPost.excerpt}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{featuredPost.readTime}</span>
                    </div>
                  </div>

                  <Link href={`/blog/${featuredPost.id}`}>
                    <Button>
                      Read Article
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts
            .filter(post => !post.featured || selectedCategory !== 'All Posts')
            .map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 * index }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="h-48 overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                
                <CardHeader>
                  <Badge variant="secondary" className="w-fit mb-2">
                    {post.category}
                  </Badge>
                  <CardTitle className="line-clamp-2">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-3">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>

                  <Link href={`/blog/${post.id}`}>
                    <Button variant="ghost" className="p-0 h-auto text-blue-600 hover:text-blue-700">
                      Read More
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Newsletter CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 bg-blue-50 rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Subscribe to our newsletter and never miss our latest insights, product updates, and industry news.
          </p>
          <form onSubmit={handleNewsletterSubscribe} className="max-w-md mx-auto flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              className="flex-1"
              disabled={subscribing}
            />
            <Button type="submit" disabled={subscribing || !newsletterEmail}>
              {subscribing ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
          {subscribeMessage && (
            <p className={`mt-4 text-sm ${subscribeMessage.includes('Thank you') ? 'text-green-600' : 'text-red-600'}`}>
              {subscribeMessage}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
