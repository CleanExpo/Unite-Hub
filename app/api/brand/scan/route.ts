import { type NextRequest, NextResponse } from "next/server"
import { parse } from "node-html-parser"

export async function POST(request: NextRequest) {
  try {
    const { website } = await request.json()

    if (!website) {
      return NextResponse.json({ error: "Website URL is required" }, { status: 400 })
    }

    // Normalize the URL
    let websiteUrl = website
    if (!websiteUrl.startsWith("http")) {
      websiteUrl = `https://${websiteUrl}`
    }

    // Fetch the website content
    const response = await fetch(websiteUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website: ${response.statusText}` },
        { status: response.status },
      )
    }

    const html = await response.text()
    const root = parse(html)

    // Extract brand assets
    const brandAssets = {
      website: websiteUrl,
      title: extractTitle(root),
      description: extractDescription(root),
      logoUrl: extractLogo(root, websiteUrl),
      favicon: extractFavicon(root, websiteUrl),
      colors: extractColors(html),
      fonts: extractFonts(html),
      socials: extractSocialLinks(root),
      services: extractServices(root),
      locations: extractLocations(root),
    }

    return NextResponse.json(brandAssets)
  } catch (error) {
    console.error("Error scanning website:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to scan website" },
      { status: 500 },
    )
  }
}

// Helper functions for extraction

function extractTitle(root: any): string {
  // Try to get the site name from Open Graph tags first
  const ogSiteName = root.querySelector('meta[property="og:site_name"]')
  if (ogSiteName && ogSiteName.getAttribute("content")) {
    return ogSiteName.getAttribute("content")
  }

  // Then try the title tag
  const titleTag = root.querySelector("title")
  if (titleTag && titleTag.text) {
    return titleTag.text.trim()
  }

  // Fallback to h1
  const h1 = root.querySelector("h1")
  if (h1 && h1.text) {
    return h1.text.trim()
  }

  return "Unknown Site"
}

function extractDescription(root: any): string {
  // Try Open Graph description
  const ogDescription = root.querySelector('meta[property="og:description"]')
  if (ogDescription && ogDescription.getAttribute("content")) {
    return ogDescription.getAttribute("content")
  }

  // Then try meta description
  const metaDescription = root.querySelector('meta[name="description"]')
  if (metaDescription && metaDescription.getAttribute("content")) {
    return metaDescription.getAttribute("content")
  }

  return ""
}

function extractLogo(root: any, baseUrl: string): string {
  // Try structured data first
  const structuredData = root.querySelectorAll('script[type="application/ld+json"]')
  for (const script of structuredData) {
    try {
      const data = JSON.parse(script.text)
      if (data.logo) {
        return resolveUrl(data.logo, baseUrl)
      }
      if (data["@graph"]) {
        for (const item of data["@graph"]) {
          if (item.logo) {
            return resolveUrl(item.logo, baseUrl)
          }
        }
      }
    } catch (e) {
      // Continue if JSON parsing fails
    }
  }

  // Look for common logo patterns
  const logoSelectors = [
    'a[class*="logo"] img',
    'div[class*="logo"] img',
    "header img",
    ".logo img",
    "#logo img",
    'img[alt*="logo"]',
    'img[src*="logo"]',
  ]

  for (const selector of logoSelectors) {
    const logoImg = root.querySelector(selector)
    if (logoImg && logoImg.getAttribute("src")) {
      return resolveUrl(logoImg.getAttribute("src"), baseUrl)
    }
  }

  return ""
}

function extractFavicon(root: any, baseUrl: string): string {
  // Look for favicon link tags
  const faviconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]',
    'link[rel="apple-touch-icon-precomposed"]',
  ]

  for (const selector of faviconSelectors) {
    const favicon = root.querySelector(selector)
    if (favicon && favicon.getAttribute("href")) {
      return resolveUrl(favicon.getAttribute("href"), baseUrl)
    }
  }

  // Default favicon location
  return `${baseUrl}/favicon.ico`
}

function extractColors(html: string): { primaryColor: string; secondaryColor: string; accentColor: string } {
  const colorRegex =
    /#([0-9A-F]{3}){1,2}\b|rgb$$\s*\d+\s*,\s*\d+\s*,\s*\d+\s*$$|rgba$$\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[0-9.]+\s*$$/gi
  const colors = html.match(colorRegex) || []

  // Count color occurrences
  const colorCount: Record<string, number> = {}
  colors.forEach((color) => {
    const normalizedColor = color.toLowerCase()
    colorCount[normalizedColor] = (colorCount[normalizedColor] || 0) + 1
  })

  // Sort colors by frequency
  const sortedColors = Object.entries(colorCount)
    .sort((a, b) => b[1] - a[1])
    .map((entry) => entry[0])

  return {
    primaryColor: sortedColors[0] || "#000000",
    secondaryColor: sortedColors[1] || "#ffffff",
    accentColor: sortedColors[2] || "#0070f3",
  }
}

function extractFonts(html: string): string[] {
  const fontFamilyRegex = /font-family:\s*([^;}"']+)/gi
  const matches = html.match(fontFamilyRegex) || []

  const fonts = matches.map((match) => {
    return match.replace(/font-family:\s*/i, "").trim()
  })

  // Remove duplicates
  return [...new Set(fonts)].slice(0, 5)
}

function extractSocialLinks(root: any): Record<string, string> {
  const socialPlatforms = [
    { name: "facebook", patterns: ["facebook.com", "fb.com"] },
    { name: "twitter", patterns: ["twitter.com", "x.com"] },
    { name: "instagram", patterns: ["instagram.com"] },
    { name: "linkedin", patterns: ["linkedin.com"] },
    { name: "youtube", patterns: ["youtube.com", "youtu.be"] },
    { name: "pinterest", patterns: ["pinterest.com"] },
    { name: "tiktok", patterns: ["tiktok.com"] },
  ]

  const socials: Record<string, string> = {}

  // Find all links
  const links = root.querySelectorAll("a")
  for (const link of links) {
    const href = link.getAttribute("href")
    if (!href) continue

    for (const platform of socialPlatforms) {
      if (platform.patterns.some((pattern) => href.includes(pattern))) {
        socials[platform.name] = href
        break
      }
    }
  }

  return socials
}

function extractServices(root: any): string[] {
  // Look for common service indicators
  const serviceKeywords = ["services", "solutions", "products", "offerings", "what we do", "capabilities", "expertise"]

  const services = new Set<string>()

  // Look for sections that might contain services
  for (const keyword of serviceKeywords) {
    const headings = root.querySelectorAll(`h2, h3, h4`)
    for (const heading of headings) {
      const text = heading.text.toLowerCase()
      if (text.includes(keyword)) {
        // Get the parent section
        const parent = heading.parentNode
        if (parent) {
          // Look for list items or headings within this section
          const items = parent.querySelectorAll("li, h5, h6")
          for (const item of items) {
            const itemText = item.text.trim()
            if (itemText && itemText.length > 3 && itemText.length < 50) {
              services.add(itemText)
            }
          }
        }
      }
    }
  }

  return [...services].slice(0, 10)
}

function extractLocations(root: any): string[] {
  const locations = new Set<string>()

  // Look for address elements
  const addressElements = root.querySelectorAll("address")
  for (const address of addressElements) {
    locations.add(address.text.trim().replace(/\s+/g, " "))
  }

  // Look for location in structured data
  const structuredData = root.querySelectorAll('script[type="application/ld+json"]')
  for (const script of structuredData) {
    try {
      const data = JSON.parse(script.text)
      if (data.address) {
        const addressParts = []
        if (data.address.streetAddress) addressParts.push(data.address.streetAddress)
        if (data.address.addressLocality) addressParts.push(data.address.addressLocality)
        if (data.address.addressRegion) addressParts.push(data.address.addressRegion)
        if (data.address.postalCode) addressParts.push(data.address.postalCode)
        if (data.address.addressCountry) addressParts.push(data.address.addressCountry)

        if (addressParts.length > 0) {
          locations.add(addressParts.join(", "))
        }
      }
    } catch (e) {
      // Continue if JSON parsing fails
    }
  }

  // Look for footer contact info
  const footerSection = root.querySelector("footer")
  if (footerSection) {
    const paragraphs = footerSection.querySelectorAll("p")
    for (const p of paragraphs) {
      const text = p.text.trim()
      if (
        (text.includes("St") || text.includes("Street") || text.includes("Ave") || text.includes("Road")) &&
        text.length < 200
      ) {
        locations.add(text.replace(/\s+/g, " "))
      }
    }
  }

  return [...locations]
}

function resolveUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http")) {
    return url
  }

  if (url.startsWith("//")) {
    return `https:${url}`
  }

  if (url.startsWith("/")) {
    const urlObj = new URL(baseUrl)
    return `${urlObj.protocol}//${urlObj.host}${url}`
  }

  return `${baseUrl.replace(/\/$/, "")}/${url.replace(/^\//, "")}`
}
