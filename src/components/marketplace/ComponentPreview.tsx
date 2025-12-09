"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Download, Plus, Eye, Code } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ComponentPreviewProps {
  open: boolean;
  component: {
    id: string;
    name: string;
    description: string;
    category: string;
    style_tag: string;
    component_code: string;
    tailwind_classes: string;
    accessibility_score: number;
    performance_score: number;
    has_dark_mode: boolean;
    has_mobile_variant: boolean;
  } | null;
  onOpenChange: (open: boolean) => void;
  onAddToProject: (componentId: string) => void;
  onExportCode: (componentId: string, format: "tsx" | "jsx" | "css") => void;
}

export default function ComponentPreview({
  open,
  component,
  onOpenChange,
  onAddToProject,
  onExportCode,
}: ComponentPreviewProps) {
  const [accentColor, setAccentColor] = useState("#3B82F6");
  const [showCopyFeedback, setShowCopyFeedback] = useState(false);

  if (!component) {
return null;
}

  const handleCopyCode = () => {
    navigator.clipboard.writeText(component.component_code);
    setShowCopyFeedback(true);
    setTimeout(() => setShowCopyFeedback(false), 2000);
  };

  const handleExport = (format: "tsx" | "jsx" | "css") => {
    onExportCode(component.id, format);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle className="text-2xl">{component.name}</DialogTitle>
            <p className="text-sm text-text-secondary">
              {component.description}
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                {component.category}
              </Badge>
              <Badge variant="outline">{component.style_tag}</Badge>
              {component.has_dark_mode && (
                <Badge variant="outline">Dark Mode</Badge>
              )}
              {component.has_mobile_variant && (
                <Badge variant="outline">Mobile Responsive</Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Tabs: Preview, Code, Details */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="w-4 h-4 mr-2" />
              Code
            </TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-text-secondary">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border border-border-subtle"
                />
                <span className="text-sm text-text-secondary">
                  {accentColor}
                </span>
              </div>
            </div>

            <div className="border border-border-subtle rounded-lg p-4 bg-gray-50 dark:bg-slate-900 min-h-64">
              <p className="text-sm text-text-secondary text-center py-24">
                Live preview would render here
              </p>
            </div>
          </TabsContent>

          {/* Code Tab */}
          <TabsContent value="code" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-text-secondary">
                  Component Code
                </h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyCode}
                  className="gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {showCopyFeedback ? "Copied!" : "Copy Code"}
                </Button>
              </div>

              <div className="bg-slate-900 dark:bg-black rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100 font-mono">
                  <code>{component.component_code}</code>
                </pre>
              </div>

              <div className="pt-4 border-t border-border-subtle">
                <h4 className="text-sm font-medium text-text-secondary mb-3">
                  Export Code
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("tsx")}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export TSX
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("jsx")}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export JSX
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport("css")}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export CSS
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Category
                </label>
                <p className="text-sm text-text-secondary">
                  {component.category}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Style Tag
                </label>
                <p className="text-sm text-text-secondary">
                  {component.style_tag}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Accessibility Score
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-bg-hover rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${component.accessibility_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {component.accessibility_score}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Performance Score
                </label>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-bg-hover rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${component.performance_score}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {component.performance_score}%
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Tailwind Classes
                </label>
                <p className="text-xs text-text-secondary break-words">
                  {component.tailwind_classes}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  Features
                </label>
                <div className="flex gap-2">
                  {component.has_dark_mode && (
                    <Badge variant="secondary" className="text-xs">
                      Dark Mode
                    </Badge>
                  )}
                  {component.has_mobile_variant && (
                    <Badge variant="secondary" className="text-xs">
                      Mobile Ready
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              onAddToProject(component.id);
              onOpenChange(false);
            }}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
