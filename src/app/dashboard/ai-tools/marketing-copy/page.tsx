"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Copy, Check, Wand2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { supabaseBrowser } from "@/lib/supabase";

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
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/ai/generate-marketing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
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
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "AI Tools", href: "/dashboard/ai-tools" }, { label: "Marketing Copy" }]} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
          <Wand2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
            AI Marketing Copy Generator
          </h1>
          <p className="text-slate-400 mt-1">Create compelling marketing copy with Claude AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Business Name *
            </label>
            <Input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g., Unite-Hub"
              className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Business Description *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your business does..."
              className="min-h-[100px] resize-none bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Section Type</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 text-white rounded-lg focus:ring-2 focus:ring-purple-500"
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
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50"
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
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </Card>

        {/* Output Section */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 p-6 space-y-4">
          <h3 className="font-semibold text-xl text-white">Generated Copy</h3>

          {generatedCopy ? (
            <div className="space-y-4">
              {/* Headline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Headline</label>
                  <Button
                    onClick={() => handleCopy(generatedCopy.headline, "headline")}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-slate-400 hover:text-white"
                  >
                    {copiedField === "headline" ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-2xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">{generatedCopy.headline}</p>
              </div>

              {/* Subheadline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Subheadline</label>
                  <Button
                    onClick={() => handleCopy(generatedCopy.subheadline, "subheadline")}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-slate-400 hover:text-white"
                  >
                    {copiedField === "subheadline" ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-lg text-slate-300">{generatedCopy.subheadline}</p>
              </div>

              {/* Body Copy */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Body Copy</label>
                  <Button
                    onClick={() => handleCopy(generatedCopy.bodyCopy, "bodyCopy")}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-slate-400 hover:text-white"
                  >
                    {copiedField === "bodyCopy" ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-slate-400 leading-relaxed">{generatedCopy.bodyCopy}</p>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">Call to Action</label>
                  <Button
                    onClick={() => handleCopy(generatedCopy.cta, "cta")}
                    variant="ghost"
                    size="sm"
                    className="h-8 text-slate-400 hover:text-white"
                  >
                    {copiedField === "cta" ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold shadow-lg shadow-purple-500/50">
                  {generatedCopy.cta}
                </Button>
              </div>

              <div className="text-xs text-slate-500 pt-4 border-t border-slate-700/50">
                Generated with Claude 3.5 Sonnet
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400">
              <div className="text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Your marketing copy will appear here</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Examples */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 p-6">
        <h3 className="font-semibold text-white mb-3">Quick Examples:</h3>
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
              className="p-3 text-left text-sm bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-all"
            >
              <div className="font-medium text-white">{example.name}</div>
              <div className="text-slate-400 text-xs mt-1">{example.description}</div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
