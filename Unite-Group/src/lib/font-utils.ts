/**
 * Converts a font value to a display name
 * @param fontValue The font value (e.g., "helvetica")
 * @returns The display name (e.g., "Helvetica")
 */
export function getFontDisplayName(fontValue: string): string {
  const fontMap: Record<string, string> = {
    helvetica: "Helvetica",
    times: "Times New Roman",
    courier: "Courier",
    arial: "Arial",
    georgia: "Georgia",
  }

  return fontMap[fontValue] || fontValue.charAt(0).toUpperCase() + fontValue.slice(1)
}

/**
 * Gets a list of standard fonts available for PDF generation
 * @returns Array of font objects with name and value
 */
export function getStandardFonts() {
  return [
    { name: "Helvetica", value: "helvetica" },
    { name: "Times New Roman", value: "times" },
    { name: "Courier", value: "courier" },
    { name: "Arial", value: "arial" },
    { name: "Georgia", value: "georgia" },
  ]
}

/**
 * Font pairing categories
 */
export const fontPairingCategories = [
  { name: "All", value: null },
  { name: "Professional", value: "professional" },
  { name: "Modern", value: "modern" },
  { name: "Traditional", value: "traditional" },
  { name: "Creative", value: "creative" },
  { name: "Technical", value: "technical" },
]

/**
 * Font pairing descriptions
 */
export const fontPairingDescriptions: Record<string, string> = {
  professional: "Clean, corporate styles for business documents",
  modern: "Contemporary combinations for a fresh look",
  traditional: "Classic pairings with timeless appeal",
  creative: "Distinctive combinations for creative projects",
  technical: "Optimized for technical documentation and readability",
}
