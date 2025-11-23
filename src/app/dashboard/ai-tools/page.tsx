"use client";

import React from "react";
import { Sparkles, FileText, Code, Image, Mic, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AIToolsPage() {
  const tools = [
    {
      name: "Marketing Copy",
      description: "Generate compelling marketing copy with AI",
      icon: FileText,
      href: "/dashboard/ai-tools/marketing-copy",
      status: "Active",
    },
    {
      name: "Code Generator",
      description: "Generate code snippets and scripts",
      icon: Code,
      href: "/dashboard/ai-tools/code-generator",
      status: "Active",
    },
    {
      name: "Image Generation",
      description: "Create AI-generated images for campaigns",
      icon: Image,
      href: "/dashboard/ai-tools/images",
      status: "Coming Soon",
    },
    {
      name: "Voice Synthesis",
      description: "Generate voice content for videos and ads",
      icon: Mic,
      href: "/dashboard/ai-tools/voice",
      status: "Coming Soon",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Tools
        </h1>
        <p className="text-muted-foreground">Powerful AI-powered tools for content creation</p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <Card key={tool.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{tool.name}</CardTitle>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  tool.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {tool.status}
                </span>
              </div>
              <CardDescription>
                {tool.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                asChild
                disabled={tool.status !== "Active"}
              >
                <Link href={tool.href}>
                  Open Tool <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
