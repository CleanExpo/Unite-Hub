import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { createClient } from "@/lib/supabase/server"

// Define common paper sizes
export const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
  LEGAL: { width: 215.9, height: 355.6 },
}

// Define default color schemes
export const COLOR_SCHEMES = {
  default: {
    primary: "#3b82f6", // Blue
    secondary: "#6b7280", // Gray
    text: "#1f2937", // Dark gray
    background: "#ffffff", // White
    accent: "#f59e0b", // Amber
  },
  dark: {
    primary: "#2563eb", // Darker blue
    secondary: "#4b5563", // Darker gray
    text: "#111827", // Nearly black
    background: "#f9fafb", // Light gray
    accent: "#d97706", // Darker amber
  },
  modern: {
    primary: "#0ea5e9", // Sky blue
    secondary: "#64748b", // Slate
    text: "#0f172a", // Slate dark
    background: "#ffffff", // White
    accent: "#ec4899", // Pink
  },
}

// Define default font styles (these will be overridden by custom sizes)
export const DEFAULT_FONT_STYLES = {
  heading1: { size: 24, style: "bold" },
  heading2: { size: 18, style: "bold" },
  heading3: { size: 14, style: "bold" },
  normal: { size: 12, style: "normal" },
  small: { size: 10, style: "normal" },
  footer: { size: 8, style: "normal" },
}

// Define default paragraph spacing
export const DEFAULT_PARAGRAPH_SPACING = {
  paragraphSpacing: 10, // mm
  headingBottomSpacing: 12, // mm
  headingTopSpacing: 18, // mm
  sectionSpacing: 25, // mm
  listItemSpacing: 5, // mm
  blockElementSpacing: 15, // mm
}

// Standard fonts available in PDFs
export const STANDARD_FONTS = {
  helvetica: {
    normal: "Helvetica",
    bold: "Helvetica-Bold",
    italic: "Helvetica-Oblique",
    bolditalic: "Helvetica-BoldOblique",
  },
  times: {
    normal: "Times-Roman",
    bold: "Times-Bold",
    italic: "Times-Italic",
    bolditalic: "Times-BoldItalic",
  },
  courier: {
    normal: "Courier",
    bold: "Courier-Bold",
    italic: "Courier-Oblique",
    bolditalic: "Courier-BoldOblique",
  },
  arial: {
    normal: "Helvetica", // Arial is mapped to Helvetica in PDFs
    bold: "Helvetica-Bold",
    italic: "Helvetica-Oblique",
    bolditalic: "Helvetica-BoldOblique",
  },
  georgia: {
    normal: "Times-Roman", // Georgia is mapped to Times in PDFs
    bold: "Times-Bold",
    italic: "Times-Italic",
    bolditalic: "Times-BoldItalic",
  },
}

// Fetch company settings from Supabase
export async function getCompanySettings() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase.from("company_settings").select("*").single()

    if (error) {
      console.error("Error fetching company settings:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error fetching company settings:", error)
    return null
  }
}

// Helper function to load a custom font
async function loadCustomFont(url: string, fontName: string) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch font: ${response.statusText}`)
    }

    const fontData = await response.arrayBuffer()
    return { fontData, fontName }
  } catch (error) {
    console.error("Error loading custom font:", error)
    return null
  }
}

// PDF Document class with enhanced styling
export class StyledPDF extends jsPDF {
  colorScheme: typeof COLOR_SCHEMES.default
  margins: { top: number; right: number; bottom: number; left: number }
  currentY: number
  pageWidth: number
  pageHeight: number
  footerText: string
  headerText: string
  headerLogo?: string
  companyName?: string
  showPageNumbers: boolean
  headingFont: string
  bodyFont: string
  customFontLoaded: boolean
  fontSizes: typeof DEFAULT_FONT_STYLES & { body: number }
  lineSpacing: {
    heading1: number
    heading2: number
    heading3: number
    body: number
    small: number
    footer: number
  }
  paragraphSpacing: {
    paragraphSpacing: number
    headingBottomSpacing: number
    headingTopSpacing: number
    sectionSpacing: number
    listItemSpacing: number
    blockElementSpacing: number
  }

  constructor(
    options: {
      orientation?: "portrait" | "landscape"
      unit?: "mm" | "cm" | "in" | "px" | "pt"
      format?: [number, number] | "a4" | "letter" | "legal"
      colorScheme?: keyof typeof COLOR_SCHEMES | "custom"
      customColors?: {
        primary?: string
        secondary?: string
        text?: string
        background?: string
        accent?: string
      }
      fontSettings?: {
        headingFont?: string
        bodyFont?: string
        useCustomFont?: boolean
        customFontName?: string
        customFontUrl?: string
        fontSizes?: {
          heading1: number
          heading2: number
          heading3: number
          body: number
          small: number
          footer: number
        }
        lineSpacing?: {
          heading1: number
          heading2: number
          heading3: number
          body: number
          small: number
          footer: number
        }
        paragraphSpacing?: {
          paragraphSpacing: number
          headingBottomSpacing: number
          headingTopSpacing: number
          sectionSpacing: number
          listItemSpacing: number
          blockElementSpacing: number
        }
      }
      margins?: { top?: number; right?: number; bottom?: number; left?: number }
      headerText?: string
      footerText?: string
      headerLogo?: string
      companyName?: string
      showPageNumbers?: boolean
    } = {},
  ) {
    super({
      orientation: options.orientation || "portrait",
      unit: options.unit || "mm",
      format: options.format || "a4",
    })

    // Set color scheme
    if (options.colorScheme === "custom" && options.customColors) {
      // Use custom colors
      this.colorScheme = {
        primary: options.customColors.primary || COLOR_SCHEMES.default.primary,
        secondary: options.customColors.secondary || COLOR_SCHEMES.default.secondary,
        text: options.customColors.text || COLOR_SCHEMES.default.text,
        background: options.customColors.background || COLOR_SCHEMES.default.background,
        accent: options.customColors.accent || COLOR_SCHEMES.default.accent,
      }
    } else {
      // Use predefined color scheme
      this.colorScheme = COLOR_SCHEMES[(options.colorScheme as keyof typeof COLOR_SCHEMES) || "default"]
    }

    this.margins = {
      top: options.margins?.top || 20,
      right: options.margins?.right || 20,
      bottom: options.margins?.bottom || 20,
      left: options.margins?.left || 20,
    }
    this.currentY = this.margins.top
    this.pageWidth = this.internal.pageSize.width
    this.pageHeight = this.internal.pageSize.height
    this.headerText = options.headerText || ""
    this.footerText = options.footerText || ""
    this.headerLogo = options.headerLogo
    this.companyName = options.companyName
    this.showPageNumbers = options.showPageNumbers !== false
    this.headingFont = options.fontSettings?.headingFont || "helvetica"
    this.bodyFont = options.fontSettings?.bodyFont || "helvetica"
    this.customFontLoaded = false

    // Set font sizes
    this.fontSizes = {
      heading1: { size: options.fontSettings?.fontSizes?.heading1 || 24, style: "bold" },
      heading2: { size: options.fontSettings?.fontSizes?.heading2 || 18, style: "bold" },
      heading3: { size: options.fontSettings?.fontSizes?.heading3 || 14, style: "bold" },
      normal: { size: options.fontSettings?.fontSizes?.body || 12, style: "normal" },
      small: { size: options.fontSettings?.fontSizes?.small || 10, style: "normal" },
      footer: { size: options.fontSettings?.fontSizes?.footer || 8, style: "normal" },
      body: options.fontSettings?.fontSizes?.body || 12,
    }

    // Set line spacing
    this.lineSpacing = {
      heading1: options.fontSettings?.lineSpacing?.heading1 || 1.2,
      heading2: options.fontSettings?.lineSpacing?.heading2 || 1.25,
      heading3: options.fontSettings?.lineSpacing?.heading3 || 1.3,
      body: options.fontSettings?.lineSpacing?.body || 1.5,
      small: options.fontSettings?.lineSpacing?.small || 1.4,
      footer: options.fontSettings?.lineSpacing?.footer || 1.3,
    }

    // Set paragraph spacing
    this.paragraphSpacing = {
      paragraphSpacing: options.fontSettings?.paragraphSpacing?.paragraphSpacing || 10,
      headingBottomSpacing: options.fontSettings?.paragraphSpacing?.headingBottomSpacing || 12,
      headingTopSpacing: options.fontSettings?.paragraphSpacing?.headingTopSpacing || 18,
      sectionSpacing: options.fontSettings?.paragraphSpacing?.sectionSpacing || 25,
      listItemSpacing: options.fontSettings?.paragraphSpacing?.listItemSpacing || 5,
      blockElementSpacing: options.fontSettings?.paragraphSpacing?.blockElementSpacing || 15,
    }

    // Set default font
    this.setFont(STANDARD_FONTS[this.bodyFont as keyof typeof STANDARD_FONTS]?.normal || "Helvetica")
    this.setTextColor(this.colorScheme.text)

    // Add first page header and footer
    if (this.headerText || this.headerLogo || this.companyName) {
      this.addHeader()
    }
    if (this.footerText || this.showPageNumbers) {
      this.addFooter(1)
    }
  }

  addHeader() {
    const originalY = this.currentY
    this.currentY = this.margins.top / 2

    // Add logo if provided
    if (this.headerLogo) {
      try {
        // Calculate logo dimensions to maintain aspect ratio
        // Logo height should be about 10mm
        const logoHeight = 10
        const logoWidth = 40 // Approximate width, will be adjusted based on aspect ratio

        this.addImage(this.headerLogo, "PNG", this.margins.left, this.currentY - 5, logoWidth, logoHeight)

        // Add company name if provided
        if (this.companyName) {
          this.setFontSize(DEFAULT_FONT_STYLES.heading3.size)
          this.setFont(STANDARD_FONTS[this.headingFont as keyof typeof STANDARD_FONTS]?.bold || "Helvetica-Bold")
          this.setTextColor(this.colorScheme.primary)
          this.text(this.companyName, this.margins.left + logoWidth + 5, this.currentY + 2)
        }

        // Add document title
        if (this.headerText) {
          this.setFontSize(DEFAULT_FONT_STYLES.normal.size)
          this.setFont(STANDARD_FONTS[this.bodyFont as keyof typeof STANDARD_FONTS]?.normal || "Helvetica")
          this.setTextColor(this.colorScheme.secondary)
          this.text(
            this.headerText,
            this.pageWidth - this.margins.right - this.getTextWidth(this.headerText),
            this.currentY + 2,
          )
        }
      } catch (error) {
        console.error("Error adding logo to PDF:", error)
        // Fallback to text-only header
        this.addTextHeader()
      }
    } else {
      // Text-only header
      this.addTextHeader()
    }

    // Add a divider line
    this.setDrawColor(this.colorScheme.primary)
    this.setLineWidth(0.5)
    this.line(this.margins.left, this.margins.top - 2, this.pageWidth - this.margins.right, this.margins.top - 2)

    this.currentY = originalY
  }

  addTextHeader() {
    if (this.companyName) {
      this.setFontSize(DEFAULT_FONT_STYLES.heading2.size)
      this.setFont(STANDARD_FONTS[this.headingFont as keyof typeof STANDARD_FONTS]?.bold || "Helvetica-Bold")
      this.setTextColor(this.colorScheme.primary)
      this.text(this.companyName, this.margins.left, this.currentY + 4)
    }

    if (this.headerText) {
      this.setFontSize(DEFAULT_FONT_STYLES.normal.size)
      this.setFont(STANDARD_FONTS[this.bodyFont as keyof typeof STANDARD_FONTS]?.normal || "Helvetica")
      this.setTextColor(this.colorScheme.secondary)
      this.text(
        this.headerText,
        this.pageWidth - this.margins.right - this.getTextWidth(this.headerText),
        this.currentY + 4,
      )
    }
  }

  addFooter(pageNumber: number) {
    // Add a divider line
    this.setDrawColor(this.colorScheme.secondary)
    this.setLineWidth(0.3)
    this.line(
      this.margins.left,
      this.pageHeight - this.margins.bottom + 5,
      this.pageWidth - this.margins.right,
      this.pageHeight - this.margins.bottom + 5,
    )

    // Add footer text
    this.setFontSize(this.fontSizes.footer.size)
    this.setFont(STANDARD_FONTS[this.bodyFont as keyof typeof STANDARD_FONTS]?.normal || "Helvetica")
    this.setTextColor(this.colorScheme.secondary)
    this.text(this.footerText, this.margins.left, this.pageHeight - this.margins.bottom + 10)

    // Add page number if enabled
    if (this.showPageNumbers) {
      const pageText = `Page ${pageNumber}`
      this.text(
        pageText,
        this.pageWidth - this.margins.right - this.getTextWidth(pageText),
        this.pageHeight - this.margins.bottom + 10,
      )
    }
  }

  addPage() {
    super.addPage()
    const pageCount = this.internal.getNumberOfPages()
    if (this.headerText || this.headerLogo || this.companyName) {
      this.addHeader()
    }
    if (this.footerText || this.showPageNumbers) {
      this.addFooter(pageCount)
    }
    this.currentY = this.margins.top
  }

  addHeading(text: string, level: 1 | 2 | 3 = 1, options: { isSection?: boolean } = {}) {
    const styleKey = level === 1 ? "heading1" : level === 2 ? "heading2" : "heading3"
    const style = this.fontSizes[styleKey]
    const lineHeight = this.lineSpacing[styleKey]

    // Calculate line height in points
    const lineHeightPt = style.size * lineHeight

    // Add spacing before heading based on level and whether it's a section
    if (options.isSection && level === 1) {
      this.currentY += this.paragraphSpacing.sectionSpacing
    } else if (options.isSection && level === 2) {
      this.currentY += this.paragraphSpacing.sectionSpacing * 0.8
    } else {
      this.currentY += this.paragraphSpacing.headingTopSpacing * (level === 1 ? 1 : 0.8)
    }

    // Check if we need a new page
    if (this.currentY + lineHeightPt > this.pageHeight - this.margins.bottom) {
      this.addPage()
    }

    this.setFontSize(style.size)
    this.setFont(STANDARD_FONTS[this.headingFont as keyof typeof STANDARD_FONTS]?.bold || "Helvetica-Bold")
    this.setTextColor(level === 1 ? this.colorScheme.primary : this.colorScheme.text)

    // Split text into lines for multi-line headings
    const maxWidth = this.pageWidth - this.margins.left - this.margins.right
    const lines = this.splitTextToSize(text, maxWidth)

    // Add each line with proper line spacing
    lines.forEach((line: string, index: number) => {
      this.text(line, this.margins.left, this.currentY)
      if (index < lines.length - 1) {
        this.currentY += lineHeightPt
      }
    })

    // Add spacing after heading
    this.currentY += this.paragraphSpacing.headingBottomSpacing

    // Add a small line under level 1 headings
    if (level === 1) {
      this.setDrawColor(this.colorScheme.primary)
      this.setLineWidth(0.5)
      this.line(this.margins.left, this.currentY - 5, this.margins.left + 50, this.currentY - 5)
      this.currentY += 5
    }

    return this
  }

  addParagraph(
    text: string,
    options: {
      fontSize?: number
      style?: string
      color?: string
      font?: string
      useSmallSize?: boolean
      addSpacingAfter?: boolean
    } = {},
  ) {
    const fontSize = options.fontSize || (options.useSmallSize ? this.fontSizes.small.size : this.fontSizes.normal.size)
    const style = options.style || this.fontSizes.normal.style
    const color = options.color || this.colorScheme.text
    const font = options.font || this.bodyFont
    const addSpacingAfter = options.addSpacingAfter !== false

    // Determine line spacing based on font size
    const lineSpacingKey = options.useSmallSize ? "small" : "body"
    const lineHeight = this.lineSpacing[lineSpacingKey]
    const lineHeightPt = fontSize * lineHeight

    this.setFontSize(fontSize)

    // Set font based on style
    if (style === "bold") {
      this.setFont(STANDARD_FONTS[font as keyof typeof STANDARD_FONTS]?.bold || "Helvetica-Bold")
    } else if (style === "italic") {
      this.setFont(STANDARD_FONTS[font as keyof typeof STANDARD_FONTS]?.italic || "Helvetica-Oblique")
    } else if (style === "bolditalic") {
      this.setFont(STANDARD_FONTS[font as keyof typeof STANDARD_FONTS]?.bolditalic || "Helvetica-BoldOblique")
    } else {
      this.setFont(STANDARD_FONTS[font as keyof typeof STANDARD_FONTS]?.normal || "Helvetica")
    }

    this.setTextColor(color)

    // Split text into lines that fit the page width
    const maxWidth = this.pageWidth - this.margins.left - this.margins.right
    const lines = this.splitTextToSize(text, maxWidth)

    // Check if we need a new page
    if (this.currentY + lines.length * lineHeightPt > this.pageHeight - this.margins.bottom) {
      this.addPage()
    }

    // Add each line with proper line spacing
    lines.forEach((line: string, index: number) => {
      this.text(line, this.margins.left, this.currentY)
      if (index < lines.length - 1) {
        this.currentY += lineHeightPt
      }
    })

    // Add paragraph spacing after the paragraph if specified
    if (addSpacingAfter) {
      this.currentY += this.paragraphSpacing.paragraphSpacing
    }

    return this
  }

  addList(
    items: string[],
    options: {
      fontSize?: number
      style?: string
      color?: string
      font?: string
      bulletChar?: string
      useSmallSize?: boolean
      addSpacingAfter?: boolean
    } = {},
  ) {
    const fontSize = options.fontSize || (options.useSmallSize ? this.fontSizes.small.size : this.fontSizes.normal.size)
    const style = options.style || this.fontSizes.normal.style
    const color = options.color || this.colorScheme.text
    const font = options.font || this.bodyFont
    const bulletChar = options.bulletChar || "•"
    const addSpacingAfter = options.addSpacingAfter !== false

    // Determine line spacing based on font size
    const lineSpacingKey = options.useSmallSize ? "small" : "body"
    const lineHeight = this.lineSpacing[lineSpacingKey]
    const lineHeightPt = fontSize * lineHeight

    this.setFontSize(fontSize)

    // Set font based on style
    if (style === "bold") {
      this.setFont(STANDARD_FONTS[font as keyof typeof STANDARD_FONTS]?.bold || "Helvetica-Bold")
    } else if (style === "italic") {
      this.setFont(STANDARD_FONTS[font as keyof typeof STANDARD_FONTS]?.italic || "Helvetica-Oblique")
    } else if (style === "bolditalic") {
      this.setFont(STANDARD_FONTS[font as keyof typeof STANDARD_FONTS]?.bolditalic || "Helvetica-BoldOblique")
    } else {
      this.setFont(STANDARD_FONTS[font as keyof typeof STANDARD_FONTS]?.normal || "Helvetica")
    }

    this.setTextColor(color)

    // Calculate bullet width and indent
    const bulletWidth = this.getTextWidth(bulletChar + " ")
    const indent = this.margins.left + bulletWidth
    const textWidth = this.pageWidth - indent - this.margins.right

    // Process each list item
    items.forEach((item, index) => {
      // Split text into lines that fit the page width
      const lines = this.splitTextToSize(item, textWidth)

      // Check if we need a new page
      if (this.currentY + lines.length * lineHeightPt > this.pageHeight - this.margins.bottom) {
        this.addPage()
      }

      // Add bullet point
      this.text(bulletChar, this.margins.left, this.currentY)

      // Add each line with proper line spacing
      lines.forEach((line: string, lineIndex: number) => {
        this.text(line, indent, this.currentY)
        if (lineIndex < lines.length - 1) {
          this.currentY += lineHeightPt
        }
      })

      // Add spacing between list items (except after the last item)
      if (index < items.length - 1) {
        this.currentY += this.paragraphSpacing.listItemSpacing
      }
    })

    // Add paragraph spacing after the list if specified
    if (addSpacingAfter) {
      this.currentY += this.paragraphSpacing.paragraphSpacing
    }

    return this
  }

  addBlockElement(
    content: string | (() => void),
    options: {
      backgroundColor?: string
      borderColor?: string
      padding?: number
      addSpacingBefore?: boolean
      addSpacingAfter?: boolean
    } = {},
  ) {
    const backgroundColor = options.backgroundColor || "#f9fafb"
    const borderColor = options.borderColor || "#e5e7eb"
    const padding = options.padding || 5
    const addSpacingBefore = options.addSpacingBefore !== false
    const addSpacingAfter = options.addSpacingAfter !== false

    // Add spacing before the block element
    if (addSpacingBefore) {
      this.currentY += this.paragraphSpacing.blockElementSpacing
    }

    // Save current position
    const startY = this.currentY

    // If content is a function, execute it to calculate height
    if (typeof content === "function") {
      // Create a clone of the current state to measure height
      const tempY = this.currentY
      content()
      const contentHeight = this.currentY - tempY
      this.currentY = tempY // Reset position

      // Check if we need a new page
      if (this.currentY + contentHeight + padding * 2 > this.pageHeight - this.margins.bottom) {
        this.addPage()
        const startY = this.currentY
      }

      // Draw background and border
      this.setFillColor(backgroundColor)
      this.setDrawColor(borderColor)
      this.roundedRect(
        this.margins.left - padding,
        startY - padding,
        this.pageWidth - this.margins.left - this.margins.right + padding * 2,
        contentHeight + padding * 2,
        2,
        2,
        "FD",
      )

      // Execute content function again to actually draw content
      content()
    } else {
      // For string content, calculate height based on text
      const fontSize = this.fontSizes.normal.size
      const lineHeight = this.lineSpacing.body
      const lineHeightPt = fontSize * lineHeight

      // Split text into lines that fit the page width
      const maxWidth = this.pageWidth - this.margins.left - this.margins.right - padding * 2
      const lines = this.splitTextToSize(content, maxWidth)
      const contentHeight = lines.length * lineHeightPt

      // Check if we need a new page
      if (this.currentY + contentHeight + padding * 2 > this.pageHeight - this.margins.bottom) {
        this.addPage()
      }

      // Draw background and border
      this.setFillColor(backgroundColor)
      this.setDrawColor(borderColor)
      this.roundedRect(
        this.margins.left - padding,
        this.currentY - padding,
        this.pageWidth - this.margins.left - this.margins.right + padding * 2,
        contentHeight + padding * 2,
        2,
        2,
        "FD",
      )

      // Add text content
      this.setFont(STANDARD_FONTS[this.bodyFont as keyof typeof STANDARD_FONTS]?.normal || "Helvetica")
      this.setFontSize(fontSize)
      this.setTextColor(this.colorScheme.text)

      // Add each line with proper line spacing
      lines.forEach((line: string, index: number) => {
        this.text(line, this.margins.left, this.currentY)
        if (index < lines.length - 1) {
          this.currentY += lineHeightPt
        }
      })

      this.currentY += padding
    }

    // Add spacing after the block element
    if (addSpacingAfter) {
      this.currentY += this.paragraphSpacing.blockElementSpacing
    }

    return this
  }

  addTable(
    data: any[],
    columns: string[],
    options: {
      headerColor?: string
      rowColors?: string[]
      fontSize?: number
      headerFontSize?: number
      addSpacingBefore?: boolean
      addSpacingAfter?: boolean
    } = {},
  ) {
    const addSpacingBefore = options.addSpacingBefore !== false
    const addSpacingAfter = options.addSpacingAfter !== false

    // Add spacing before the table
    if (addSpacingBefore) {
      this.currentY += this.paragraphSpacing.blockElementSpacing
    }

    // @ts-ignore - jspdf-autotable extends jsPDF prototype
    this.autoTable({
      head: [columns],
      body: data.map((item) => columns.map((col) => item[col] || "")),
      startY: this.currentY,
      margin: { left: this.margins.left, right: this.margins.right },
      headStyles: {
        fillColor: options.headerColor || this.colorScheme.primary,
        textColor: "#ffffff",
        fontSize: options.headerFontSize || this.fontSizes.normal.size,
        fontStyle: "bold",
        font: STANDARD_FONTS[this.headingFont as keyof typeof STANDARD_FONTS]?.normal || "Helvetica",
      },
      alternateRowStyles: {
        fillColor: "#f9fafb",
      },
      bodyStyles: {
        fontSize: options.fontSize || this.fontSizes.small.size,
        font: STANDARD_FONTS[this.bodyFont as keyof typeof STANDARD_FONTS]?.normal || "Helvetica",
      },
      didDrawPage: (data: any) => {
        // Add header and footer on new pages created by the table
        if (data.pageNumber > 1) {
          if (this.headerText || this.headerLogo || this.companyName) {
            this.addHeader()
          }
          if (this.footerText || this.showPageNumbers) {
            this.addFooter(data.pageNumber)
          }
        }
      },
    })

    // @ts-ignore - Update currentY based on where the table ended
    this.currentY = this.lastAutoTable.finalY

    // Add spacing after the table
    if (addSpacingAfter) {
      this.currentY += this.paragraphSpacing.blockElementSpacing
    }

    return this
  }

  addSpacer(height = 10) {
    this.currentY += height
    if (this.currentY > this.pageHeight - this.margins.bottom) {
      this.addPage()
    }
    return this
  }

  addHorizontalLine(options: { color?: string; width?: number } = {}) {
    const color = options.color || this.colorScheme.secondary
    const width = options.width || 0.3

    this.setDrawColor(color)
    this.setLineWidth(width)
    this.line(this.margins.left, this.currentY, this.pageWidth - this.margins.right, this.currentY)

    this.currentY += 5
    return this
  }

  addImage(url: string, x: number, y: number, width: number, height: number) {
    try {
      super.addImage(url, "JPEG", x, y, width, height)
    } catch (error) {
      console.error("Error adding image to PDF:", error)
      // Add a placeholder for the image
      this.setFillColor("#f3f4f6")
      this.rect(x, y
