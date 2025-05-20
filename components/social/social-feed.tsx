"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Facebook, Linkedin, Youtube, Twitter, MessageSquare, ThumbsUp, Share2, MoreHorizontal } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SocialPost {
  id: string
  platform: "facebook" | "linkedin" | "twitter" | "youtube"
  content: string
  date: string
  link: string
  author: {
    name: string
    avatar: string
    handle?: string
  }
  stats: {
    likes: number
    comments: number
    shares: number
  }
  image?: string
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
          author: {
            name: "UNITE Group",
            avatar: "/logo.png",
          },
          stats: {
            likes: 24,
            comments: 5,
            shares: 3,
          },
          image: "/education-service.png",
        },
        {
          id: "tw1",
          platform: "twitter",
          content:
            "We're excited to announce our new partnership with leading restoration equipment providers! #restoration #training",
          date: "1 day ago",
          link: "https://twitter.com/",
          author: {
            name: "UNITE Group",
            avatar: "/logo.png",
            handle: "@unitegroup",
          },
          stats: {
            likes: 18,
            comments: 3,
            shares: 7,
          },
        },
        {
          id: "li1",
          platform: "linkedin",
          content:
            "UNITE Group is proud to announce our new partnership with leading restoration equipment providers. This collaboration will enhance our training programs with the latest industry technology.",
          date: "3 days ago",
          link: "https://www.linkedin.com/company/carsiaus/",
          author: {
            name: "UNITE Group",
            avatar: "/logo.png",
          },
          stats: {
            likes: 32,
            comments: 8,
            shares: 5,
          },
        },
        {
          id: "yt1",
          platform: "youtube",
          content: "New video: Advanced techniques for fire damage assessment and restoration planning.",
          date: "1 week ago",
          link: "https://www.youtube.com/@carsi6767/videos",
          author: {
            name: "UNITE Group",
            avatar: "/logo.png",
          },
          stats: {
            likes: 45,
            comments: 12,
            shares: 8,
          },
          image: "/course-fire-damage.png",
        },
      ])
      setLoading(false)
    }, 1500)
  }, [])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5 text-[#1877F2]" />
      case "linkedin":
        return <Linkedin className="h-5 w-5 text-[#0A66C2]" />
      case "twitter":
        return <Twitter className="h-5 w-5 text-[#1DA1F2]" />
      case "youtube":
        return <Youtube className="h-5 w-5 text-[#FF0000]" />
      default:
        return null
    }
  }

  const filteredPosts = (platform: string) => {
    return posts.filter((post) => post.platform === platform)
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recent Posts</h2>
        <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">Refresh Feed</Button>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="bg-[#001428]/50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-5 w-5 ml-auto rounded-full" />
                      </div>
                      <Skeleton className="h-20 w-full mb-4" />
                      <Skeleton className="h-40 w-full mb-4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
            : posts.map((post) => (
                <Card key={post.id} className="bg-[#001428]/50 overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{post.author.name}</p>
                        <p className="text-sm text-gray-400 flex items-center gap-1">
                          {post.author.handle && <span>{post.author.handle}</span>}
                          <span>• {post.date}</span>
                        </p>
                      </div>
                      <div className="ml-auto">{getPlatformIcon(post.platform)}</div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Original</DropdownMenuItem>
                          <DropdownMenuItem>Hide Post</DropdownMenuItem>
                          <DropdownMenuItem>Report</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <p className="mb-4">{post.content}</p>

                    {post.image && (
                      <div className="relative mb-4 rounded-md overflow-hidden">
                        <img
                          src={post.image || "/placeholder.svg"}
                          alt="Post image"
                          className="w-full h-auto object-cover rounded-md"
                        />
                      </div>
                    )}

                    <div className="flex justify-between text-sm text-gray-400 py-2 border-t border-b border-gray-700">
                      <span>{post.stats.likes} likes</span>
                      <span>{post.stats.comments} comments</span>
                      <span>{post.stats.shares} shares</span>
                    </div>
                  </CardContent>

                  <CardFooter className="flex justify-between p-2">
                    <Button variant="ghost" size="sm" className="flex-1">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comment
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </CardFooter>
                </Card>
              ))}
        </TabsContent>

        {["facebook", "twitter", "linkedin", "youtube"].map((platform) => (
          <TabsContent key={platform} value={platform} className="space-y-4">
            {loading
              ? Array(2)
                  .fill(0)
                  .map((_, i) => (
                    <Card key={i} className="bg-[#001428]/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                          <Skeleton className="h-5 w-5 ml-auto rounded-full" />
                        </div>
                        <Skeleton className="h-20 w-full mb-4" />
                        <Skeleton className="h-40 w-full mb-4" />
                        <div className="flex justify-between">
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </CardContent>
                    </Card>
                  ))
              : filteredPosts(platform).map((post) => (
                  <Card key={post.id} className="bg-[#001428]/50 overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarImage src={post.author.avatar || "/placeholder.svg"} alt={post.author.name} />
                          <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{post.author.name}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            {post.author.handle && <span>{post.author.handle}</span>}
                            <span>• {post.date}</span>
                          </p>
                        </div>
                        <div className="ml-auto">{getPlatformIcon(post.platform)}</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Original</DropdownMenuItem>
                            <DropdownMenuItem>Hide Post</DropdownMenuItem>
                            <DropdownMenuItem>Report</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className="mb-4">{post.content}</p>

                      {post.image && (
                        <div className="relative mb-4 rounded-md overflow-hidden">
                          <img
                            src={post.image || "/placeholder.svg"}
                            alt="Post image"
                            className="w-full h-auto object-cover rounded-md"
                          />
                        </div>
                      )}

                      <div className="flex justify-between text-sm text-gray-400 py-2 border-t border-b border-gray-700">
                        <span>{post.stats.likes} likes</span>
                        <span>{post.stats.comments} comments</span>
                        <span>{post.stats.shares} shares</span>
                      </div>
                    </CardContent>

                    <CardFooter className="flex justify-between p-2">
                      <Button variant="ghost" size="sm" className="flex-1">
                        <ThumbsUp className="h-4 w-4 mr-2" />
                        Like
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Comment
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
