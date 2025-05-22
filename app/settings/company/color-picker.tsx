"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"

interface ColorPickerProps {
  id: string
  value: string
  onChange: (value: string) => void
}

// Predefined color palette
const colorPalette = [
  // Blues
  "#0ea5e9",
  "#3b82f6",
  "#2563eb",
  "#1d4ed8",
  "#1e40af",
  // Greens
  "#10b981",
  "#059669",
  "#047857",
  "#065f46",
  "#064e3b",
  // Reds
  "#ef4444",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#7f1d1d",
  // Yellows/Oranges
  "#f59e0b",
  "#d97706",
  "#b45309",
  "#92400e",
  "#78350f",
  // Purples
  "#8b5cf6",
  "#7c3aed",
  "#6d28d9",
  "#5b21b6",
  "#4c1d95",
  // Pinks
  "#ec4899",
  "#db2777",
  "#be185d",
  "#9d174d",
  "#831843",
  // Grays
  "#6b7280",
  "#4b5563",
  "#374151",
  "#1f2937",
  "#111827",
  // Neutrals
  "#ffffff",
  "#f9fafb",
  "#f3f4f6",
  "#e5e7eb",
  "#000000",
]

export function ColorPicker({ id, value, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentColor, setCurrentColor] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setCurrentColor(value)
  }, [value])

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentColor(e.target.value)
  }

  const handleColorSelect = (color: string) => {
    setCurrentColor(color)
    onChange(color)
    setIsOpen(false)
  }

  const handleInputBlur = () => {
    onChange(currentColor)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onChange(currentColor)
      setIsOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-10 w-10 rounded-md border cursor-pointer"
        style={{ backgroundColor: currentColor }}
        onClick={() => setIsOpen(!isOpen)}
      />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-10 px-3">
            {currentColor}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md border" style={{ backgroundColor: currentColor }} />
              <Input
                ref={inputRef}
                id={id}
                value={currentColor}
                onChange={handleColorChange}
                onBlur={handleInputBlur}
                onKeyDown={handleInputKeyDown}
                className="h-8"
              />
            </div>

            <div className="grid grid-cols-5 gap-2">
              {colorPalette.map((color) => (
                <button
                  key={color}
                  className="h-6 w-6 rounded-md border relative flex items-center justify-center"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  type="button"
                >
                  {color === currentColor && <Check className="h-4 w-4 text-white drop-shadow-md" />}
                </button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
