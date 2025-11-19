"use client";

/**
 * GeoRadiusStep - Step 2 of GEO Onboarding
 * Phase 7 Week 19: GEO Onboarding UI
 *
 * User selects or confirms radius, sees dynamic cost multiplier and expanded suburb count.
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, DollarSign, MapPin, TrendingUp } from "lucide-react";

const RADIUS_OPTIONS = [3, 5, 10, 15, 20, 25, 50];

const COST_MULTIPLIERS: Record<number, number> = {
  3: 1.0,
  5: 1.1,
  10: 1.25,
  15: 1.4,
  20: 1.5,
  25: 1.7,
  50: 2.0,
};

// Estimated suburb counts per radius (Brisbane example)
const ESTIMATED_SUBURBS: Record<number, number> = {
  3: 5,
  5: 12,
  10: 45,
  15: 85,
  20: 140,
  25: 210,
  50: 450,
};

interface GeoRadiusStepProps {
  selectedRadius: number;
  onRadiusChange: (radius: number, costMultiplier: number) => void;
  onNext: () => void;
  onBack: () => void;
  tier: string;
}

export default function GeoRadiusStep({
  selectedRadius,
  onRadiusChange,
  onNext,
  onBack,
  tier,
}: GeoRadiusStepProps) {
  const [localRadius, setLocalRadius] = React.useState(selectedRadius);

  // Tier limits
  const tierLimits: Record<string, number[]> = {
    Free: [3, 5],
    Starter: [3, 5, 10],
    Pro: [3, 5, 10, 15, 20],
    Enterprise: [3, 5, 10, 15, 20, 25, 50],
  };

  const allowedRadii = tierLimits[tier] || [3, 5];
  const maxRadius = Math.max(...allowedRadii);
  const costMultiplier = COST_MULTIPLIERS[localRadius] || 1.0;
  const estimatedSuburbs = ESTIMATED_SUBURBS[localRadius] || 0;

  const handleRadiusChange = (values: number[]) => {
    const value = values[0];
    // Snap to nearest allowed radius
    const nearest = RADIUS_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );

    if (allowedRadii.includes(nearest)) {
      setLocalRadius(nearest);
      onRadiusChange(nearest, COST_MULTIPLIERS[nearest] || 1.0);
    }
  };

  const getRadiusColor = (radius: number) => {
    if (radius <= 5) return "text-green-600";
    if (radius <= 15) return "text-blue-600";
    if (radius <= 25) return "text-orange-600";
    return "text-red-600";
  };

  const getCostColor = (multiplier: number) => {
    if (multiplier <= 1.1) return "text-green-600";
    if (multiplier <= 1.4) return "text-blue-600";
    if (multiplier <= 1.7) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Choose Your Service Radius</h2>
        <p className="text-muted-foreground">
          Select the area where your business provides services
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Area Radius</CardTitle>
          <CardDescription>
            Larger radius = more suburbs covered = higher API costs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Radius Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Service Radius (km)</Label>
              <Badge variant="outline" className={`text-lg font-bold ${getRadiusColor(localRadius)}`}>
                {localRadius} km
              </Badge>
            </div>
            <Slider
              value={[localRadius]}
              onValueChange={handleRadiusChange}
              min={3}
              max={maxRadius}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3 km</span>
              <span>{maxRadius} km</span>
            </div>
          </div>

          {/* Tier Limit Warning */}
          {localRadius > maxRadius && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Radius Limited by {tier} Tier
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                      Upgrade to access larger service areas. Maximum radius for {tier}: {maxRadius} km
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cost Preview */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cost Multiplier</p>
                    <p className={`text-2xl font-bold ${getCostColor(costMultiplier)}`}>
                      {costMultiplier.toFixed(2)}x
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Your DataForSEO API calls will be multiplied by this factor
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-950">
                    <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated Suburbs</p>
                    <p className="text-2xl font-bold">~{estimatedSuburbs}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Approximate suburbs within {localRadius} km radius
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-950">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Cost</p>
                    <p className="text-2xl font-bold">
                      ${(costMultiplier * 15).toFixed(0)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Estimated monthly cost for regular audits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Radius Explanation */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-3">What does {localRadius} km cover?</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {localRadius <= 5 && (
                  <>
                    <li>• Perfect for walk-in businesses (cafes, retail)</li>
                    <li>• Covers immediate neighborhood</li>
                    <li>• Lowest cost option</li>
                  </>
                )}
                {localRadius > 5 && localRadius <= 15 && (
                  <>
                    <li>• Ideal for local service businesses</li>
                    <li>• Covers multiple suburbs in your city</li>
                    <li>• Balanced cost/coverage ratio</li>
                  </>
                )}
                {localRadius > 15 && localRadius <= 25 && (
                  <>
                    <li>• Regional service area coverage</li>
                    <li>• Covers major metropolitan regions</li>
                    <li>• Higher API call volume</li>
                  </>
                )}
                {localRadius > 25 && (
                  <>
                    <li>• Wide-area or emergency service coverage</li>
                    <li>• Covers entire cities or regions</li>
                    <li>• Maximum API call requirements</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" size="lg" onClick={onBack} className="min-w-[150px]">
          ← Back
        </Button>
        <Button size="lg" onClick={onNext} className="min-w-[150px]">
          Next: Select Suburbs →
        </Button>
      </div>
    </div>
  );
}
