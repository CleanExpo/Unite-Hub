"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Eye } from "lucide-react"
import type { GalleryTemplate } from "@/types/template-gallery"

interface TemplateCardProps {
  template: GalleryTemplate
  onPreview: () => void
}

export function TemplateCard({ template, onPreview }: TemplateCardProps) {
  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="relative">
        <img
          src={template.thumbnailUrl || "/placeholder.svg"}
          alt={template.name}
          className="w-full aspect-[4/3] object-cover"
        />
        {template.isPremium && (
          <Badge className="absolute top-2 right-2 bg-amber-500 hover:bg-amber-600">Premium</Badge>
        )}
      </div>

      <CardContent className="flex-grow pt-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{template.name}</h3>
          <div className="flex gap-1">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: template.primaryColor }}
              title="Primary Color"
            />
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: template.secondaryColor }}
              title="Secondary Color"
            />
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: template.accentColor }}
              title="Accent Color"
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{template.description}</p>

        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {template.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{template.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Button variant="outline" className="w-full" onClick={onPreview}>
          <Eye className="mr-2 h-4 w-4" />
          Preview
        </Button>
      </CardFooter>
    </Card>
  )
}
