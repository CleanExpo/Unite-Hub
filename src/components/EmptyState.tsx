import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  gradient?: string;
}

/**
 * EmptyState Component
 *
 * Displays when a list or collection has no items
 * Provides clear messaging and optional action button
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  gradient = "from-blue-500/20 to-purple-600/20",
}: EmptyStateProps) {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardContent className="p-12 text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div
            className={`h-16 w-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <Icon className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-slate-400 max-w-md mx-auto">{description}</p>
        </div>

        {/* Action Button */}
        {actionLabel && onAction && (
          <Button
            onClick={onAction}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * InlineEmptyState
 *
 * Compact empty state for inline use (e.g., in tables)
 */
export function InlineEmptyState({
  message,
  icon: Icon,
}: {
  message: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
      <div className="h-12 w-12 rounded-full bg-slate-700/50 flex items-center justify-center">
        <Icon className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-slate-400">{message}</p>
    </div>
  );
}
