"use client";

import React from "react";
import { Mail, Clock, CheckCircle2, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Email {
  _id: string;
  senderEmail: string;
  senderName?: string;
  subject: string;
  messageBody: string;
  receivedAt: number;
  autoReplySent: boolean;
  isRead: boolean;
}

interface EmailListProps {
  emails: Email[];
  selectedEmailId?: string;
  onSelectEmail: (emailId: string) => void;
}

export function EmailList({
  emails,
  selectedEmailId,
  onSelectEmail,
}: EmailListProps) {
  return (
    <div className="h-full overflow-y-auto">
      {emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Mail className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No emails yet
          </h3>
          <p className="text-sm text-gray-600">
            Incoming emails will appear here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {emails.map((email) => (
            <button
              key={email._id}
              onClick={() => onSelectEmail(email._id)}
              className={cn(
                "w-full text-left p-4 hover:bg-gray-50 transition-colors",
                selectedEmailId === email._id && "bg-blue-50 border-l-4 border-blue-600",
                !email.isRead && "bg-blue-50/30"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 truncate">
                      {email.senderName || email.senderEmail}
                    </p>
                    {!email.isRead && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 truncate">
                    {email.senderEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {email.autoReplySent && (
                    <Bot className="h-4 w-4 text-green-600" title="Auto-replied" />
                  )}
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(email.receivedAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
              <h4 className="font-medium text-gray-900 mb-1 truncate">
                {email.subject}
              </h4>
              <p className="text-sm text-gray-600 line-clamp-2">
                {email.messageBody.replace(/<[^>]*>/g, "")}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
