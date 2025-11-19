"use client";

/**
 * GeoBusinessTypeStep - Step 1 of GEO Onboarding
 * Phase 7 Week 19: GEO Onboarding UI
 *
 * User selects their business type to auto-assign recommended radius and cost multipliers.
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { InfoIcon, Building2, Wrench, Briefcase, Flame, Globe } from "lucide-react";

export type BusinessType =
  | "coffee_shop"
  | "trade_business"
  | "professional_service"
  | "restoration_service"
  | "online_service";

interface BusinessTypeOption {
  value: BusinessType;
  label: string;
  icon: React.ReactNode;
  description: string;
  recommendedRadius: number;
  examples: string[];
}

const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    value: "coffee_shop",
    label: "Coffee Shop & Hospitality",
    icon: <Building2 className="h-5 w-5" />,
    description: "Walk-in customers within immediate vicinity",
    recommendedRadius: 3,
    examples: ["Cafes", "Restaurants", "Retail stores", "Gyms"],
  },
  {
    value: "trade_business",
    label: "Trade Services",
    icon: <Wrench className="h-5 w-5" />,
    description: "Local service calls within city/region",
    recommendedRadius: 10,
    examples: ["Plumbers", "Electricians", "Carpenters", "HVAC"],
  },
  {
    value: "professional_service",
    label: "Professional Services",
    icon: <Briefcase className="h-5 w-5" />,
    description: "Regional service area covering multiple suburbs",
    recommendedRadius: 20,
    examples: ["Accounting", "Legal", "Consulting", "Real estate"],
  },
  {
    value: "restoration_service",
    label: "Restoration & Emergency Services",
    icon: <Flame className="h-5 w-5" />,
    description: "Wide coverage area for emergency response",
    recommendedRadius: 50,
    examples: ["Fire restoration", "Flood damage", "Disaster recovery", "24/7 emergency"],
  },
  {
    value: "online_service",
    label: "Online / Service Area Business",
    icon: <Globe className="h-5 w-5" />,
    description: "Nationwide or statewide service delivery",
    recommendedRadius: 50,
    examples: ["E-commerce", "Remote consulting", "Digital services", "Delivery"],
  },
];

interface GeoBusinessTypeStepProps {
  selectedType?: BusinessType;
  onSelect: (type: BusinessType, recommendedRadius: number) => void;
  onNext: () => void;
}

export default function GeoBusinessTypeStep({
  selectedType,
  onSelect,
  onNext,
}: GeoBusinessTypeStepProps) {
  const [localType, setLocalType] = React.useState<BusinessType | undefined>(selectedType);

  const handleTypeChange = (value: string) => {
    const type = value as BusinessType;
    const option = BUSINESS_TYPES.find((t) => t.value === type);
    if (option) {
      setLocalType(type);
      onSelect(type, option.recommendedRadius);
    }
  };

  const selectedOption = BUSINESS_TYPES.find((t) => t.value === localType);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Select Your Business Type</h2>
        <p className="text-muted-foreground">
          We'll recommend an optimal service area radius based on your industry
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Type</CardTitle>
          <CardDescription>
            Choose the category that best describes your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="business-type">Your Business Category</Label>
            <Select value={localType} onValueChange={handleTypeChange}>
              <SelectTrigger id="business-type">
                <SelectValue placeholder="Select a business type..." />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      {type.icon}
                      <span>{type.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOption && (
            <Card className="border-2 border-primary/20 bg-primary/5">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{selectedOption.icon}</div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg">{selectedOption.label}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedOption.description}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg bg-background p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <InfoIcon className="h-4 w-4 text-primary" />
                    <span>Recommended Service Radius</span>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {selectedOption.recommendedRadius} km
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This radius balances visibility with cost-effectiveness for your industry
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Common business types:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedOption.examples.map((example, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 rounded-full bg-background text-xs font-medium"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={onNext}
          disabled={!localType}
          className="min-w-[150px]"
        >
          Next: Choose Radius →
        </Button>
      </div>
    </div>
  );
}
