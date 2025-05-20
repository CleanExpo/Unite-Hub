// Get the site URL from environment variable
export const getSiteUrl = () => {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"
}

// Create absolute URL
export const createAbsoluteUrl = (path: string) => {
  const siteUrl = getSiteUrl()
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`
}

// Create Open Graph image URL
export const createOgImageUrl = (imagePath: string) => {
  return createAbsoluteUrl(imagePath.startsWith("/") ? imagePath : `/${imagePath}`)
}

// Create default Open Graph metadata
export const createDefaultOpenGraph = (title: string, description: string, imagePath: string, url: string) => {
  return {
    type: "website",
    url: createAbsoluteUrl(url),
    title,
    description,
    images: [
      {
        url: createOgImageUrl(imagePath),
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
  }
}

// Create default Twitter metadata
export const createDefaultTwitter = (title: string, description: string, imagePath: string) => {
  return {
    card: "summary_large_image",
    title,
    description,
    images: [createOgImageUrl(imagePath)],
  }
}
