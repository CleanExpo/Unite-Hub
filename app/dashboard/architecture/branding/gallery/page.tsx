"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Search, Filter, Star } from "lucide-react"
import Link from "next/link"

export default function TemplateGalleryPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")

  // Simplified template data for the fix
  const templates = [
    {
      id: "template-1",
      name: "Modern Blue",
      description: "A clean, professional template with blue accents",
      category: "professional",
      isPremium: false,
      isNew: true,
      previewUrl: "/blue-document-template.png",
    },
    {
      id: "template-2",
      name: "Corporate Gray",
      description: "Formal template for corporate documents",
      category: "corporate",
      isPremium: false,
      isNew: false,
      previewUrl: "/blue-document-template.png",
    },
    {
      id: "template-3",
      name: "Creative Purple",
      description: "Bold, creative template with purple accents",
      category: "creative",
      isPremium: true,
      isNew: true,
      previewUrl: "/blue-document-template.png",
    },
  ]

  const categories = [
    { id: "all", name: "All Templates" },
    { id: "professional", name: "Professional" },
    { id: "corporate", name: "Corporate" },
    { id: "creative", name: "Creative" },
  ]

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const handleImportTemplate = async (templateId: string) => {
    try {
      toast({
        title: "Template imported",
        description: "The template has been added to your collection.",
      })
    } catch (error) {
      toast({
        title: "Import failed",
        description: "There was an error importing the template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === "all" || template.category === activeCategory

    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Template Gallery</h1>
              <p className="text-muted-foreground">
                Browse and import professionally designed PDF templates for your architecture blueprints.
              </p>
            </div>
            <Link href="/dashboard/architecture/branding">
              <Button variant="outline">Back to Branding Settings</Button>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Premium</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="mb-4">
            {categories.map((category) => (
              <TabsTrigger key={category.id} value={category.id}>
                {category.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeCategory} className="mt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="aspect-[4/3] bg-muted animate-pulse" />
                    <CardHeader>
                      <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-full bg-muted animate-pulse rounded" />
                    </CardHeader>
                    <CardFooter>
                      <div className="h-10 w-full bg-muted animate-pulse rounded" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="overflow-hidden">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={template.previewUrl || "/placeholder.svg"}
                        alt={template.name}
                        className="object-cover w-full h-full transition-transform hover:scale-105"
                      />
                      <div className="absolute top-2 right-2 flex gap-1">
                        {template.isPremium && (
                          <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600">
                            Premium
                          </Badge>
                        )}
                        {template.isNew && (
                          <Badge variant="secondary" className="bg-green-500 text-white hover:bg-green-600">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardHeader>
                      <CardTitle>{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                      <Button
                        className="w-full flex items-center gap-2"
                        onClick={() => handleImportTemplate(template.id)}
                      >
                        <Download className="h-4 w-4" />
                        <span>Import Template</span>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            {!isLoading && filteredTemplates.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <h3 className="text-xl font-semibold">No templates found</h3>
                <p className="text-muted-foreground mt-2">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
