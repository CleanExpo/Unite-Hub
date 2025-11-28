"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle,
  Info,
  RefreshCw,
  Download
} from "lucide-react";

interface SEOScore {
  category: string;
  score: number;
  maxScore: number;
  trend: "up" | "down" | "stable";
  details: {
    factor: string;
    score: number;
    maxScore: number;
    status: "good" | "warning" | "critical";
    recommendation?: string;
  }[];
}

interface ConvexSEOScoringOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  targetUrl?: string;
}

export default function ConvexSEOScoringOverlay({
  isOpen,
  onClose,
  targetUrl
}: ConvexSEOScoringOverlayProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scores, setScores] = useState<SEOScore[]>([]);
  const [overallScore, setOverallScore] = useState(0);

  useEffect(() => {
    if (isOpen && targetUrl) {
      runSEOAnalysis();
    }
  }, [isOpen, targetUrl]);

  async function runSEOAnalysis() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/convex/score-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl })
      });

      if (response.ok) {
        const data = await response.json();
        setScores(data.scores || []);
        setOverallScore(data.overallScore || 0);
      }
    } catch (error) {
      console.error("SEO analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  const getTrendIcon = (trend: SEOScore["trend"]) => {
    switch (trend) {
      case "up": return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down": return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: "good" | "warning" | "critical") => {
    switch (status) {
      case "good": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning": return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "critical": return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (!isOpen) return null;

  // Default scores for demo
  const defaultScores: SEOScore[] = [
    {
      category: "Technical SEO",
      score: 85,
      maxScore: 100,
      trend: "up",
      details: [
        { factor: "Page Speed", score: 90, maxScore: 100, status: "good" },
        { factor: "Mobile Friendly", score: 95, maxScore: 100, status: "good" },
        { factor: "Crawlability", score: 80, maxScore: 100, status: "good" },
        { factor: "Schema Markup", score: 75, maxScore: 100, status: "warning", recommendation: "Add FAQ schema for featured snippets" }
      ]
    },
    {
      category: "Content Quality",
      score: 72,
      maxScore: 100,
      trend: "stable",
      details: [
        { factor: "Keyword Relevance", score: 85, maxScore: 100, status: "good" },
        { factor: "Content Depth", score: 65, maxScore: 100, status: "warning", recommendation: "Expand content to 2500+ words" },
        { factor: "Uniqueness", score: 80, maxScore: 100, status: "good" },
        { factor: "Freshness", score: 60, maxScore: 100, status: "warning", recommendation: "Update content within last 90 days" }
      ]
    },
    {
      category: "Authority",
      score: 68,
      maxScore: 100,
      trend: "up",
      details: [
        { factor: "Backlink Quality", score: 70, maxScore: 100, status: "warning", recommendation: "Build more high-DA backlinks" },
        { factor: "Domain Authority", score: 75, maxScore: 100, status: "warning" },
        { factor: "Topical Coverage", score: 60, maxScore: 100, status: "warning", recommendation: "Create supporting cluster content" }
      ]
    },
    {
      category: "User Experience",
      score: 78,
      maxScore: 100,
      trend: "down",
      details: [
        { factor: "Bounce Rate", score: 70, maxScore: 100, status: "warning", recommendation: "Improve above-fold engagement" },
        { factor: "Time on Page", score: 85, maxScore: 100, status: "good" },
        { factor: "Core Web Vitals", score: 80, maxScore: 100, status: "good" }
      ]
    }
  ];

  const displayScores = scores.length > 0 ? scores : defaultScores;
  const displayOverallScore = overallScore || 76;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span>CONVEX SEO Scoring</span>
              <Badge variant="outline">Beta</Badge>
            </CardTitle>
            {targetUrl && (
              <p className="text-sm text-muted-foreground mt-1">{targetUrl}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runSEOAnalysis}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="overflow-y-auto max-h-[calc(90vh-80px)] p-6">
          {/* Overall Score */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-primary/20">
              <div className="text-center">
                <span className="text-4xl font-bold">{displayOverallScore}</span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="mt-2 text-lg font-medium">Overall CONVEX SEO Score</p>
            <p className="text-sm text-muted-foreground">
              Based on technical, content, authority, and UX factors
            </p>
          </div>

          {/* Score Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {displayScores.map((category) => (
              <Card key={category.category}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{category.category}</CardTitle>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(category.trend)}
                      <span className="font-bold">
                        {category.score}/{category.maxScore}
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={(category.score / category.maxScore) * 100}
                    className="h-2"
                  />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.details.map((detail) => (
                      <div key={detail.factor} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(detail.status)}
                            <span className="text-sm">{detail.factor}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {detail.score}/{detail.maxScore}
                          </span>
                        </div>
                        {detail.recommendation && (
                          <div className="flex items-start gap-2 ml-6 text-xs text-muted-foreground">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{detail.recommendation}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Wins Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-base">Quick Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {displayScores
                  .flatMap(s => s.details)
                  .filter(d => d.recommendation)
                  .slice(0, 5)
                  .map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 rounded-lg bg-muted/50"
                    >
                      <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <span className="font-medium text-sm">{detail.factor}: </span>
                        <span className="text-sm text-muted-foreground">
                          {detail.recommendation}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
