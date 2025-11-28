"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ExplanationMode } from "@/lib/strategy/strategyGenerator";

interface ApprovalAutoButtonProps {
  title: string;
  description: string;
  payload: Record<string, unknown>;
  source: string;
  business_id: string;
  client_id?: string;
  created_by?: string;
  businessName?: string;
  industry?: string;
  boostBumpEligible?: boolean;
  onSuccess?: () => void;
}

export function ApprovalAutoButton({
  title,
  description,
  payload,
  source,
  business_id,
  client_id,
  created_by,
  businessName,
  industry,
  boostBumpEligible,
  onSuccess,
}: ApprovalAutoButtonProps) {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<ExplanationMode>("founder");

  async function handleSubmit() {
    setLoading(true);

    try {
      const response = await fetch("/api/client-approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id,
          client_id: client_id || null,
          created_by: created_by || null,
          title,
          description,
          data: payload,
          source,
          context: {
            businessName,
            industry,
            boostBumpEligible,
            seoFindings: payload,
          },
          preferred_explanation_mode: mode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create approval");
      }

      setSubmitted(true);
      toast({
        title: "Approval Submitted",
        description:
          "Sent to AI Phill & Founder OS for client approval with multi-strategy options.",
      });

      onSuccess?.();
    } catch (error) {
      console.error("Approval submission error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit approval",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
        <CheckCircle className="w-4 h-4" />
        <span>
          Sent to AI Phill + Founder OS for client approval with multi-strategy
          options.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Explanation mode:</span>
        <Select
          value={mode}
          onValueChange={(v) => setMode(v as ExplanationMode)}
        >
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eli5">Explain like I&apos;m 5</SelectItem>
            <SelectItem value="beginner">Beginner business owner</SelectItem>
            <SelectItem value="technical">Technical / SEO</SelectItem>
            <SelectItem value="founder">Founder-level summary</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Preparing approval package...
          </>
        ) : (
          <>
            <Send className="w-4 h-4 mr-2" />
            Submit for Client Approval (with strategies)
          </>
        )}
      </Button>
    </div>
  );
}

export default ApprovalAutoButton;
