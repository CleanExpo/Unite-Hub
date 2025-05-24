"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { getFontDisplayName, fontPairingCategories } from "@/lib/font-utils"

interface FontPairing {
  primary: string
  secondary: string
  category: string
}

const fontPairingRecommendations: FontPairing[] = [
  {
    primary: "Open Sans",
    secondary: "Roboto",
    category: "modern",
  },
  {
    primary: "Lato",
    secondary: "Montserrat",
    category: "classic",
  },
  {
    primary: "Roboto",
    secondary: "Open Sans",
    category: "modern",
  },
  {
    primary: "Montserrat",
    secondary: "Lato",
    category: "classic",
  },
  {
    primary: "Slabo",
    secondary: "Roboto",
    category: "serif",
  },
  {
    primary: "Lora",
    secondary: "Open Sans",
    category: "serif",
  },
]

// Component definition
const FontPairingRecommendations = () => {
  const [filter, setFilter] = useState<string>("all")

  const filteredFontPairings =
    filter === "all"
      ? fontPairingRecommendations
      : fontPairingRecommendations.filter((pairing) => pairing.category === filter)

  return (
    <Card className="col-span-2 lg:col-span-1">
      <CardHeader>
        <CardTitle>Font Pairing Recommendations</CardTitle>
        <CardDescription>Explore curated font pairings to elevate your brand's typography.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {fontPairingCategories.map((category) => (
              <Button
                key={category.name}
                variant={filter === category.value ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(category.value || "all")}
                className="text-xs"
              >
                {category.name}
              </Button>
            ))}
          </div>
          <div className="grid gap-2">
            {filteredFontPairings.map((pairing, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-1/2">
                  <Label htmlFor={`primary-${index}`}>Primary Font</Label>
                  <Input type="text" id={`primary-${index}`} value={getFontDisplayName(pairing.primary)} readOnly />
                </div>
                <div className="w-1/2">
                  <Label htmlFor={`secondary-${index}`}>Secondary Font</Label>
                  <Input type="text" id={`secondary-${index}`} value={getFontDisplayName(pairing.secondary)} readOnly />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Add the missing named export
export { FontPairingRecommendations }

// Keep the default export
export default FontPairingRecommendations
