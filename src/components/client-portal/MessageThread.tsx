"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  author: string;
  avatar?: string;
  initials: string;
  role?: string;
  time: string;
  text: string;
  isClient?: boolean;
}

interface MessageThreadProps {
  messages: Message[];
  className?: string;
}

export function MessageThread({ messages, className }: MessageThreadProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message) => (
        <div key={message.id} className="flex gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            {message.avatar && <AvatarImage src={message.avatar} alt={message.author} />}
            <AvatarFallback className={cn(
              "text-sm font-semibold",
              message.isClient
                ? "bg-gradient-to-br from-unite-orange to-unite-gold text-white"
                : "bg-gradient-to-br from-unite-teal to-unite-blue text-white"
            )}>
              {message.initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-sm font-semibold">{message.author}</span>
                  {message.role && (
                    <span className="text-xs text-gray-500 ml-2">({message.role})</span>
                  )}
                </div>
                <span className="text-xs text-gray-500">{message.time}</span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">{message.text}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
