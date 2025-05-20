// This is a script that would run at build time to generate Open Graph images
// It's not actually executed in the browser or server, but shows how you could generate images

import { createCanvas, loadImage } from "canvas"
import fs from "fs"
import path from "path"

// Configuration
const WIDTH = 1200
const HEIGHT = 630
const LOGO_SIZE = 200
const BACKGROUND_COLOR = "#001428"
const TEXT_COLOR = "#FFFFFF"
const ACCENT_COLOR = "#4ecdc4"

// Pages to generate OG images for
const pages = [
  { name: "home", title: "UNITE Group", subtitle: "United in vision. Independent in spirit." },
  { name: "services", title: "Our Services", subtitle: "Comprehensive solutions for your business" },
  { name: "about", title: "About Us", subtitle: "Learn about our mission and values" },
  { name: "education", title: "Education & Training", subtitle: "IICRC-approved continuing education" },
  { name: "contact", title: "Contact Us", subtitle: "Get in touch with our team" },
  { name: "blog", title: "Blog", subtitle: "Insights and industry news" },
]

async function generateOgImage(page: { name: string; title: string; subtitle: string }) {
  // Create canvas
  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext("2d")

  // Draw background
  ctx.fillStyle = BACKGROUND_COLOR
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Draw gradient overlay
  const gradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  gradient.addColorStop(0, "rgba(0, 20, 40, 1)")
  gradient.addColorStop(1, "rgba(0, 37, 62, 1)")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  // Load and draw logo
  try {
    const logo = await loadImage(path.join(process.cwd(), "public", "logo.png"))
    const logoX = (WIDTH - LOGO_SIZE) / 2
    const logoY = HEIGHT / 2 - LOGO_SIZE - 60
    ctx.drawImage(logo, logoX, logoY, LOGO_SIZE, LOGO_SIZE)
  } catch (error) {
    console.error("Error loading logo:", error)
  }

  // Draw title
  ctx.font = "bold 72px Inter"
  ctx.fillStyle = TEXT_COLOR
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(page.title, WIDTH / 2, HEIGHT / 2 + 20)

  // Draw subtitle
  ctx.font = "32px Inter"
  ctx.fillStyle = ACCENT_COLOR
  ctx.fillText(page.subtitle, WIDTH / 2, HEIGHT / 2 + 100)

  // Draw border
  ctx.strokeStyle = ACCENT_COLOR
  ctx.lineWidth = 10
  ctx.strokeRect(20, 20, WIDTH - 40, HEIGHT - 40)

  // Save image
  const buffer = canvas.toBuffer("image/png")
  fs.writeFileSync(path.join(process.cwd(), "public", `og-${page.name}.png`), buffer)
  console.log(`Generated OG image for ${page.name}`)
}

// Generate all OG images
async function generateAllOgImages() {
  for (const page of pages) {
    await generateOgImage(page)
  }
}

generateAllOgImages().catch(console.error)
