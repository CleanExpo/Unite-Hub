"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Code2, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";

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
      const response = await fetch("/api/ai/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate code");
      }

      const data = await response.json();
      setGeneratedCode(data.code || "");
    } catch (err: any) {
      setError(err.message || "Failed to generate code");
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
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
          <Code2 className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            AI Code Generator
          </h1>
          <p className="text-slate-400 mt-1">Generate production-ready code with AI</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              What do you want to build? *
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: Create a TypeScript function to validate email addresses with regex"
              className="min-h-[200px] resize-none bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">AI Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700/50 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cheap)</option>
              <option value="gpt-4o">GPT-4o (Best Quality)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo (Latest)</option>
            </select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50"
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
          </Button>

          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </Card>

        {/* Output Section */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-300">Generated Code</label>
            {generatedCode && (
              <Button
                onClick={handleCopy}
                variant="ghost"
                size="sm"
                className="gap-2 text-slate-400 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto min-h-[200px] max-h-[500px] overflow-y-auto border border-slate-700/50">
              <code>{generatedCode || "Your generated code will appear here..."}</code>
            </pre>
          </div>

          {generatedCode && (
            <div className="text-xs text-slate-500">
              Generated with {model} • {generatedCode.length} characters
            </div>
          )}
        </Card>
      </div>

      {/* Examples */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 p-6">
        <h3 className="font-semibold text-white mb-3">Try these examples:</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {[
            "Create a React component for a login form with validation",
            "Write a TypeScript function to debounce API calls",
            "Build a Python script to parse CSV files",
          ].map((example, i) => (
            <button
              key={i}
              onClick={() => setPrompt(example)}
              className="p-3 text-left text-sm bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-all text-slate-300 hover:text-white"
            >
              {example}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
