"use client";

/**
 * GeoRadiusMap Component
 * Phase 7 Week 19: GEO Onboarding UI
 *
 * Interactive map visualization showing service radius.
 * Uses Google Maps API with radius overlay.
 */

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";

interface GeoRadiusMapProps {
  center?: { lat: number; lng: number };
  radius: number; // in kilometers
  height?: number;
}

export default function GeoRadiusMap({
  center = { lat: -27.4698, lng: 153.0251 }, // Default: Brisbane
  radius,
  height = 400,
}: GeoRadiusMapProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const mapRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    // In production, this would initialize Google Maps API
    // For now, we'll show a placeholder
    if (!isLoading && mapRef.current) {
      initializeMap();
    }
  }, [isLoading, center, radius]);

  const initializeMap = async () => {
    // TODO: Integrate Google Maps JavaScript API
    // https://developers.google.com/maps/documentation/javascript/overview

    // Example initialization code (commented out until API key is added):
    /*
    const { Map } = await google.maps.importLibrary("maps");
    const { Circle } = await google.maps.importLibrary("maps");

    const map = new Map(mapRef.current, {
      center: center,
      zoom: getZoomLevel(radius),
      mapTypeId: "roadmap",
    });

    // Draw radius circle
    new Circle({
      strokeColor: "#FF0000",
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.15,
      map,
      center: center,
      radius: radius * 1000, // Convert km to meters
    });
    */
  };

  const getZoomLevel = (radius: number): number => {
    // Approximate zoom levels for different radii
    if (radius <= 3) return 14;
    if (radius <= 5) return 13;
    if (radius <= 10) return 12;
    if (radius <= 20) return 11;
    if (radius <= 50) return 10;
    return 9;
  };

  if (isLoading) {
    return (
      <Card className="w-full" style={{ height }}>
        <CardContent className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0 relative" style={{ height }}>
        {/* Map Container */}
        <div
          ref={mapRef}
          className="w-full h-full bg-muted"
        >
          {/* Placeholder Map (remove when Google Maps API is integrated) */}
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-green-100 dark:from-blue-950 dark:to-green-950">
            <div className="text-center space-y-4">
              <div className="relative">
                <MapPin className="h-16 w-16 text-primary mx-auto" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl"></div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold">Service Radius: {radius} km</p>
                <p className="text-sm text-muted-foreground">
                  Center: {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground mt-4">
                  Google Maps integration ready for API key
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Radius Info Overlay */}
        <div className="absolute top-4 left-4 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Service Radius</p>
              <p className="text-lg font-bold">{radius} km</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
