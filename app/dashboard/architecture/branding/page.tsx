"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { PdfBrandingForm } from "@/components/pdf-branding-form"
import type { PdfBrandingTemplate } from "@/types/pdf-branding"

// Sample template data
const sampleTemplates: PdfBrandingTemplate[] = [
  {
    id: "template-1",
    name: "Default Template",
    description: "The default PDF template",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    colors: {
      primary: "#3b82f6",
      secondary: "#6b7280",
      accent: "#10b981",
      background: "#ffffff",
      text: "#1f2937",
    },
    fonts: {
      heading: "Helvetica",
      body: "Helvetica",
    },
    logo: {
      url: "/logo.png",
      width: 100,
      height: 50,
      position: "left",
    },
    header: {
      enabled: true,
      text: "Architecture Blueprint",
      includePageNumber: true,
      includeLogo: false,
    },
    footer: {
      enabled: true,
      text: "© 2023 Company Name",
      includePageNumber: true,
      includeTimestamp: true,
    },
    cover: {
      enabled: true,
      title: "Architecture Blueprint",
      subtitle: "Project Details",
      backgroundUrl: "",
      includeLogo: true,
    },
    watermark: {
      enabled: false,
      text: "CONFIDENTIAL",
      opacity: 0.1,
    },
    companyInfo: {
      name: "Company Name",
      address: "123 Main St, City, State, ZIP",
      phone: "(123) 456-7890",
      email: "info@company.com",
      website: "www.company.com",
    },
    layout: "classic",
  },
  {
    id: "template-2",
    name: "Modern Blue",
    description: "A modern template with blue accents",
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    colors: {
      primary: "#2563eb",
      secondary: "#64748b",
      accent: "#06b6d4",
      background: "#ffffff",
      text: "#0f172a",
    },
    fonts: {
      heading: "Arial",
      body: "Arial",
    },
    logo: {
      url: "/logo.png",
      width: 100,
      height: 50,
      position: "center",
    },
    header: {
      enabled: true,
      text: "Architecture Blueprint",
      includePageNumber: true,
      includeLogo: true,
    },
    footer: {
      enabled: true,
      text: "© 2023 Company Name",
      includePageNumber: true,
      includeTimestamp: true,
    },
    cover: {
      enabled: true,
      title: "Architecture Blueprint",
      subtitle: "Project Details",
      backgroundUrl: "",
      includeLogo: true,
    },
    watermark: {
      enabled: false,
      text: "CONFIDENTIAL",
      opacity: 0.1,
    },
    companyInfo: {
      name: "Company Name",
      address: "123 Main St, City, State, ZIP",
      phone: "(123) 456-7890",
      email: "info@company.com",
      website: "www.company.com",
    },
    layout: "modern",
  },
]

export default function PdfBrandingPage() {
  const [templates, setTemplates] = useState<PdfBrandingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<PdfBrandingTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading templates from API
    const loadTemplates = async () => {
      try {
        // In a real app, you would fetch from an API
        setTemplates(sampleTemplates);
      } catch (error) {
        console.error("Error loading templates:", error);
        toast({
          title: "Error loading templates",
          description: "There was an error loading your templates. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplates();
  }, [toast]);

  const handleSaveTemplate = async (template: PdfBrandingTemplate) => {
    try {
      // In a real app, you would save to an API
      if (isEditing) {
        // Update existing template
        setTemplates(prev => 
          prev.map(t => t.id === template.id ? { ...template, updatedAt: new Date().toISOString() } : t)
        );
      } else {
        // Add new template
        const newTemplate = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setTemplates(prev => [...prev, newTemplate]);
      }
      
      setIsEditing(false);
      setSelectedTemplate(null);
      
      toast({
        title: "Template saved",
        description: "Your template has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Save failed",
        description: "There was an error saving your template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      // In a real app, you would delete from an API
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      
      toast({
        title: "Template deleted",
        description: "Your template has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting template:", error);
      toast({
        title: "Delete failed",
        description: "There was an error deleting your template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultTemplate = async (templateId: string) => {
    try {
      // In a real app, you would update in an API
      setTemplates(prev => 
        prev.map(t => ({
          ...t,
          isDefault: t.id === templateId,
          updatedAt: t.id === templateId ? new Date().toISOString() : t.updatedAt
        }))
      );
      
      toast({
        title: "Default template set",
        description: "Your default template has been updated successfully.",
      });
    } catch (error) {
      console.error("Error setting default template:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating your default template. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (selectedTemplate) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">
            {isEditing ? "Edit Template" : "New Template"}
          </h1>
          <Button variant="outline" onClick={() => {
            setSelectedTemplate(null);
            setIsEditing(false);
          }}>
            Cancel
          </Button>
        </div>
        
        <PdfBrandingForm
          template={selectedTemplate}
          onSave={handleSaveTemplate}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-\
