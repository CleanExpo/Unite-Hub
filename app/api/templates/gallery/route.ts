import { NextResponse } from "next/server"
import { templateGalleryData } from "@/lib/template-gallery-data"

export async function GET() {
  // In a real app, you might fetch this from a database
  return NextResponse.json({ templates: templateGalleryData })
}
