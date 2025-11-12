"use client";

import React from "react";
import { Clock, CheckCircle2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface PersonaVersion {
  _id: string;
  personaName: string;
  version: number;
  isActive: boolean;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
}

interface PersonaHistoryProps {
  versions: PersonaVersion[];
  onViewVersion: (personaId: string) => void;
  onRestoreVersion?: (personaId: string) => void;
}

export function PersonaHistory({
  versions,
  onViewVersion,
  onRestoreVersion,
}: PersonaHistoryProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-600" />
        Version History
      </h3>

      <div className="space-y-3">
        {versions.map((version, index) => (
          <div
            key={version._id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  v{version.version}
                </div>
                {version.isActive && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900">
                    {version.personaName}
                  </p>
                  {version.isActive && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Active
                    </Badge>
                  )}
                  {version.isPrimary && (
                    <Badge variant="secondary">Primary</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  Updated {formatDistanceToNow(version.updatedAt, { addSuffix: true })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onViewVersion(version._id)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              {!version.isActive && onRestoreVersion && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRestoreVersion(version._id)}
                >
                  Restore
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
