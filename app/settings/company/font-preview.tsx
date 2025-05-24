import type React from "react"
import { getFontDisplayName } from "@/lib/font-utils"

interface FontPreviewProps {
  headingFont: string
  bodyFont: string
}

const FontPreview: React.FC<FontPreviewProps> = ({ headingFont, bodyFont }) => {
  const headingStyle = {
    fontFamily: getFontDisplayName(headingFont),
  }

  const bodyStyle = {
    fontFamily: getFontDisplayName(bodyFont),
  }

  return (
    <div className="border rounded p-4">
      <h2 className="text-xl font-bold mb-2" style={headingStyle}>
        Heading in {getFontDisplayName(headingFont)}
      </h2>
      <p style={bodyStyle}>
        This paragraph uses {getFontDisplayName(bodyFont)} as the body font. The quick brown fox jumps over the lazy
        dog.
      </p>
    </div>
  )
}

export default FontPreview
