"use client";

// NOTE: dangerouslySetInnerHTML is intentional here — all HTML is sanitised
// via sanitizeEmailHtml() before render. This is the same pattern as the original.

import React from "react";
import { Mail, User, Calendar, Bot, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { sanitizeEmailHtml } from "@/lib/sanitize-html";

interface EmailThreadProps {
  email: {
    _id: string;
    senderEmail: string;
    senderName?: string;
    subject: string;
    messageBody: string;
    messageBodyPlain?: string;
    receivedAt: number;
    autoReplySent: boolean;
    autoReplyContent?: string;
    autoReplySentAt?: number;
    attachments: Array<{
      fileName: string;
      fileUrl: string;
      mimeType: string;
      fileSize: number;
    }>;
  };
}

export function EmailThread({ email }: EmailThreadProps) {
  return (
    <div className="h-full overflow-y-auto bg-[#050505]">
      <div className="max-w-4xl mx-auto p-6">
        {/* Email Header */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 mb-4">
          <h1 className="text-2xl font-mono font-bold text-white mb-4">
            {email.subject}
          </h1>

          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-white/[0.04] border border-white/[0.06] rounded-sm">
              <User className="h-6 w-6" style={{ color: '#00F5FF' }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-mono font-semibold text-white">
                  {email.senderName || "Unknown Sender"}
                </p>
                {email.autoReplySent && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-mono font-medium border"
                    style={{ color: '#00FF88', borderColor: '#00FF8840', backgroundColor: '#00FF8810' }}
                  >
                    <Bot className="h-3 w-3" />
                    Auto-replied
                  </span>
                )}
              </div>
              <p className="font-mono text-sm text-white/50">{email.senderEmail}</p>
              <div className="flex items-center gap-1 font-mono text-xs text-white/30 mt-1">
                <Calendar className="h-3 w-3" />
                {format(email.receivedAt, "PPpp")}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <div className="border-t border-white/[0.06] pt-4">
              <p className="font-mono text-sm font-medium text-white/60 mb-2">
                Attachments ({email.attachments.length})
              </p>
              <div className="space-y-2">
                {email.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border border-white/[0.06] rounded-sm hover:bg-white/[0.04] transition-colors"
                  >
                    <Mail className="h-4 w-4 text-white/40" />
                    <span className="font-mono text-sm text-white flex-1">
                      {attachment.fileName}
                    </span>
                    <span className="font-mono text-xs text-white/30">
                      {(attachment.fileSize / 1024).toFixed(1)} KB
                    </span>
                    <ExternalLink className="h-4 w-4 text-white/30" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Email Body */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 mb-4">
          <div
            className="prose prose-sm max-w-none prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.messageBody) }}
          />
        </div>

        {/* Auto Reply */}
        {email.autoReplySent && email.autoReplyContent && (
          <div
            className="rounded-sm border p-6"
            style={{ backgroundColor: '#00FF8808', borderColor: '#00FF8830' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div
                className="p-2 rounded-sm"
                style={{ backgroundColor: '#00FF8820' }}
              >
                <Bot className="h-5 w-5" style={{ color: '#00FF88' }} />
              </div>
              <div>
                <h3 className="font-mono font-semibold text-white">AI Auto-Reply</h3>
                <p className="font-mono text-xs text-white/40">
                  Sent {email.autoReplySentAt && format(email.autoReplySentAt, "PPpp")}
                </p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div
                className="prose prose-sm max-w-none prose-invert"
                dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(email.autoReplyContent) }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <button className="px-4 py-2 rounded-sm border border-white/[0.08] font-mono text-sm text-white hover:bg-white/[0.04] transition-colors">
            Reply Manually
          </button>
          <button className="px-4 py-2 rounded-sm border border-white/[0.08] font-mono text-sm text-white hover:bg-white/[0.04] transition-colors">
            Forward
          </button>
          <button className="px-4 py-2 rounded-sm border border-white/[0.08] font-mono text-sm text-white hover:bg-white/[0.04] transition-colors">
            Archive
          </button>
        </div>
      </div>
    </div>
  );
}
