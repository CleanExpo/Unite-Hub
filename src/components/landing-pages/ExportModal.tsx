"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Code, Mail } from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  checklistTitle: string;
}

interface ExportOptions {
  format: "pdf" | "docx" | "html" | "markdown";
  includeSEO: boolean;
  includeAlternatives: boolean;
  includeTips: boolean;
  includeDesign: boolean;
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  checklistTitle,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportOptions["format"]>("pdf");
  const [includeSEO, setIncludeSEO] = useState(true);
  const [includeAlternatives, setIncludeAlternatives] = useState(true);
  const [includeTips, setIncludeTips] = useState(true);
  const [includeDesign, setIncludeDesign] = useState(false);

  const handleExport = () => {
    onExport({
      format,
      includeSEO,
      includeAlternatives,
      includeTips,
      includeDesign,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Landing Page Checklist</DialogTitle>
          <DialogDescription>
            Export {checklistTitle} in your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="docx" id="docx" />
                <Label htmlFor="docx" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  Word Document (.docx)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="html" id="html" />
                <Label htmlFor="html" className="flex items-center gap-2 cursor-pointer">
                  <Code className="h-4 w-4" />
                  HTML File
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="markdown" id="markdown" />
                <Label htmlFor="markdown" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Markdown (.md)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Include Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="seo"
                  checked={includeSEO}
                  onCheckedChange={(checked) => setIncludeSEO(!!checked)}
                />
                <Label
                  htmlFor="seo"
                  className="text-sm font-normal cursor-pointer"
                >
                  SEO metadata and recommendations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="alternatives"
                  checked={includeAlternatives}
                  onCheckedChange={(checked) => setIncludeAlternatives(!!checked)}
                />
                <Label
                  htmlFor="alternatives"
                  className="text-sm font-normal cursor-pointer"
                >
                  Alternative copy variations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="tips"
                  checked={includeTips}
                  onCheckedChange={(checked) => setIncludeTips(!!checked)}
                />
                <Label
                  htmlFor="tips"
                  className="text-sm font-normal cursor-pointer"
                >
                  Copy and design tips
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="design"
                  checked={includeDesign}
                  onCheckedChange={(checked) => setIncludeDesign(!!checked)}
                />
                <Label
                  htmlFor="design"
                  className="text-sm font-normal cursor-pointer"
                >
                  Design preview and color scheme
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
