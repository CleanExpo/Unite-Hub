"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Eye,
  Edit,
  Archive,
  Loader2,
} from "lucide-react";

interface BusinessCardProps {
  id: string;
  name: string;
  industry: string;
  status: "active" | "paused" | "archived";
  healthScore: number;
  lastUpdated: Date;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onArchive?: (id: string) => void;
}

export function BusinessCard({
  id,
  name,
  industry,
  status,
  healthScore,
  lastUpdated,
  onView,
  onEdit,
  onArchive,
}: BusinessCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getHealthColor = (score: number) => {
    if (score >= 70) {
return "text-green-600 dark:text-green-400";
}
    if (score >= 40) {
return "text-yellow-600 dark:text-yellow-400";
}
    return "text-red-600 dark:text-red-400";
  };

  const getHealthBgColor = (score: number) => {
    if (score >= 70) {
return "bg-green-50 dark:bg-green-950";
}
    if (score >= 40) {
return "bg-yellow-50 dark:bg-yellow-950";
}
    return "bg-red-50 dark:bg-red-950";
  };

  const getHealthIcon = (score: number) => {
    if (score >= 70) {
return TrendingUp;
}
    if (score >= 40) {
return Minus;
}
    return TrendingDown;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-700 dark:text-green-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
      case "archived":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    }
  };

  const HealthIcon = getHealthIcon(healthScore);

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
return "Just now";
}
    if (hours < 24) {
return `${hours}h ago`;
}
    if (days < 7) {
return `${days}d ago`;
}
    return date.toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-muted">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${getHealthBgColor(healthScore)}`}>
              <Building2 className={`h-5 w-5 ${getHealthColor(healthScore)}`} />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold truncate">
                {name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{industry}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MoreVertical className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onView && handleAction(() => onView(id))}
              >
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onEdit && handleAction(() => onEdit(id))}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Business
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onArchive && handleAction(() => onArchive(id))}
                className="text-destructive focus:text-destructive"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Health Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Health Score</span>
          <div className="flex items-center gap-2">
            <HealthIcon className={`h-4 w-4 ${getHealthColor(healthScore)}`} />
            <span className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
              {healthScore}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              healthScore >= 70
                ? "bg-green-500"
                : healthScore >= 40
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>

        {/* Status and Last Updated */}
        <div className="flex items-center justify-between text-sm">
          <Badge variant="secondary" className={getStatusColor(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
          <span className="text-muted-foreground">
            Updated {formatDate(lastUpdated)}
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView && onView(id)}
            disabled={isLoading}
          >
            <Eye className="h-4 w-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onEdit && onEdit(id)}
            disabled={isLoading}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
