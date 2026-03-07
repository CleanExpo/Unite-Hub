"use client";

import React from "react";
import { Mail, Bot } from "lucide-react";
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
    <div className="h-full overflow-y-auto bg-[#050505]">
      {emails.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
          <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-sm mb-4">
            <Mail className="h-8 w-8 text-white/20" />
          </div>
          <h3 className="font-mono text-lg font-semibold text-white mb-2">
            No emails yet
          </h3>
          <p className="font-mono text-sm text-white/40">
            Incoming emails will appear here
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.04]">
          {emails.map((email) => (
            <button
              key={email._id}
              onClick={() => onSelectEmail(email._id)}
              className={cn(
                "w-full text-left p-4 transition-colors hover:bg-white/[0.03]",
                selectedEmailId === email._id && "bg-white/[0.04] border-l-2",
                !email.isRead && "bg-white/[0.02]"
              )}
              style={
                selectedEmailId === email._id
                  ? { borderLeftColor: '#00F5FF' }
                  : undefined
              }
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-mono font-semibold text-white truncate">
                      {email.senderName || email.senderEmail}
                    </p>
                    {!email.isRead && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-medium"
                        style={{ backgroundColor: '#00F5FF20', color: '#00F5FF' }}
                      >
                        New
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-white/40 truncate">
                    {email.senderEmail}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  {email.autoReplySent && (
                    <Bot
                      className="h-4 w-4"
                      style={{ color: '#00FF88' }}
                      title="Auto-replied"
                    />
                  )}
                  <span className="font-mono text-xs text-white/30 whitespace-nowrap">
                    {formatDistanceToNow(email.receivedAt, { addSuffix: true })}
                  </span>
                </div>
              </div>
              <h4 className="font-mono font-medium text-white/80 mb-1 truncate">
                {email.subject}
              </h4>
              <p className="font-mono text-sm text-white/40 line-clamp-2">
                {email.messageBody.replace(/<[^>]*>/g, "")}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
