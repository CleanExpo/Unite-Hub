"use client";

// NOTE: dangerouslySetInnerHTML is intentional here — all HTML is sanitised
// via sanitizeEmailHtml() before render. This is the same pattern as the original.

import React from "react";
import { Bot, CheckCircle2, Edit3, Send } from "lucide-react";
import { sanitizeEmailHtml } from "@/lib/sanitize-html";

interface AutoReplyPreviewProps {
  autoReply: {
    questionsGenerated: string[];
    autoReplyContent: string;
    sentAt?: number;
  };
  onEdit?: () => void;
  onApprove?: () => void;
}

export function AutoReplyPreview({
  autoReply,
  onEdit,
  onApprove,
}: AutoReplyPreviewProps) {
  const isSent = !!autoReply.sentAt;

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-sm"
            style={{ backgroundColor: '#00F5FF15' }}
          >
            <Bot className="h-5 w-5" style={{ color: '#00F5FF' }} />
          </div>
          <div>
            <h3 className="font-mono font-semibold text-white">AI Generated Reply</h3>
            <p className="font-mono text-xs text-white/40">
              {isSent ? "Sent automatically" : "Pending approval"}
            </p>
          </div>
        </div>
        {isSent ? (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium border"
            style={{ color: '#00FF88', borderColor: '#00FF8840', backgroundColor: '#00FF8810' }}
          >
            <CheckCircle2 className="h-3 w-3" />
            Sent
          </span>
        ) : (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium border"
            style={{ color: '#FFB800', borderColor: '#FFB80040', backgroundColor: '#FFB80010' }}
          >
            Pending
          </span>
        )}
      </div>

      {/* Questions Generated */}
      {autoReply.questionsGenerated.length > 0 && (
        <div className="mb-4">
          <p className="font-mono text-sm font-medium text-white/60 mb-2">
            Questions Identified:
          </p>
          <ul className="space-y-1">
            {autoReply.questionsGenerated.map((question, index) => (
              <li key={index} className="font-mono text-sm text-white/50 flex items-start gap-2">
                <span className="font-medium" style={{ color: '#00F5FF' }}>{index + 1}.</span>
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reply Content */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 mb-4">
        <div
          className="prose prose-sm max-w-none prose-invert"
          dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(autoReply.autoReplyContent) }}
        />
      </div>

      {/* Actions */}
      {!isSent && (
        <div className="flex items-center gap-3">
          <button
            onClick={onApprove}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-sm font-mono text-sm font-medium text-[#050505] hover:opacity-80 transition-opacity"
            style={{ backgroundColor: '#00F5FF' }}
          >
            <Send className="h-4 w-4" />
            Send Reply
          </button>
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-white/[0.08] font-mono text-sm text-white hover:bg-white/[0.04] transition-colors"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
