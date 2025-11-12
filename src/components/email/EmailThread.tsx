"use client";

import React from "react";
import { Mail, User, Calendar, Bot, CheckCircle2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

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
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Email Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {email.subject}
          </h1>

          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full">
              <User className="h-6 w-6 text-blue-700" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900">
                  {email.senderName || "Unknown Sender"}
                </p>
                {email.autoReplySent && (
                  <Badge variant="outline" className="gap-1">
                    <Bot className="h-3 w-3" />
                    Auto-replied
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">{email.senderEmail}</p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Calendar className="h-3 w-3" />
                {format(email.receivedAt, "PPpp")}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Attachments ({email.attachments.length})
              </p>
              <div className="space-y-2">
                {email.attachments.map((attachment, index) => (
                  <a
                    key={index}
                    href={attachment.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-900 flex-1">
                      {attachment.fileName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(attachment.fileSize / 1024).toFixed(1)} KB
                    </span>
                    <ExternalLink className="h-4 w-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Email Body */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: email.messageBody }}
          />
        </div>

        {/* Auto Reply */}
        {email.autoReplySent && email.autoReplyContent && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Bot className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Auto-Reply</h3>
                <p className="text-xs text-gray-600">
                  Sent {email.autoReplySentAt && format(email.autoReplySentAt, "PPpp")}
                </p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: email.autoReplyContent }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 mt-6">
          <Button variant="outline">Reply Manually</Button>
          <Button variant="outline">Forward</Button>
          <Button variant="outline">Archive</Button>
        </div>
      </div>
    </div>
  );
}
