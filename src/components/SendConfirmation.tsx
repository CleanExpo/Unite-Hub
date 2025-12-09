"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";

export function SendConfirmation({
  isOpen,
  onClose,
  onConfirm,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  data?: {
    contentCount: number;
    recipientCount: number;
    scheduleType: string;
    sendTime?: string;
  };
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!data) {
return null;
}

  const handleConfirm = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate sending
    onConfirm();
    setIsProcessing(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
            Ready to Send
          </DialogTitle>
          <DialogDescription>Final confirmation before sending emails</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-700 rounded p-4 border border-slate-600">
              <div className="text-xs text-slate-400 mb-2">📧 Content Pieces</div>
              <div className="text-3xl font-bold text-blue-400">{data.contentCount}</div>
            </div>
            <div className="bg-slate-700 rounded p-4 border border-slate-600">
              <div className="text-xs text-slate-400 mb-2">👥 Recipients</div>
              <div className="text-3xl font-bold text-green-400">{data.recipientCount}</div>
            </div>
            <div className="bg-slate-700 rounded p-4 border border-slate-600">
              <div className="text-xs text-slate-400 mb-2">⏰ Schedule</div>
              <div className="text-lg font-bold text-purple-400 truncate">
                {data.scheduleType === "immediate" ? "Now" : data.sendTime || "Later"}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-blue-600/10 border border-blue-600/30 rounded p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold text-white mb-1">Campaign Details</p>
                <ul className="text-xs space-y-1">
                  <li>✓ {data.contentCount} email draft{data.contentCount !== 1 ? "s" : ""} will be sent</li>
                  <li>✓ To {data.recipientCount} prospect{data.recipientCount !== 1 ? "s" : ""} in your database</li>
                  <li>✓ Scheduled for {data.scheduleType === "immediate" ? "immediate delivery" : `${data.sendTime} delivery`}</li>
                  <li>✓ Performance metrics will be tracked in real-time</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Expected Results */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-white">Expected Results (Industry Avg)</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Open Rate</span>
                  <span className="text-green-400 font-semibold">~24%</span>
                </div>
                <Progress value={24} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Click Rate</span>
                  <span className="text-green-400 font-semibold">~4%</span>
                </div>
                <Progress value={4} className="h-1.5" />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Reply Rate</span>
                  <span className="text-green-400 font-semibold">~2%</span>
                </div>
                <Progress value={2} className="h-1.5" />
              </div>
            </div>
          </div>

          {/* Processing State */}
          {isProcessing && (
            <div className="bg-amber-600/10 border border-amber-600/30 rounded p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400 animate-spin" />
                <span className="text-sm text-slate-300">Sending emails...</span>
              </div>
              <Progress value={65} className="h-1" />
            </div>
          )}
        </div>

        <DialogFooter className="space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                ✅ Confirm & Send
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
