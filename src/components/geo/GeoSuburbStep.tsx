"use client";

/**
 * GeoSuburbStep - Step 3 of GEO Onboarding
 * Phase 7 Week 19: GEO Onboarding UI
 *
 * System pulls all suburbs in radius via GEO engine.
 * User can remove undesirable suburbs and confirm target list.
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, MapPin, Search, X, CheckCircle2 } from "lucide-react";

interface Suburb {
  name: string;
  postcode?: string;
  distance: number;
  opportunityScore?: number;
}

interface GeoSuburbStepProps {
  clientId: string;
  radius: number;
  onConfirm: (selectedSuburbs: string[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export default function GeoSuburbStep({
  clientId,
  radius,
  onConfirm,
  onBack,
  isLoading = false,
}: GeoSuburbStepProps) {
  const [suburbs, setSuburbs] = React.useState<Suburb[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedSuburbs, setSelectedSuburbs] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState("");

  // Fetch suburbs on mount
  React.useEffect(() => {
    fetchSuburbs();
  }, [clientId, radius]);

  const fetchSuburbs = async () => {
    setLoading(true);
    try {
      // In production, this would call the GEO targeting API
      // For now, we'll simulate with mock data
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock suburb data based on radius
      const mockSuburbs = generateMockSuburbs(radius);
      setSuburbs(mockSuburbs);

      // Select all by default
      setSelectedSuburbs(new Set(mockSuburbs.map((s) => s.name)));
    } catch (error) {
      console.error("Failed to fetch suburbs:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSuburbs = (radius: number): Suburb[] => {
    const suburbNames = [
      "Brisbane CBD",
      "South Brisbane",
      "West End",
      "Fortitude Valley",
      "New Farm",
      "Paddington",
      "Red Hill",
      "Spring Hill",
      "Kangaroo Point",
      "East Brisbane",
      "Woolloongabba",
      "Greenslopes",
      "Stones Corner",
      "Annerley",
      "Fairfield",
      "Yeronga",
      "Tarragindi",
      "Holland Park",
      "Camp Hill",
      "Coorparoo",
    ];

    const count = radius <= 5 ? 10 : radius <= 10 ? 15 : 20;
    return suburbNames.slice(0, count).map((name, index) => ({
      name,
      postcode: `40${10 + index}`,
      distance: Math.round((radius / count) * (index + 1) * 10) / 10,
      opportunityScore: Math.floor(Math.random() * 100),
    }));
  };

  const handleToggleSuburb = (suburbName: string) => {
    const newSelected = new Set(selectedSuburbs);
    if (newSelected.has(suburbName)) {
      newSelected.delete(suburbName);
    } else {
      newSelected.add(suburbName);
    }
    setSelectedSuburbs(newSelected);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredSuburbs();
    setSelectedSuburbs(new Set(filtered.map((s) => s.name)));
  };

  const handleDeselectAll = () => {
    setSelectedSuburbs(new Set());
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedSuburbs));
  };

  const getFilteredSuburbs = () => {
    if (!searchQuery) {
return suburbs;
}
    const query = searchQuery.toLowerCase();
    return suburbs.filter(
      (suburb) =>
        suburb.name.toLowerCase().includes(query) ||
        suburb.postcode?.includes(query)
    );
  };

  const filteredSuburbs = getFilteredSuburbs();
  const selectedCount = selectedSuburbs.size;
  const totalCount = suburbs.length;

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Discovering Suburbs</h2>
          <p className="text-muted-foreground">
            Finding all suburbs within {radius} km radius...
          </p>
        </div>
        <Card>
          <CardContent className="pt-20 pb-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">
              Analyzing service area and identifying target suburbs...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Confirm Target Suburbs</h2>
        <p className="text-muted-foreground">
          Select or deselect suburbs where you want to appear in local search results
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Suburbs Within {radius} km</CardTitle>
              <CardDescription>
                {selectedCount} of {totalCount} suburbs selected
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg">
              <MapPin className="h-4 w-4 mr-1" />
              {radius} km
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Actions */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search suburbs or postcodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </div>

          {/* Suburb List */}
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-2">
              {filteredSuburbs.map((suburb) => (
                <div
                  key={suburb.name}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Checkbox
                      id={suburb.name}
                      checked={selectedSuburbs.has(suburb.name)}
                      onCheckedChange={() => handleToggleSuburb(suburb.name)}
                    />
                    <label
                      htmlFor={suburb.name}
                      className="flex items-center gap-3 cursor-pointer flex-1"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{suburb.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {suburb.postcode && `${suburb.postcode} • `}
                          {suburb.distance.toFixed(1)} km away
                        </p>
                      </div>
                      {suburb.opportunityScore !== undefined && (
                        <Badge
                          variant={
                            suburb.opportunityScore >= 70
                              ? "default"
                              : suburb.opportunityScore >= 40
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {suburb.opportunityScore}% opportunity
                        </Badge>
                      )}
                    </label>
                  </div>
                </div>
              ))}

              {filteredSuburbs.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No suburbs found matching "{searchQuery}"</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Summary */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="font-semibold">
                    {selectedCount} suburbs selected for local SEO targeting
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your business will appear in local search results for these suburbs. You can
                    adjust this list anytime in settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" size="lg" onClick={onBack} className="min-w-[150px]">
          ← Back
        </Button>
        <Button
          size="lg"
          onClick={handleConfirm}
          disabled={selectedCount === 0 || isLoading}
          className="min-w-[150px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Finish Setup"
          )}
        </Button>
      </div>
    </div>
  );
}
