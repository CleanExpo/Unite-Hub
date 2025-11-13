"use client";

import { Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";

interface EmptyClientStateProps {
  featureName?: string;
  icon?: React.ReactNode;
  description?: string;
}

export default function EmptyClientState({
  featureName = "content",
  icon,
  description
}: EmptyClientStateProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md p-12 text-center bg-slate-900 border-slate-700">
        <div className="flex justify-center mb-6">
          {icon || <Building2 className="h-20 w-20 text-slate-600" />}
        </div>
        <h2 className="text-2xl font-semibold text-white mb-3">
          Select a Client
        </h2>
        <p className="text-slate-400 mb-2">
          {description || `Choose a client from the dropdown above to view their ${featureName}`}
        </p>
        <p className="text-sm text-slate-500">
          You can also create a new client using the + button
        </p>
      </Card>
    </div>
  );
}
