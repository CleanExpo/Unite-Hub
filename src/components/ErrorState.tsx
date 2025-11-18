import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  showRetry?: boolean;
}

/**
 * ErrorState Component
 *
 * Displays a user-friendly error message with optional retry action
 */
export function ErrorState({
  title = "Something went wrong",
  message = "We encountered an error while loading this data. Please try again.",
  onRetry,
  showRetry = true,
}: ErrorStateProps) {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
      <CardContent className="p-12 text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="text-slate-400">{message}</p>
        </div>

        {/* Retry Button */}
        {showRetry && onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50 gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * InlineErrorState
 *
 * Compact error message for inline use (e.g., in tables)
 */
export function InlineErrorState({
  message = "Failed to load data",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 p-8 text-center">
      <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
      <p className="text-slate-400">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          size="sm"
          variant="ghost"
          className="text-slate-300 hover:bg-slate-700/50 gap-2"
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </Button>
      )}
    </div>
  );
}
