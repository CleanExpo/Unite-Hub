"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface FontSelectorProps {
  id: string
  value: string
  onChange: (value: string) => void
  label?: string
  description?: string
}

// Standard fonts available in PDFs
const standardFonts = [
  { name: "Helvetica", value: "helvetica" },
  { name: "Times", value: "times" },
  { name: "Courier", value: "courier" },
  { name: "Arial", value: "arial" },
  { name: "Georgia", value: "georgia" },
]

export function FontSelector({ id, value, onChange, label, description }: FontSelectorProps) {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue placeholder="Select a font" />
        </SelectTrigger>
        <SelectContent>
          {standardFonts.map((font) => (
            <SelectItem key={font.value} value={font.value}>
              {font.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}
