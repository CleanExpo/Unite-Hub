"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Download, Eye } from "lucide-react";

interface DesignPreviewProps {
  sections: any[];
  colorScheme?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  onExport: () => void;
}

export function DesignPreview({
  sections,
  colorScheme,
  onExport,
}: DesignPreviewProps) {
  const colors = colorScheme || {
    primary: "#0066cc",
    secondary: "#0052a3",
    accent: "#ff9500",
    background: "#ffffff",
    text: "#1a1a1a",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Design Preview
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Scheme */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <h4 className="font-medium text-sm">Color Scheme</h4>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <div className="space-y-1">
              <div
                className="h-12 rounded border"
                style={{ backgroundColor: colors.primary }}
              />
              <p className="text-xs text-center text-muted-foreground">Primary</p>
            </div>
            <div className="space-y-1">
              <div
                className="h-12 rounded border"
                style={{ backgroundColor: colors.secondary }}
              />
              <p className="text-xs text-center text-muted-foreground">Secondary</p>
            </div>
            <div className="space-y-1">
              <div
                className="h-12 rounded border"
                style={{ backgroundColor: colors.accent }}
              />
              <p className="text-xs text-center text-muted-foreground">Accent</p>
            </div>
            <div className="space-y-1">
              <div
                className="h-12 rounded border"
                style={{ backgroundColor: colors.background }}
              />
              <p className="text-xs text-center text-muted-foreground">Background</p>
            </div>
            <div className="space-y-1">
              <div
                className="h-12 rounded border"
                style={{ backgroundColor: colors.text }}
              />
              <p className="text-xs text-center text-muted-foreground">Text</p>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg border overflow-hidden">
          <div
            className="p-8 space-y-6"
            style={{
              backgroundColor: colors.background,
              color: colors.text,
            }}
          >
            {sections.map((section, idx) => (
              <div key={idx} className="space-y-3">
                {section.headline && (
                  <h2
                    className="text-3xl font-bold"
                    style={{ color: colors.primary }}
                  >
                    {section.headline}
                  </h2>
                )}
                {section.subheadline && (
                  <p className="text-lg opacity-80">{section.subheadline}</p>
                )}
                {section.bodyCopy && (
                  <p className="text-sm opacity-70 max-w-2xl">
                    {section.bodyCopy.substring(0, 200)}
                    {section.bodyCopy.length > 200 ? "..." : ""}
                  </p>
                )}
                {section.cta && (
                  <Button
                    style={{
                      backgroundColor: colors.accent,
                      color: "#ffffff",
                    }}
                    className="mt-2"
                  >
                    {section.cta}
                  </Button>
                )}
                {idx < sections.length - 1 && <hr className="opacity-20" />}
              </div>
            ))}
          </div>
        </div>

        {/* Design Tips */}
        <div className="rounded-lg bg-muted p-4">
          <h4 className="font-medium text-sm mb-2">Design Tips</h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>• Maintain consistent spacing between sections</li>
            <li>• Use high-quality images that support your message</li>
            <li>• Ensure sufficient color contrast for readability</li>
            <li>• Keep CTAs prominent and easy to spot</li>
            <li>• Test on mobile devices for responsiveness</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
