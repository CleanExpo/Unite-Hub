"use client";

import React from "react";
import { Users, Star, Eye, TrendingUp, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Persona {
  _id: string;
  personaName: string;
  demographics: {
    ageRange?: string;
    gender?: string;
    location?: string;
    income?: string;
    occupation?: string;
  };
  painPoints: string[];
  goals: string[];
  isPrimary: boolean;
  isActive: boolean;
  version: number;
}

interface PersonaCardProps {
  persona: Persona;
  onView: (personaId: string) => void;
  onClick?: () => void;
  isSelected?: boolean;
}

export function PersonaCard({
  persona,
  onView,
  onClick,
  isSelected,
}: PersonaCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer",
        isSelected && "ring-2 ring-blue-500 border-blue-500"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full">
            <Users className="h-6 w-6 text-purple-700" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{persona.personaName}</h3>
            <div className="flex items-center gap-2 mt-1">
              {persona.isPrimary && (
                <Badge variant="secondary" className="gap-1">
                  <Star className="h-3 w-3" />
                  Primary
                </Badge>
              )}
              <Badge variant="outline">v{persona.version}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics Summary */}
      <div className="space-y-2 mb-4">
        {persona.demographics.ageRange && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Age:</span>
            <span className="font-medium text-gray-900">
              {persona.demographics.ageRange}
            </span>
          </div>
        )}
        {persona.demographics.occupation && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Occupation:</span>
            <span className="font-medium text-gray-900">
              {persona.demographics.occupation}
            </span>
          </div>
        )}
        {persona.demographics.location && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium text-gray-900">
              {persona.demographics.location}
            </span>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-red-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-gray-700">Pain Points</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {persona.painPoints.length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-gray-700">Goals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{persona.goals.length}</p>
        </div>
      </div>

      {/* Top Pain Points Preview */}
      {persona.painPoints.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-700 mb-2">Top Pain Points:</p>
          <ul className="space-y-1">
            {persona.painPoints.slice(0, 2).map((point, index) => (
              <li key={index} className="text-sm text-gray-600 line-clamp-1">
                • {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action */}
      <Button
        onClick={(e) => {
          e.stopPropagation();
          onView(persona._id);
        }}
        variant="outline"
        className="w-full gap-2"
      >
        <Eye className="h-4 w-4" />
        View Full Persona
      </Button>
    </div>
  );
}
