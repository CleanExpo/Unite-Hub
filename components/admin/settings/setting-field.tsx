"use client"

import { useState } from "react"
import type { Setting } from "@/types/settings"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { updateSettingAction } from "@/app/actions/settings"
import { useToast } from "@/hooks/use-toast"

interface SettingFieldProps {
  setting: Setting
  onUpdate?: () => void
}

export function SettingField({ setting, onUpdate }: SettingFieldProps) {
  const [value, setValue] = useState<any>(
    setting.type === "boolean" ? setting.value === true || setting.value === "true" : setting.value,
  )
  const [originalValue] = useState(value)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const hasChanged = JSON.stringify(value) !== JSON.stringify(originalValue)

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const result = await updateSettingAction(setting.key, value)

      if (result.success) {
        toast({
          title: "Setting updated",
          description: `${setting.label} has been updated successfully.`,
        })
        if (onUpdate) onUpdate()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while updating the setting.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderField = () => {
    switch (setting.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={`setting-${setting.key}`}
              checked={value === true}
              onCheckedChange={(checked) => setValue(checked)}
              disabled={isLoading}
            />
            <Label htmlFor={`setting-${setting.key}`}>{value ? "Enabled" : "Disabled"}</Label>
          </div>
        )

      case "number":
        return (
          <Input
            id={`setting-${setting.key}`}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
          />
        )

      case "color":
        return (
          <div className="flex items-center space-x-2">
            <Input
              id={`setting-${setting.key}`}
              type="color"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-12 h-8 p-1"
              disabled={isLoading}
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
          </div>
        )

      case "image":
        return (
          <div className="space-y-2">
            <Input
              id={`setting-${setting.key}`}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={isLoading}
              placeholder="Image URL"
            />
            {value && (
              <div className="mt-2 border rounded p-2 bg-muted/20">
                <img
                  src={value || "/placeholder.svg"}
                  alt={setting.label}
                  className="max-h-24 object-contain mx-auto"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/abstract-geometric-shapes.png"
                  }}
                />
              </div>
            )}
          </div>
        )

      case "select":
        const options = setting.options || []
        return (
          <select
            id={`setting-${setting.key}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isLoading}
          >
            {Array.isArray(options) &&
              options.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
          </select>
        )

      case "json":
        return (
          <Textarea
            id={`setting-${setting.key}`}
            value={typeof value === "object" ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                setValue(JSON.parse(e.target.value))
              } catch {
                setValue(e.target.value)
              }
            }}
            rows={5}
            disabled={isLoading}
            className="font-mono text-sm"
          />
        )

      default:
        return (
          <Input
            id={`setting-${setting.key}`}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={isLoading}
          />
        )
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <Label htmlFor={`setting-${setting.key}`} className="text-sm font-medium">
            {setting.label}
          </Label>
          {setting.description && <p className="text-xs text-muted-foreground mt-1">{setting.description}</p>}
        </div>
        {hasChanged && (
          <Button size="sm" onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Save
          </Button>
        )}
      </div>
      <div className="mt-1">{renderField()}</div>
    </div>
  )
}
