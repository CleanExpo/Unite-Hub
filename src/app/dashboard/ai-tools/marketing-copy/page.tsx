"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, Check, Wand2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function MarketingCopyPage() {
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [section, setSection] = useState("hero");
  const [generatedCopy, setGeneratedCopy] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedField, setCopiedField] = useState("");

  const handleGenerate = async () => {
    if (!businessName.trim() || !description.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedCopy(null);

    try {
      const response = await fetch("/api/ai/generate-marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, description, section }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate copy");
      }

      const data = await response.json();
      setGeneratedCopy(data.copy);
    } catch (err: any) {
      setError(err.message || "Failed to generate marketing copy");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Breadcrumbs items={[{ label: "AI Tools", href: "/dashboard/ai-tools" }, { label: "Marketing Copy" }]} />

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
          <Wand2 className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">AI Marketing Copy Generator</h1>
          <p className="text-gray-600">Create compelling marketing copy with Claude AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Business Name *
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Unite-Hub"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Business Description *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your business does..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Section Type</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="hero">Hero Section</option>
              <option value="features">Features</option>
              <option value="benefits">Benefits</option>
              <option value="cta">Call to Action</option>
              <option value="about">About Us</option>
            </select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !businessName.trim() || !description.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Copy
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}
        </Card>

        {/* Output Section */}
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-lg">Generated Copy</h3>

          {generatedCopy ? (
            <div className="space-y-4">
              {/* Headline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Headline</label>
                  <Button
                    onClick={() => handleCopy(generatedCopy.headline, "headline")}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                  >
                    {copiedField === "headline" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-2xl font-bold text-gray-900">{generatedCopy.headline}</p>
              </div>

              {/* Subheadline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Subheadline</label>
                  <Button
                    onClick={() => handleCopy(generatedCopy.subheadline, "subheadline")}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                  >
                    {copiedField === "subheadline" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-lg text-gray-700">{generatedCopy.subheadline}</p>
              </div>

              {/* Body Copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Body Copy</label>
                  <Button
                    onClick={() => handleCopy(generatedCopy.bodyCopy, "bodyCopy")}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                  >
                    {copiedField === "bodyCopy" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-gray-600 leading-relaxed">{generatedCopy.bodyCopy}</p>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700">Call to Action</label>
                  <Button
                    onClick={() => handleCopy(generatedCopy.cta, "cta")}
                    variant="ghost"
                    size="sm"
                    className="h-8"
                  >
                    {copiedField === "cta" ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  {generatedCopy.cta}
                </Button>
              </div>

              <div className="text-xs text-gray-500 pt-4 border-t">
                Generated with Claude 3.5 Sonnet
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Your marketing copy will appear here</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Examples */}
      <Card className="p-6">
        <h3 className="font-semibold mb-3">Quick Examples:</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {[
            {
              name: "SaaS Product",
              description: "AI-powered CRM that helps businesses manage customer relationships",
            },
            {
              name: "E-commerce Store",
              description: "Online marketplace for handcrafted artisan products",
            },
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => {
                setBusinessName(example.name);
                setDescription(example.description);
              }}
              className="p-3 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="font-medium">{example.name}</div>
              <div className="text-gray-600 text-xs mt-1">{example.description}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
