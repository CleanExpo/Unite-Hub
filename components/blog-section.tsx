import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { BlogCard } from "@/components/blog-card"

// Sample blog posts data
const blogPosts = [
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
  },
]

export function BlogSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-[#001428] to-[#00253e]">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Latest Insights</h2>
            <p className="text-xl text-[#4ecdc4]/90 max-w-2xl">
              Expert advice, industry trends, and practical tips for property restoration and damage prevention.
            </p>
          </div>
          <Button asChild className="mt-4 md:mt-0 bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium">
            <Link href="/blog">
              View All Articles
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}
