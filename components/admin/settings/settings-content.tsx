"use client"

import { useEffect, useState } from "react"
import { getAllSettings, getSettingCategories } from "@/lib/settings"
import type { Setting, SettingCategory } from "@/types/settings"
import { SettingsCategory } from "./settings-category"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function SettingsContent() {
  const [categories, setCategories] = useState<SettingCategory[]>([])
  const [settings, setSettings] = useState<Setting[]>([])
  const [activeTab, setActiveTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadSettings = async () => {
    setIsLoading(true)
    try {
      const allSettings = await getAllSettings()
      const allCategories = await getSettingCategories()

      setSettings(
        allSettings.map((s) => ({
          ...s,
          value: s.value,
        })),
      )
      setCategories(allCategories)
    } catch (error) {
      console.error("Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  // Filter settings based on search query and active tab
  const filteredSettings = settings.filter((setting) => {
    const matchesSearch =
      searchQuery === "" ||
      setting.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      setting.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (setting.description && setting.description.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTab = activeTab === "all" || setting.category_id === Number.parseInt(activeTab)

    return matchesSearch && matchesTab
  })

  // Group settings by category
  const settingsByCategory = categories.reduce<Record<number, Setting[]>>((acc, category) => {
    acc[category.id] = filteredSettings.filter((s) => s.category_id === category.id)
    return acc
  }, {})

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-[#001428] border-[#4ecdc4]/20 text-white"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList className="bg-[#001428] border border-[#4ecdc4]/20">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id.toString()}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4ecdc4] mx-auto"></div>
          <p className="mt-4 text-white">Loading settings...</p>
        </div>
      ) : (
        <div>
          {activeTab === "all" ? (
            categories.map((category) => (
              <SettingsCategory
                key={category.id}
                category={category}
                settings={settingsByCategory[category.id] || []}
                onUpdate={loadSettings}
              />
            ))
          ) : (
            <SettingsCategory
              category={categories.find((c) => c.id.toString() === activeTab)!}
              settings={filteredSettings}
              onUpdate={loadSettings}
            />
          )}

          {filteredSettings.length === 0 && (
            <div className="text-center py-12 bg-[#001428] border border-[#4ecdc4]/20 rounded-lg">
              <p className="text-white">No settings found matching your criteria.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
