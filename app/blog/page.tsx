import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight, Calendar, Clock } from "lucide-react"
import { SocialShare } from "@/components/social-share"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "Blog | UNITE Group",
  description:
    "Explore our latest articles, insights, and industry news on property restoration, education, and technology.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/blog`,
    title: "Blog | UNITE Group",
    description:
      "Explore our latest articles, insights, and industry news on property restoration, education, and technology.",
    images: [
      {
        url: `${siteUrl}/og-blog.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group Blog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog | UNITE Group",
    description:
      "Explore our latest articles, insights, and industry news on property restoration, education, and technology.",
    images: [`${siteUrl}/og-blog.png`],
  },
}

// Sample blog posts data
const blogPosts = [
  {
    id: "water-damage-restoration-tips",
    title: "Essential Water Damage Restoration Tips for Property Owners",
    excerpt:
      "Learn the critical first steps to take after water damage occurs and how professional restoration can save your property.",
    coverImage: "/blog/water-damage-restoration.png",
    category: "Restoration",
    author: "Sarah Johnson",
    authorImage: "/team-member-1.png",
    date: "May 15, 2023",
    readTime: "8 min read",
    tags: ["Water Damage", "Property Restoration", "Flood Recovery", "Mould Prevention"],
  },
  {
    id: "mould-prevention-strategies",
    title: "Effective Mould Prevention Strategies for Humid Climates",
    excerpt:
      "Discover practical techniques to prevent mould growth in high-humidity environments and protect your property's value.",
    coverImage: "/blog/mould-prevention.png",
    category: "Prevention",
    author: "Michael Chen",
    authorImage: "/team-member-2.png",
    date: "April 28, 2023",
    readTime: "6 min read",
    tags: ["Mould Prevention", "Humidity Control", "Indoor Air Quality", "Property Maintenance"],
  },
  {
    id: "fire-damage-assessment",
    title: "Comprehensive Fire Damage Assessment Guide for Restoration Professionals",
    excerpt:
      "A detailed walkthrough of the fire damage assessment process to ensure thorough restoration and proper insurance claims.",
    coverImage: "/blog/fire-damage-assessment.png",
    category: "Assessment",
    author: "David Rodriguez",
    authorImage: "/team-member-3.png",
    date: "March 12, 2023",
    readTime: "10 min read",
    tags: ["Fire Damage", "Damage Assessment", "Insurance Claims", "Restoration Process"],
  },
  {
    id: "commercial-property-restoration",
    title: "Commercial Property Restoration: Minimising Business Downtime",
    excerpt:
      "Strategies for efficient commercial property restoration that prioritises business continuity and minimises financial impact.",
    coverImage: "/blog/commercial-restoration.png",
    category: "Commercial",
    author: "Jennifer Lee",
    authorImage: "/team-member-4.png",
    date: "February 5, 2023",
    readTime: "7 min read",
    tags: ["Commercial Restoration", "Business Continuity", "Disaster Recovery", "Property Management"],
  },
  {
    id: "insurance-claims-process",
    title: "Navigating the Insurance Claims Process for Water and Fire Damage",
    excerpt:
      "Expert advice on how to document damage, file claims, and work with insurance adjusters to ensure fair compensation.",
    coverImage: "/blog/insurance-claims.png",
    category: "Insurance",
    author: "Robert Thompson",
    authorImage: "/team-member-5.png",
    date: "January 18, 2023",
    readTime: "9 min read",
    tags: ["Insurance Claims", "Property Damage", "Claim Documentation", "Adjuster Negotiation"],
  },
  {
    id: "restoration-technology-trends",
    title: "Emerging Technologies in the Restoration Industry",
    excerpt:
      "Explore how cutting-edge technologies like thermal imaging, moisture mapping, and AI are transforming restoration processes.",
    coverImage: "/blog/restoration-technology.png",
    category: "Technology",
    author: "Michelle Wong",
    authorImage: "/team-member-6.png",
    date: "December 7, 2022",
    readTime: "8 min read",
    tags: ["Restoration Technology", "Thermal Imaging", "Moisture Mapping", "Industry Trends"],
  },
]

// Featured posts (first 3)
const featuredPosts = blogPosts.slice(0, 3)
// Regular posts (rest)
const regularPosts = blogPosts.slice(3)

export default function BlogPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">
                Restoration & Prevention Insights
              </h1>
              <p className="text-xl text-[#4ecdc4]/90 mb-8">
                Expert advice, industry trends, and practical tips for property restoration and damage prevention.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
                  Latest Articles
                </Button>
                <Button variant="outline" className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                  Subscribe to Newsletter
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg overflow-hidden border border-[#4ecdc4]/20 transition-transform hover:scale-[1.02]"
                >
                  <Link href={`/blog/${post.id}`} className="block">
                    <div className="relative h-48 w-full">
                      <Image
                        src={post.coverImage || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="inline-block bg-[#4ecdc4]/80 px-3 py-1 rounded-full text-[#001428] text-sm font-medium">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={post.authorImage || "/placeholder.svg"}
                          alt={post.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{post.author}</p>
                        <div className="flex items-center text-gray-400 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{post.date}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/blog/${post.id}`} className="block group">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#4ecdc4] transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-gray-300 mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-400 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{post.readTime}</span>
                      </div>
                      <SocialShare url={`/blog/${post.id}`} title={post.title} description={post.excerpt} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* All Posts */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-[#001428] to-[#00253e]">
          <div className="container px-4 md:px-6 mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-8">All Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularPosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg overflow-hidden border border-[#4ecdc4]/20 transition-transform hover:scale-[1.02]"
                >
                  <Link href={`/blog/${post.id}`} className="block">
                    <div className="relative h-48 w-full">
                      <Image
                        src={post.coverImage || "/placeholder.svg"}
                        alt={post.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="inline-block bg-[#4ecdc4]/80 px-3 py-1 rounded-full text-[#001428] text-sm font-medium">
                          {post.category}
                        </span>
                      </div>
                    </div>
                  </Link>
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden">
                        <Image
                          src={post.authorImage || "/placeholder.svg"}
                          alt={post.author}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{post.author}</p>
                        <div className="flex items-center text-gray-400 text-xs">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{post.date}</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/blog/${post.id}`} className="block group">
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#4ecdc4] transition-colors">
                        {post.title}
                      </h3>
                    </Link>
                    <p className="text-gray-300 mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center text-gray-400 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{post.readTime}</span>
                      </div>
                      <SocialShare url={`/blog/${post.id}`} title={post.title} description={post.excerpt} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20 bg-gradient-to-br from-[#002a42] to-[#00395d]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="bg-gradient-to-r from-[#4ecdc4]/20 to-[#4ecdc4]/10 rounded-lg p-8 md:p-12 border border-[#4ecdc4]/30">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Subscribe to Our Newsletter</h2>
                <p className="text-xl text-gray-300 mb-8">
                  Get the latest restoration tips, industry news, and exclusive content delivered to your inbox.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="px-4 py-3 rounded-md bg-[#001428] border border-[#4ecdc4]/30 text-white focus:outline-none focus:border-[#4ecdc4] flex-grow"
                    required
                  />
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium whitespace-nowrap">
                    Subscribe
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
