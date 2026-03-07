"use client";

import { motion } from "framer-motion";
import { MessageSquare, Phone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

const EASE = [0.19, 1, 0.22, 1] as const;

const CHANNELS = [
  {
    name: "WhatsApp",
    description: "Manage WhatsApp conversations with contacts",
    icon: MessageSquare,
    href: "/dashboard/messages/whatsapp",
    status: "Active",
    colour: "#00FF88",
    unread: 5,
  },
  {
    name: "SMS",
    description: "Send and receive SMS messages",
    icon: Phone,
    href: "/dashboard/messages/sms",
    status: "Coming Soon",
    colour: "#FFB800",
    unread: 0,
  },
  {
    name: "Email",
    description: "Direct email messaging",
    icon: Mail,
    href: "/dashboard/emails",
    status: "Active",
    colour: "#00F5FF",
    unread: 0,
  },
];

export default function MessagesPage() {
  return (
    <div className="p-6 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-1">
          <MessageSquare className="h-5 w-5 text-[#00F5FF]" />
          <h1 className="text-xl font-mono font-bold text-white/90 tracking-wide">MESSAGES</h1>
        </div>
        <p className="text-sm text-white/40">Unified messaging across all channels</p>
      </motion.div>

      <div className="space-y-3">
        {CHANNELS.map((channel, i) => {
          const Icon = channel.icon;
          return (
            <motion.div
              key={channel.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 + i * 0.07, ease: EASE }}
            >
              <Link
                href={channel.href}
                className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-sm p-5 hover:border-white/[0.12] hover:bg-white/[0.03] transition-colors group block"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${channel.colour}10`, border: `1px solid ${channel.colour}30` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: channel.colour }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white/90">{channel.name}</p>
                      {channel.unread > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/30">
                          {channel.unread} new
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mt-0.5">{channel.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-sm border"
                    style={{
                      color: channel.colour,
                      borderColor: `${channel.colour}40`,
                      backgroundColor: `${channel.colour}10`,
                    }}
                  >
                    {channel.status}
                  </span>
                  <ArrowRight className="h-4 w-4 text-white/20 group-hover:text-white/50 transition-colors" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
