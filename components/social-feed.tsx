"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Facebook, Linkedin, Youtube } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface SocialPost {
  id: string
  platform: "facebook" | "linkedin" | "youtube"
  content: string
  date: string
  link: string
}

export function SocialFeed() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching social media posts
    setTimeout(() => {
      setPosts([
        {
          id: "fb1",
          platform: "facebook",
          content: "Check out our latest course on water damage restoration techniques! Enrol now for IICRC credits.",
          date: "2 days ago",
          link: "https://www.facebook.com/CARSIaus/",
        },
        {
          id: "fb2",
          platform: "facebook",
          content: "Join us for our upcoming webinar on mould remediation best practices.",
          date: "1 week ago",
          link: "https://www.facebook.com/CARSIaus/",
        },
        {
          id: "li1",
          platform: "linkedin",
          content: "CARSI is proud to announce our new partnership with leading restoration equipment providers.",
          date: "3 days ago",
          link: "https://www.linkedin.com/company/carsiaus/",
        },
        {
          id: "li2",
          platform: "linkedin",
          content: "Our team is growing! We're looking for passionate educators to join our online training programme.",
          date: "5 days ago",
          link: "https://www.linkedin.com/company/carsiaus/",
        },
        {
          id: "yt1",
          platform: "youtube",
          content: "New video: Advanced techniques for fire damage assessment and restoration planning.",
          date: "1 day ago",
          link: "https://www.youtube.com/@carsi6767/videos",
        },
        {
          id: "yt2",
          platform: "youtube",
          content: "Tutorial: How to properly document water damage for insurance claims.",
          date: "2 weeks ago",
          link: "https://www.youtube.com/@carsi6767/videos",
        },
      ])
      setLoading(false)
    }, 1500)
  }, [])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-4 w-4 text-[#1877F2]" />
      case "linkedin":
        return <Linkedin className="h-4 w-4 text-[#0A66C2]" />
      case "youtube":
        return <Youtube className="h-4 w-4 text-[#FF0000]" />
      default:
        return null
    }
  }

  const filteredPosts = (platform: string) => {
    return posts.filter((post) => post.platform === platform)
  }

  return (
    <div className="w-full">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-4">
          <div className="grid gap-4">
            {loading
              ? Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))
              : posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {getPlatformIcon(post.platform)}
                        <span className="text-sm text-gray-500">{post.date}</span>
                      </div>
                      <p className="mb-2">{post.content}</p>
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4ecdc4] hover:underline"
                      >
                        View on {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
                      </a>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </TabsContent>
        <TabsContent value="facebook" className="mt-4">
          <div className="grid gap-4">
            {loading
              ? Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))
              : filteredPosts("facebook").map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Facebook className="h-4 w-4 text-[#1877F2]" />
                        <span className="text-sm text-gray-500">{post.date}</span>
                      </div>
                      <p className="mb-2">{post.content}</p>
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4ecdc4] hover:underline"
                      >
                        View on Facebook
                      </a>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </TabsContent>
        <TabsContent value="linkedin" className="mt-4">
          <div className="grid gap-4">
            {loading
              ? Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))
              : filteredPosts("linkedin").map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Linkedin className="h-4 w-4 text-[#0A66C2]" />
                        <span className="text-sm text-gray-500">{post.date}</span>
                      </div>
                      <p className="mb-2">{post.content}</p>
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4ecdc4] hover:underline"
                      >
                        View on LinkedIn
                      </a>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </TabsContent>
        <TabsContent value="youtube" className="mt-4">
          <div className="grid gap-4">
            {loading
              ? Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Skeleton className="h-4 w-4 rounded-full" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-16 w-full" />
                      </CardContent>
                    </Card>
                  ))
              : filteredPosts("youtube").map((post) => (
                  <Card key={post.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Youtube className="h-4 w-4 text-[#FF0000]" />
                        <span className="text-sm text-gray-500">{post.date}</span>
                      </div>
                      <p className="mb-2">{post.content}</p>
                      <a
                        href={post.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#4ecdc4] hover:underline"
                      >
                        View on YouTube
                      </a>
                    </CardContent>
                  </Card>
                ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
