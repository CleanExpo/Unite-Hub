import Image from "next/image"
import Link from "next/link"
import { Calendar, Clock } from "lucide-react"
import { SocialShare } from "@/components/social-share"

interface BlogCardProps {
  post: {
    id: string
    title: string
    excerpt: string
    coverImage: string
    category: string
    author: string
    authorImage: string
    date: string
    readTime: string
    tags?: string[]
  }
  featured?: boolean
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg overflow-hidden border border-[#4ecdc4]/20 transition-transform hover:scale-[1.02]">
      <Link href={`/blog/${post.id}`} className="block">
        <div className="relative h-48 w-full">
          <Image src={post.coverImage || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
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
            <Image src={post.authorImage || "/placeholder.svg"} alt={post.author} fill className="object-cover" />
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
          <h3
            className={`${featured ? "text-xl" : "text-lg"} font-bold text-white mb-2 group-hover:text-[#4ecdc4] transition-colors`}
          >
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
  )
}
