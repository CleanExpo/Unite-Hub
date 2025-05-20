"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Facebook, Linkedin, Twitter, Youtube, ImageIcon, CalendarIcon, Clock, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface ScheduledPost {
  id: string
  content: string
  date: Date
  time: string
  platforms: string[]
  image?: string
  status: "scheduled" | "posted" | "failed"
}

export function SocialScheduler() {
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>("12:00")
  const [content, setContent] = useState<string>("")
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [image, setImage] = useState<string | null>(null)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([
    {
      id: "1",
      content:
        "Join our upcoming webinar on advanced water damage restoration techniques. Register now at unitegroup.com.au/webinars",
      date: new Date(2025, 4, 25),
      time: "14:00",
      platforms: ["facebook", "linkedin", "twitter"],
      status: "scheduled",
    },
    {
      id: "2",
      content: "New blog post: '5 Essential Steps for Effective Mold Remediation' - Read now on our website!",
      date: new Date(2025, 4, 28),
      time: "10:30",
      platforms: ["facebook", "linkedin"],
      image: "/blog/mold-prevention.png",
      status: "scheduled",
    },
    {
      id: "3",
      content: "Check out our latest video tutorial on fire damage assessment techniques.",
      date: new Date(2025, 4, 22),
      time: "09:00",
      platforms: ["youtube", "facebook"],
      image: "/course-fire-damage.png",
      status: "posted",
    },
  ])

  const handlePlatformToggle = (platform: string) => {
    if (selectedPlatforms.includes(platform)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== platform))
    } else {
      setSelectedPlatforms([...selectedPlatforms, platform])
    }
  }

  const handleImageUpload = () => {
    // Simulate image upload
    setImage("/social-media-post.png")
  }

  const handleRemoveImage = () => {
    setImage(null)
  }

  const handleSchedulePost = () => {
    if (!content || !date || selectedPlatforms.length === 0) return

    const newPost: ScheduledPost = {
      id: Date.now().toString(),
      content,
      date,
      time,
      platforms: selectedPlatforms,
      image: image || undefined,
      status: "scheduled",
    }

    setScheduledPosts([newPost, ...scheduledPosts])

    // Reset form
    setContent("")
    setDate(undefined)
    setTime("12:00")
    setSelectedPlatforms([])
    setImage(null)
  }

  const handleDeleteScheduledPost = (id: string) => {
    setScheduledPosts(scheduledPosts.filter((post) => post.id !== id))
  }

  const getPlatformIcon = (platform: string, size = 5) => {
    switch (platform) {
      case "facebook":
        return <Facebook className={`h-${size} w-${size} text-[#1877F2]`} />
      case "linkedin":
        return <Linkedin className={`h-${size} w-${size} text-[#0A66C2]`} />
      case "twitter":
        return <Twitter className={`h-${size} w-${size} text-[#1DA1F2]`} />
      case "youtube":
        return <Youtube className={`h-${size} w-${size} text-[#FF0000]`} />
      default:
        return null
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="bg-[#001428]/50">
          <CardHeader>
            <CardTitle>Create Post</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="What would you like to share?"
                className="min-h-32 bg-[#001428]"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />

              {image && (
                <div className="relative">
                  <img src={image || "/placeholder.svg"} alt="Post preview" className="w-full h-auto rounded-md" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={handleImageUpload}>
                  <ImageIcon className="h-4 w-4" />
                  Add Image
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className={cn("flex items-center gap-2", !date && "text-muted-foreground")}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {date ? format(date, "PPP") : "Schedule Date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-[#002a42]" align="start">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>

                <Select value={time} onValueChange={setTime}>
                  <SelectTrigger className="w-32">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <SelectValue placeholder="Time" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }).map((_, hour) => (
                      <SelectItem key={hour} value={`${hour.toString().padStart(2, "0")}:00`}>
                        {`${hour.toString().padStart(2, "0")}:00`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Platforms</Label>
                <div className="flex flex-wrap gap-3">
                  {["facebook", "twitter", "linkedin", "youtube"].map((platform) => (
                    <div key={platform} className="flex items-center space-x-2">
                      <Checkbox
                        id={platform}
                        checked={selectedPlatforms.includes(platform)}
                        onCheckedChange={() => handlePlatformToggle(platform)}
                      />
                      <Label htmlFor={platform} className="flex items-center gap-1 cursor-pointer">
                        {getPlatformIcon(platform, 4)}
                        <span className="capitalize">{platform}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Save Draft</Button>
            <Button
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
              onClick={handleSchedulePost}
              disabled={!content || !date || selectedPlatforms.length === 0}
            >
              Schedule Post
            </Button>
          </CardFooter>
        </Card>

        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Scheduled Posts</h3>
          <div className="space-y-4">
            {scheduledPosts.map((post) => (
              <Card key={post.id} className="bg-[#001428]/50">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full",
                          post.status === "scheduled"
                            ? "bg-yellow-500"
                            : post.status === "posted"
                              ? "bg-green-500"
                              : "bg-red-500",
                        )}
                      />
                      <span className="text-sm capitalize">{post.status}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <CalendarIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteScheduledPost(post.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="mb-3 line-clamp-3">{post.content}</p>

                  {post.image && (
                    <div className="mb-3">
                      <img
                        src={post.image || "/placeholder.svg"}
                        alt="Post image"
                        className="w-full h-32 object-cover rounded-md"
                      />
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 text-sm text-gray-400">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{format(post.date, "MMM d, yyyy")}</span>
                      <span>at {post.time}</span>
                    </div>
                    <div className="flex gap-1">
                      {post.platforms.map((platform) => (
                        <div key={platform}>{getPlatformIcon(platform, 4)}</div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div>
        <Card className="bg-[#001428]/50 sticky top-20">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Today's Schedule</h4>
              <div className="space-y-2">
                {scheduledPosts.filter((post) => post.date.toDateString() === new Date().toDateString()).length > 0 ? (
                  scheduledPosts
                    .filter((post) => post.date.toDateString() === new Date().toDateString())
                    .map((post) => (
                      <div key={post.id} className="flex items-center gap-2 p-2 bg-[#002a42] rounded-md">
                        <div className="flex gap-1">
                          {post.platforms.map((platform) => (
                            <div key={platform}>{getPlatformIcon(platform, 4)}</div>
                          ))}
                        </div>
                        <span className="text-sm truncate flex-1">{post.content.substring(0, 30)}...</span>
                        <span className="text-xs text-gray-400">{post.time}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-400">No posts scheduled for today</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Upcoming</h4>
              <div className="space-y-2">
                {scheduledPosts
                  .filter((post) => post.date > new Date() && post.date.toDateString() !== new Date().toDateString())
                  .slice(0, 3).length > 0 ? (
                  scheduledPosts
                    .filter((post) => post.date > new Date() && post.date.toDateString() !== new Date().toDateString())
                    .slice(0, 3)
                    .map((post) => (
                      <div key={post.id} className="flex items-center gap-2 p-2 bg-[#002a42] rounded-md">
                        <div className="flex gap-1">
                          {post.platforms.map((platform) => (
                            <div key={platform}>{getPlatformIcon(platform, 4)}</div>
                          ))}
                        </div>
                        <span className="text-sm truncate flex-1">{post.content.substring(0, 30)}...</span>
                        <span className="text-xs text-gray-400">{format(post.date, "MMM d")}</span>
                      </div>
                    ))
                ) : (
                  <p className="text-sm text-gray-400">No upcoming posts</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
