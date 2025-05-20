"use client"

import { useState } from "react"
import type { Setting, SettingCategory } from "@/types/settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingField } from "./setting-field"
import type { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"

interface SettingsCategoryProps {
  category: SettingCategory
  settings: Setting[]
  onUpdate?: () => void
}

export function SettingsCategory({ category, settings, onUpdate }: SettingsCategoryProps) {
  const [expanded, setExpanded] = useState(true)

  // Dynamically get the icon component
  const IconComponent = category.icon ? (Icons[category.icon as keyof typeof Icons] as LucideIcon) : Icons.Settings

  return (
    <Card className="mb-6">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <IconComponent className="h-5 w-5 text-primary" />
            <CardTitle>{category.name}</CardTitle>
          </div>
          <div>{expanded ? <Icons.ChevronUp className="h-5 w-5" /> : <Icons.ChevronDown className="h-5 w-5" />}</div>
        </div>
        {category.description && <CardDescription>{category.description}</CardDescription>}
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="space-y-6">
            {settings.map((setting) => (
              <SettingField key={setting.id} setting={setting} onUpdate={onUpdate} />
            ))}

            {settings.length === 0 && (
              <p className="text-sm text-muted-foreground">No settings found in this category.</p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
