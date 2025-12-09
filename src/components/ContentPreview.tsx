"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Zap, Copy, Send, Edit2 } from "lucide-react";

export function ContentPreview({
  content,
  onApprove,
  onEdit,
  onSend,
}: {
  content: any;
  onApprove?: () => void;
  onEdit?: () => void;
  onSend?: () => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState(0);

  if (!content) {
return null;
}

  const subjectLines = content.subject_lines || [];
  const selectedSubject = subjectLines[selectedVariant];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              AI-Generated Content
            </CardTitle>
            <CardDescription>
              Personalization Score: {content.personalization_score || 0}/100
            </CardDescription>
          </div>
          <Badge className="bg-purple-600">{content.content_type}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* A/B Test Variants */}
        {subjectLines.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-white">Subject Line Variants</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {subjectLines.map((subject, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedVariant(idx)}
                  className={`p-3 rounded border text-left transition ${
                    selectedVariant === idx
                      ? "bg-blue-600/20 border-blue-600"
                      : "bg-slate-700 border-slate-600 hover:border-blue-500"
                  }`}
                >
                  <div className="text-xs font-semibold text-slate-400 mb-1">
                    Option {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="text-sm text-white line-clamp-2">
                    {subject}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Email Preview */}
        <div className="space-y-3">
          <h4 className="font-semibold text-white">Email Preview</h4>
          <div className="bg-slate-700 rounded p-4 border border-slate-600 space-y-3">
            {/* To */}
            <div className="text-sm">
              <span className="text-slate-400">To:</span>
              <span className="text-white ml-2">
                {content.contact?.email || "recipient@company.com"}
              </span>
            </div>

            {/* Subject */}
            <div className="text-sm pb-3 border-b border-slate-600">
              <span className="text-slate-400">Subject:</span>
              <span className="text-white ml-2 font-semibold">
                {selectedSubject}
              </span>
            </div>

            {/* Body */}
            <div className="text-sm text-slate-300 whitespace-pre-wrap font-serif">
              {content.generated_text}
            </div>

            {/* CTA */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded p-3 text-sm text-blue-200">
              <strong>Call to Action:</strong> {content.cta || "Next step recommended by AI"}
            </div>
          </div>
        </div>

        {/* Key Talking Points */}
        {content.key_talking_points && (
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-sm">Key Talking Points</h4>
            <div className="space-y-1">
              {content.key_talking_points.map((point, i) => (
                <div key={i} className="text-sm text-slate-300 flex gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Proof */}
        {content.social_proof && (
          <div className="space-y-2">
            <h4 className="font-semibold text-white text-sm">Social Proof</h4>
            <div className="bg-green-600/10 border border-green-600/30 rounded p-3 space-y-1">
              {content.social_proof.map((proof, i) => (
                <div key={i} className="text-sm text-green-200">
                  ✓ {proof}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tone & Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Tone</div>
            <div className="text-sm font-semibold text-white capitalize">
              {content.tone || "Professional"}
            </div>
          </div>
          <div className="bg-slate-700 rounded p-3">
            <div className="text-xs text-slate-400 mb-1">Status</div>
            <Badge className="bg-amber-600">{content.status || "Draft"}</Badge>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-slate-700">
          {onEdit && (
            <Button
              onClick={onEdit}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
          {onApprove && (
            <Button
              onClick={onApprove}
              className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
            >
              ✅ Approve
            </Button>
          )}
          {onSend && (
            <Button
              onClick={onSend}
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Send className="w-4 h-4" />
              Send Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
