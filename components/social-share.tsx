"use client"

import { useState } from "react"
import { Facebook, Linkedin, Mail, Copy, Check, Twitter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "@/hooks/use-toast"

interface SocialShareProps {
  url: string
  title: string
  description?: string
  className?: string
  variant?: "default" | "outline" | "ghost" | "vertical"
}

export function SocialShare({ url, title, description = "", className, variant = "default" }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  // Ensure we have the full URL
  const fullUrl = url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_SITE_URL || "https://carsi.com.au"}${url}`

  // Encoded values for sharing
  const encodedUrl = encodeURIComponent(fullUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description)

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "bg-[#1877F2] hover:bg-[#1877F2]/90",
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "bg-[#1DA1F2] hover:bg-[#1DA1F2]/90",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
      color: "bg-[#0A66C2] hover:bg-[#0A66C2]/90",
    },
    {
      name: "Email",
      icon: Mail,
      url: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
      color: "bg-gray-600 hover:bg-gray-700",
    },
  ]

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast({
        title: "Link copied",
        description: "The link has been copied to your clipboard",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the link to your clipboard",
        variant: "destructive",
      })
    }
  }

  if (variant === "vertical") {
    return (
      <div className={cn("flex flex-col gap-2 fixed left-4 top-1/3 transform -translate-y-1/2", className)}>
        {shareLinks.map((link) => (
          <Button
            key={link.name}
            variant="outline"
            size="icon"
            className={cn("rounded-full border-2 border-[#4ecdc4]/20 text-[#4ecdc4] hover:bg-[#4ecdc4]/10", className)}
            onClick={() => window.open(link.url, "_blank")}
            aria-label={`Share on ${link.name}`}
          >
            <link.icon className="h-4 w-4" />
          </Button>
        ))}
        <Button
          variant="outline"
          size="icon"
          className={cn("rounded-full border-2 border-[#4ecdc4]/20 text-[#4ecdc4] hover:bg-[#4ecdc4]/10", className)}
          onClick={copyToClipboard}
          aria-label="Copy link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Share:</span>
      {shareLinks.map((link) => (
        <Button
          key={link.name}
          variant="outline"
          size="icon"
          className={cn("rounded-full border-2 border-[#4ecdc4]/20 text-[#4ecdc4] hover:bg-[#4ecdc4]/10", className)}
          onClick={() => window.open(link.url, "_blank")}
          aria-label={`Share on ${link.name}`}
        >
          <link.icon className="h-4 w-4" />
        </Button>
      ))}
      <Button
        variant="outline"
        size="icon"
        className={cn("rounded-full border-2 border-[#4ecdc4]/20 text-[#4ecdc4] hover:bg-[#4ecdc4]/10", className)}
        onClick={copyToClipboard}
        aria-label="Copy link"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  )
}
