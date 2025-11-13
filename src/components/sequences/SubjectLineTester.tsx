"use client";

/**
 * Subject Line Tester Component
 * A/B testing tool for email subject lines
 */

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, TrendingUp, Copy, Check } from "lucide-react";

interface SubjectLineVariation {
  id: string;
  text: string;
  approach: "curiosity" | "benefit" | "question" | "personalization" | "urgency";
  score?: number;
  openRate?: number;
  reasoning: string;
}

interface SubjectLineTesterProps {
  currentSubject: string;
  onGenerate: () => void;
  onSelect: (variation: string) => void;
}

export function SubjectLineTester({
  currentSubject,
  onGenerate,
  onSelect,
}: SubjectLineTesterProps) {
  const [variations, setVariations] = useState<SubjectLineVariation[]>([
    {
      id: "1",
      text: "Quick question about {company}",
      approach: "question",
      score: 85,
      openRate: 42.3,
      reasoning: "Questions create curiosity and feel personal",
    },
    {
      id: "2",
      text: "{firstName}, this might interest you",
      approach: "personalization",
      score: 78,
      openRate: 38.7,
      reasoning: "Personalization increases relevance and open rates",
    },
    {
      id: "3",
      text: "3 ways {company} can increase revenue",
      approach: "benefit",
      score: 82,
      openRate: 40.1,
      reasoning: "Specific benefit with numbers performs well",
    },
    {
      id: "4",
      text: "How did {competitor} achieve this?",
      approach: "curiosity",
      score: 88,
      openRate: 44.2,
      reasoning: "Competitor mention + curiosity is highly engaging",
    },
    {
      id: "5",
      text: "Last chance: {offer} expires today",
      approach: "urgency",
      score: 90,
      openRate: 46.8,
      reasoning: "Urgency + scarcity drives immediate action",
    },
  ]);

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const getApproachColor = (approach: string) => {
    switch (approach) {
      case "curiosity":
        return "bg-purple-100 text-purple-800";
      case "benefit":
        return "bg-green-100 text-green-800";
      case "question":
        return "bg-blue-100 text-blue-800";
      case "personalization":
        return "bg-orange-100 text-orange-800";
      case "urgency":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subject Line A/B Testing</CardTitle>
            <CardDescription>
              Test different approaches to optimize open rates
            </CardDescription>
          </div>
          <Button onClick={onGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate More
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Subject */}
        <div className="p-4 bg-muted rounded-lg border-2 border-primary">
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Current Subject Line
          </p>
          <p className="font-medium">{currentSubject}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {currentSubject.length} characters
          </p>
        </div>

        {/* Variations */}
        <div className="space-y-3">
          {variations.map((variation, index) => (
            <div
              key={variation.id}
              className="p-4 border rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">Variation {index + 1}</Badge>
                    <Badge className={getApproachColor(variation.approach)}>
                      {variation.approach}
                    </Badge>
                    {variation.score && (
                      <div className="flex items-center gap-1">
                        <TrendingUp className={`h-4 w-4 ${getScoreColor(variation.score)}`} />
                        <span className={`text-sm font-bold ${getScoreColor(variation.score)}`}>
                          {variation.score}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="font-medium mb-1">{variation.text}</p>

                  <p className="text-sm text-muted-foreground italic">
                    {variation.reasoning}
                  </p>

                  {variation.openRate && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">
                          Predicted Open Rate
                        </span>
                        <span className="text-xs font-bold">
                          {variation.openRate}%
                        </span>
                      </div>
                      <Progress value={variation.openRate} />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(variation.text, variation.id)}
                  >
                    {copied === variation.id ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => onSelect(variation.text)}
                  >
                    Use This
                  </Button>
                </div>
              </div>

              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  {variation.text.length} characters
                  {variation.text.length > 60 && (
                    <span className="text-yellow-600 ml-2">
                      • Consider shortening (60+ chars may be cut off)
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Best Practices */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-medium text-blue-900 mb-2">
            Subject Line Best Practices
          </p>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Keep it 40-50 characters for optimal display</li>
            <li>• Use personalization tags: {"{firstName}"}, {"{company}"}</li>
            <li>• Create curiosity without being clickbait</li>
            <li>• Avoid spam triggers: FREE, !!!, $$$, ALL CAPS</li>
            <li>• Test multiple approaches (question, benefit, urgency)</li>
            <li>• Mobile-first: Think how it looks on phone screen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
