"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DollarSign, Calendar, User, GripVertical } from "lucide-react";
import Link from "next/link";

export interface Deal {
  id: string;
  title: string;
  value: number;
  currency: string;
  probability: number;
  expected_close_date: string | null;
  actual_close_date: string | null;
  status: "open" | "won" | "lost" | "abandoned";
  notes: string | null;
  tags: string[];
  source: string | null;
  stage_id: string;
  contact_id: string | null;
  created_at: string;
  updated_at: string;
  pipeline_stages?: {
    id: string;
    name: string;
    color: string;
    position: number;
    is_won: boolean;
    is_lost: boolean;
  };
  contacts?: {
    id: string;
    name: string;
    email: string;
    company: string | null;
  };
}

interface DealCardProps {
  deal: Deal;
  onDragStart?: (e: React.DragEvent, dealId: string) => void;
}

function formatCurrency(value: number, currency: string = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function daysAgo(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
  });
}

export function DealCard({ deal, onDragStart }: DealCardProps) {
  const days = daysAgo(deal.updated_at);

  return (
    <Link href={`/dashboard/deals/${deal.id}`}>
      <Card
        className="bg-slate-800/60 border-slate-700 hover:border-slate-500 hover:bg-slate-800/80
                   cursor-pointer transition-all duration-200 group p-3"
        draggable
        onDragStart={(e) => onDragStart?.(e, deal.id)}
      >
        <div className="flex items-start gap-2">
          <GripVertical className="w-4 h-4 text-slate-600 group-hover:text-slate-400 mt-0.5 flex-shrink-0 cursor-grab" />
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="text-sm font-medium text-white truncate">{deal.title}</h4>

            {/* Contact */}
            {deal.contacts && (
              <div className="flex items-center gap-1 mt-1">
                <User className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-400 truncate">
                  {deal.contacts.name}
                  {deal.contacts.company && ` · ${deal.contacts.company}`}
                </span>
              </div>
            )}

            {/* Value and probability */}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-400">
                  {formatCurrency(deal.value, deal.currency)}
                </span>
              </div>
              <Badge
                variant="outline"
                className={`text-[10px] px-1.5 py-0 border-slate-600 ${
                  deal.probability >= 75
                    ? "text-emerald-400"
                    : deal.probability >= 50
                    ? "text-yellow-400"
                    : "text-slate-400"
                }`}
              >
                {deal.probability}%
              </Badge>
            </div>

            {/* Footer: close date & days in stage */}
            <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
              {deal.expected_close_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(deal.expected_close_date)}</span>
                </div>
              )}
              <span>{days === 0 ? "Today" : `${days}d ago`}</span>
            </div>

            {/* Tags */}
            {deal.tags && deal.tags.length > 0 && (
              <div className="flex gap-1 mt-2 flex-wrap">
                {deal.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-[10px] px-1.5 py-0 bg-slate-700/50 text-slate-400"
                  >
                    {tag}
                  </Badge>
                ))}
                {deal.tags.length > 2 && (
                  <span className="text-[10px] text-slate-500">+{deal.tags.length - 2}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
