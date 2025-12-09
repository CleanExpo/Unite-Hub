"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  Copy,
  Download,
  Sparkles,
  FileText,
  Layout,
  Target,
  Megaphone,
  Loader2,
  CheckCircle
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  fields: {
    name: string;
    label: string;
    type: "text" | "textarea" | "select";
    placeholder: string;
    required: boolean;
    options?: string[];
  }[];
}

const templates: Template[] = [
  {
    id: "landing_page",
    name: "Landing Page",
    description: "High-conversion landing page structure with CONVEX methodology",
    category: "funnel",
    icon: Layout,
    fields: [
      { name: "product_name", label: "Product/Service Name", type: "text", placeholder: "Enter your product name", required: true },
      { name: "target_audience", label: "Target Audience", type: "text", placeholder: "Who is this for?", required: true },
      { name: "main_benefit", label: "Primary Benefit", type: "textarea", placeholder: "What's the main outcome?", required: true },
      { name: "pain_points", label: "Pain Points", type: "textarea", placeholder: "List 3-5 pain points", required: false },
      { name: "social_proof", label: "Social Proof", type: "textarea", placeholder: "Testimonials, stats, logos", required: false }
    ]
  },
  {
    id: "seo_plan",
    name: "SEO Plan",
    description: "Semantic cluster SEO domination framework",
    category: "seo",
    icon: Target,
    fields: [
      { name: "primary_keyword", label: "Primary Keyword", type: "text", placeholder: "Main keyword to target", required: true },
      { name: "industry", label: "Industry", type: "text", placeholder: "Your industry", required: true },
      { name: "competitors", label: "Main Competitors", type: "textarea", placeholder: "List 3-5 competitor domains", required: false },
      { name: "content_goals", label: "Content Goals", type: "textarea", placeholder: "What do you want to achieve?", required: false }
    ]
  },
  {
    id: "paid_ads",
    name: "Paid Ads",
    description: "Ad creative conversion template",
    category: "advertising",
    icon: Megaphone,
    fields: [
      { name: "offer", label: "Offer", type: "text", placeholder: "What are you promoting?", required: true },
      { name: "platform", label: "Platform", type: "select", placeholder: "Select platform", required: true, options: ["Google Ads", "Facebook/Instagram", "LinkedIn", "TikTok", "YouTube"] },
      { name: "budget", label: "Monthly Budget", type: "text", placeholder: "$X,XXX", required: false },
      { name: "audience_description", label: "Target Audience", type: "textarea", placeholder: "Describe your ideal customer", required: true }
    ]
  },
  {
    id: "offer_architecture",
    name: "Offer Architecture",
    description: "Value-maximizing offer blueprint",
    category: "strategy",
    icon: FileText,
    fields: [
      { name: "core_offer", label: "Core Offer", type: "text", placeholder: "Your main product/service", required: true },
      { name: "price_point", label: "Price Point", type: "text", placeholder: "$X,XXX", required: true },
      { name: "target_customer", label: "Ideal Customer", type: "textarea", placeholder: "Describe in detail", required: true },
      { name: "competitors_pricing", label: "Competitor Pricing", type: "textarea", placeholder: "What do competitors charge?", required: false },
      { name: "unique_mechanism", label: "Unique Mechanism", type: "textarea", placeholder: "What makes your solution different?", required: false }
    ]
  }
];

export default function ConvexExecutionPanel() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOutput, setGeneratedOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleFieldChange(fieldName: string, value: string) {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  }

  async function handleGenerate() {
    if (!selectedTemplate) {
return;
}

    setIsGenerating(true);
    setGeneratedOutput(null);

    try {
      const response = await fetch("/api/convex/generate-strategy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          inputs: formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedOutput(data.output);
      } else {
        // Demo output
        setGeneratedOutput(generateDemoOutput(selectedTemplate.id, formData));
      }
    } catch (error) {
      console.error("Generation failed:", error);
      setGeneratedOutput(generateDemoOutput(selectedTemplate.id, formData));
    } finally {
      setIsGenerating(false);
    }
  }

  function generateDemoOutput(templateId: string, inputs: Record<string, string>): string {
    const productName = inputs.product_name || inputs.core_offer || "Your Product";

    switch (templateId) {
      case "landing_page":
        return `# ${productName} Landing Page Structure

## Above the Fold
**Headline**: [Outcome-focused headline addressing ${inputs.target_audience || "target audience"}]
**Subheadline**: ${inputs.main_benefit || "Primary benefit statement"}
**CTA**: Get Started / Try Free / Book Demo

## Problem Section
- Pain point 1
- Pain point 2
- Pain point 3
${inputs.pain_points ? `\nFrom your input:\n${inputs.pain_points}` : ""}

## Solution Section
Introduce ${productName} as the bridge from problem to desired outcome.

## Social Proof
${inputs.social_proof || "Add testimonials, case studies, and trust badges"}

## Features → Benefits
Transform each feature into a customer outcome.

## FAQ Section
Address top 5 objections as questions.

## Final CTA
Repeat primary call-to-action with urgency element.`;

      case "seo_plan":
        return `# SEO Domination Plan: "${inputs.primary_keyword || "Target Keyword"}"

## Semantic Cluster Structure

### Pillar Content
- Comprehensive guide: "Ultimate Guide to ${inputs.primary_keyword}"
- Target: 3,000+ words
- Intent: Informational + Commercial

### Cluster Content (8-12 pieces)
1. [How-to guide 1]
2. [How-to guide 2]
3. [Comparison article]
4. [Case study]
5. [FAQ content]
6. [Tool/resource page]

## Authority Building
- Target 10 high-DA backlinks monthly
- Guest post opportunities in ${inputs.industry || "your industry"}
- HARO responses for media mentions

## Technical Priorities
1. Core Web Vitals optimization
2. Schema markup implementation
3. Internal linking optimization

## 90-Day Timeline
Month 1: Foundation content + technical fixes
Month 2: Cluster expansion + link building
Month 3: Optimization + authority signals`;

      default:
        return `# Generated ${selectedTemplate?.name || "Strategy"} Output

Based on your inputs:
${Object.entries(inputs).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

[Full CONVEX-optimized output would appear here]`;
    }
  }

  async function handleCopy() {
    if (generatedOutput) {
      await navigator.clipboard.writeText(generatedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight">Execution Templates</h2>
        <p className="text-muted-foreground">
          Generate high-conversion marketing assets using CONVEX methodology
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Select Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {templates.map((template) => {
              const Icon = template.icon;
              const isSelected = selectedTemplate?.id === template.id;

              return (
                <div
                  key={template.id}
                  onClick={() => {
                    setSelectedTemplate(template);
                    setFormData({});
                    setGeneratedOutput(null);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${isSelected ? "bg-primary text-white" : "bg-muted"}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Input Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedTemplate ? `Configure: ${selectedTemplate.name}` : "Select a Template"}
            </CardTitle>
            <CardDescription>
              Fill in the details to generate your CONVEX-optimized output
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedTemplate ? (
              <div className="space-y-4">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        rows={3}
                      />
                    ) : field.type === "select" ? (
                      <select
                        id={field.name}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">{field.placeholder}</option>
                        {field.options?.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id={field.name}
                        placeholder={field.placeholder}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                ))}

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with CONVEX
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a template to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Generated Output */}
      {generatedOutput && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Generated Output</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {generatedOutput}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
