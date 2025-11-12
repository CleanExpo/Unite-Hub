"use client";

import React from "react";
import {
  Users,
  User,
  MapPin,
  DollarSign,
  Briefcase,
  GraduationCap,
  Heart,
  Target,
  TrendingUp,
  ShoppingCart,
  MessageSquare,
  Shield,
  Calendar,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Persona {
  _id: string;
  personaName: string;
  demographics: {
    ageRange?: string;
    gender?: string;
    location?: string;
    income?: string;
    education?: string;
    occupation?: string;
  };
  psychographics: {
    values: string[];
    interests: string[];
    lifestyle?: string;
    personality?: string;
  };
  painPoints: string[];
  goals: string[];
  buyingBehavior: {
    motivations: string[];
    barriers: string[];
    decisionFactors: string[];
  };
  communicationPreferences: string[];
  competitiveAwareness?: string;
  decisionMakingProcess?: string;
  version: number;
  isPrimary: boolean;
  createdAt: number;
  updatedAt: number;
}

interface PersonaDetailProps {
  persona: Persona;
  onClose?: () => void;
}

export function PersonaDetail({ persona, onClose }: PersonaDetailProps) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 mb-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full">
              <Users className="h-10 w-10" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">{persona.personaName}</h1>
              <div className="flex items-center gap-2">
                {persona.isPrimary && (
                  <Badge className="bg-white/20 text-white border-white/40">
                    Primary Persona
                  </Badge>
                )}
                <Badge className="bg-white/20 text-white border-white/40">
                  Version {persona.version}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Demographics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {persona.demographics.ageRange && (
            <InfoCard icon={Calendar} label="Age Range" value={persona.demographics.ageRange} />
          )}
          {persona.demographics.gender && (
            <InfoCard icon={User} label="Gender" value={persona.demographics.gender} />
          )}
          {persona.demographics.location && (
            <InfoCard icon={MapPin} label="Location" value={persona.demographics.location} />
          )}
          {persona.demographics.income && (
            <InfoCard icon={DollarSign} label="Income" value={persona.demographics.income} />
          )}
          {persona.demographics.occupation && (
            <InfoCard icon={Briefcase} label="Occupation" value={persona.demographics.occupation} />
          )}
          {persona.demographics.education && (
            <InfoCard icon={GraduationCap} label="Education" value={persona.demographics.education} />
          )}
        </div>
      </div>

      {/* Psychographics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-purple-600" />
          Psychographics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Values</h3>
            <div className="flex flex-wrap gap-2">
              {persona.psychographics.values.map((value, index) => (
                <Badge key={index} variant="secondary">
                  {value}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {persona.psychographics.interests.map((interest, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-700">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {persona.psychographics.lifestyle && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Lifestyle</h3>
            <p className="text-gray-600">{persona.psychographics.lifestyle}</p>
          </div>
        )}
        {persona.psychographics.personality && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-2">Personality</h3>
            <p className="text-gray-600">{persona.psychographics.personality}</p>
          </div>
        )}
      </div>

      {/* Pain Points & Goals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-red-600" />
            Pain Points
          </h2>
          <ul className="space-y-3">
            {persona.painPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-red-600 font-bold mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Goals
          </h2>
          <ul className="space-y-3">
            {persona.goals.map((goal, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-700">
                <span className="text-green-600 font-bold mt-0.5">•</span>
                <span>{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Buying Behavior */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-orange-600" />
          Buying Behavior
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Motivations</h3>
            <ul className="space-y-2">
              {persona.buyingBehavior.motivations.map((motivation, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  {motivation}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Barriers</h3>
            <ul className="space-y-2">
              {persona.buyingBehavior.barriers.map((barrier, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-red-600">✗</span>
                  {barrier}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Decision Factors</h3>
            <ul className="space-y-2">
              {persona.buyingBehavior.decisionFactors.map((factor, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-600">→</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Communication & Decision Making */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Communication Preferences
          </h2>
          <div className="flex flex-wrap gap-2">
            {persona.communicationPreferences.map((pref, index) => (
              <Badge key={index} variant="outline">
                {pref}
              </Badge>
            ))}
          </div>
        </div>

        {persona.competitiveAwareness && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
              Competitive Awareness
            </h2>
            <p className="text-gray-700">{persona.competitiveAwareness}</p>
          </div>
        )}
      </div>

      {/* Decision Making Process */}
      {persona.decisionMakingProcess && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Decision Making Process
          </h2>
          <p className="text-gray-700">{persona.decisionMakingProcess}</p>
        </div>
      )}
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <div className="p-2 bg-white rounded-lg shadow-sm">
        <Icon className="h-5 w-5 text-gray-600" />
      </div>
      <div>
        <p className="text-xs text-gray-600">{label}</p>
        <p className="font-medium text-gray-900">{value}</p>
      </div>
    </div>
  );
}
