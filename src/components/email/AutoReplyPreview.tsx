"use client";

import React from "react";
import { Bot, CheckCircle2, Edit3, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Bot className="h-5 w-5 text-blue-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">AI Generated Reply</h3>
            <p className="text-xs text-gray-600">
              {isSent ? "Sent automatically" : "Pending approval"}
            </p>
          </div>
        </div>
        {isSent ? (
          <Badge variant="outline" className="gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            Sent
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 bg-orange-50 text-orange-700 border-orange-200">
            Pending
          </Badge>
        )}
      </div>

      {/* Questions Generated */}
      {autoReply.questionsGenerated.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Questions Identified:
          </p>
          <ul className="space-y-1">
            {autoReply.questionsGenerated.map((question, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                <span className="text-blue-600 font-medium">{index + 1}.</span>
                {question}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reply Content */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: autoReply.autoReplyContent }}
        />
      </div>

      {/* Actions */}
      {!isSent && (
        <div className="flex items-center gap-3">
          <Button onClick={onApprove} className="flex-1 gap-2">
            <Send className="h-4 w-4" />
            Send Reply
          </Button>
          <Button onClick={onEdit} variant="outline" className="gap-2">
            <Edit3 className="h-4 w-4" />
            Edit
          </Button>
        </div>
      )}
    </div>
  );
}
