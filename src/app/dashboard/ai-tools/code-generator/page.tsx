"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { supabaseBrowser } from "@/lib/supabase";

export default function CodeGeneratorPage() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [model, setModel] = useState("gpt-4o-mini");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedCode("");

    try {
      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/ai/generate-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt, model }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

      const data = await response.json();
      setGeneratedCode(data.code || "");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to generate code");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "AI Tools", href: "/dashboard/ai-tools" }, { label: "Code Generator" }]} />

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#FF00FF]/10 border border-[#FF00FF]/20 rounded-sm">
          <Code2 className="h-8 w-8 text-[#FF00FF]" />
        </div>
        <div>
          <h1 className="text-4xl font-bold font-mono text-white/90">
            AI Code Generator
          </h1>
          <p className="text-white/40 mt-1">Generate production-ready code with AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-mono font-medium text-white/50 mb-2">
              What do you want to build? *
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a TypeScript function to validate email addresses with regex"
              className="min-h-[200px] resize-none bg-[#050505] border-white/[0.06] text-white/90 placeholder:text-white/20"
            />
          </div>

          <div>
            <label className="block text-sm font-mono font-medium text-white/50 mb-2">AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-[#050505] border border-white/[0.06] text-white/90 rounded-sm focus:ring-2 focus:ring-[#00F5FF]/50 font-mono text-sm"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
              <option value="gpt-4o">GPT-4o (Best Quality)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo (Latest)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Code
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-[#FF4444]/10 border border-[#FF4444]/30 rounded-sm text-[#FF4444] text-sm font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-mono font-medium text-white/50">Generated Code</label>
            {generatedCode && (
              <button
                onClick={handleCopy}
                className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:border-white/[0.12] transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-[#00FF88]" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>

          <div className="relative">
            <pre className="bg-[#050505] text-white/70 p-4 rounded-sm overflow-x-auto min-h-[200px] max-h-[500px] overflow-y-auto border border-white/[0.06] font-mono text-sm">
              <code>{generatedCode || "Your generated code will appear here..."}</code>
            </pre>
          </div>

          {generatedCode && (
            <div className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              Generated with {model} • {generatedCode.length} characters
            </div>
          )}
        </div>
      </div>

      {/* Examples */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6">
        <h3 className="font-mono font-semibold text-white/90 mb-3">Try these examples:</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            "Create a React component for a login form with validation",
            "Write a TypeScript function to debounce API calls",
            "Build a Python script to parse CSV files",
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              className="p-3 text-left text-sm bg-[#050505] border border-white/[0.06] rounded-sm hover:border-white/[0.12] transition-colors text-white/50 hover:text-white/90 font-mono"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
