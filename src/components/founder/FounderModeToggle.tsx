"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, CreditCard, Search, BarChart3, Bot, RefreshCw } from "lucide-react";

type PlatformMode = "test" | "live";

interface ServiceModes {
  stripe: PlatformMode;
  dataforseo: PlatformMode;
  semrush: PlatformMode;
  ai: PlatformMode;
}

const SERVICE_INFO = {
  stripe: {
    name: "Stripe Payments",
    icon: CreditCard,
    description: "Payment processing and subscriptions",
    testNote: "Uses Stripe test keys - no real charges",
    liveNote: "LIVE payments - real money will be charged",
  },
  dataforseo: {
    name: "DataForSEO",
    icon: Search,
    description: "SEO research and SERP tracking",
    testNote: "Mock data responses - no API credits used",
    liveNote: "Real API calls - credits will be consumed",
  },
  semrush: {
    name: "SEMRush",
    icon: BarChart3,
    description: "Competitor analysis and keywords",
    testNote: "Mock data responses - no API credits used",
    liveNote: "Real API calls - credits will be consumed",
  },
  ai: {
    name: "AI Models",
    icon: Bot,
    description: "Claude AI for content and analysis",
    testNote: "Uses Haiku (cheaper) - limited thinking budget",
    liveNote: "Uses Opus/Sonnet - full capability",
  },
};

export function FounderModeToggle() {
  const { user } = useAuth();
  const [modes, setModes] = useState<ServiceModes>({
    stripe: "test",
    dataforseo: "test",
    semrush: "test",
    ai: "test",
  });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status and fetch current modes
  useEffect(() => {
    async function fetchModes() {
      try {
        const response = await fetch("/api/founder/platform-mode");
        const data = await response.json();

        if (data.error) {
          setError(data.error);
          setIsAdmin(false);
          return;
        }

        setModes(data.modes);
        setIsAdmin(data.isAdmin);
      } catch (err) {
        setError("Failed to fetch platform modes");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchModes();
    }
  }, [user]);

  async function toggleMode(service: keyof ServiceModes) {
    if (!isAdmin || updating) {
return;
}

    const newMode = modes[service] === "test" ? "live" : "test";

    // Confirm before switching to live
    if (newMode === "live") {
      const confirmed = window.confirm(
        `Are you sure you want to switch ${SERVICE_INFO[service].name} to LIVE mode?\n\n${SERVICE_INFO[service].liveNote}`
      );
      if (!confirmed) {
return;
}
    }

    setUpdating(service);
    setError(null);

    try {
      const response = await fetch("/api/founder/platform-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, mode: newMode }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setModes((prev) => ({ ...prev, [service]: newMode }));
    } catch (err) {
      setError(`Failed to update ${service} mode`);
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-2xl mx-auto border-destructive">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            This panel is only accessible to platform administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Founder Mode Controls
          <Badge variant="outline" className="ml-2">
            Admin Only
          </Badge>
        </CardTitle>
        <CardDescription>
          Toggle between TEST and LIVE modes for each service. Changes take effect immediately.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {error}
          </div>
        )}

        {(Object.keys(SERVICE_INFO) as Array<keyof ServiceModes>).map((service) => {
          const info = SERVICE_INFO[service];
          const Icon = info.icon;
          const isLive = modes[service] === "live";
          const isUpdating = updating === service;

          return (
            <div
              key={service}
              className={`p-4 rounded-lg border-2 transition-colors ${
                isLive
                  ? "border-destructive bg-destructive/5"
                  : "border-muted bg-muted/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isLive ? "bg-destructive/20" : "bg-primary/10"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${
                        isLive ? "text-destructive" : "text-primary"
                      }`}
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold flex items-center gap-2">
                      {info.name}
                      <Badge
                        variant={isLive ? "destructive" : "secondary"}
                        className="text-xs"
                      >
                        {isLive ? "LIVE" : "TEST"}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {info.description}
                    </p>
                    <p
                      className={`text-xs mt-2 flex items-center gap-1 ${
                        isLive ? "text-destructive" : "text-muted-foreground"
                      }`}
                    >
                      {isLive ? (
                        <AlertTriangle className="h-3 w-3" />
                      ) : (
                        <CheckCircle className="h-3 w-3" />
                      )}
                      {isLive ? info.liveNote : info.testNote}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUpdating && (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  <Switch
                    checked={isLive}
                    onCheckedChange={() => toggleMode(service)}
                    disabled={isUpdating || !isAdmin}
                    className={isLive ? "data-[state=checked]:bg-destructive" : ""}
                  />
                </div>
              </div>
            </div>
          );
        })}

        <div className="pt-4 border-t text-xs text-muted-foreground">
          <p>
            <strong>Note:</strong> Mode changes are logged in the audit trail. All team members
            will see the current modes reflected in their dashboards.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
