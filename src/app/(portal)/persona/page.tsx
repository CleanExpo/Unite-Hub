"use client";

import React, { useState } from "react";
import { PersonaCard } from "@/components/persona/PersonaCard";
import { PersonaDetail } from "@/components/persona/PersonaDetail";
import { PersonaHistory } from "@/components/persona/PersonaHistory";
import { Users, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PersonaPage() {
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>();
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");

  // TODO: Replace with actual Convex data
  const mockPersonas = [
    {
      _id: "1",
      personaName: "Tech-Savvy Professional",
      demographics: {
        ageRange: "30-45",
        gender: "All",
        location: "Urban Areas",
        income: "$75,000-$150,000",
        occupation: "IT Professionals, Managers",
      },
      psychographics: {
        values: ["Innovation", "Efficiency", "Growth"],
        interests: ["Technology", "Business", "Productivity"],
        lifestyle: "Fast-paced, career-focused",
        personality: "Analytical, ambitious, detail-oriented",
      },
      painPoints: [
        "Limited time for manual marketing tasks",
        "Difficulty tracking campaign performance",
        "Need for scalable marketing solutions",
      ],
      goals: [
        "Automate repetitive marketing tasks",
        "Improve ROI on marketing spend",
        "Scale business without increasing overhead",
      ],
      buyingBehavior: {
        motivations: ["Time savings", "ROI improvement", "Scalability"],
        barriers: ["Budget constraints", "Learning curve concerns"],
        decisionFactors: ["Features", "Pricing", "Customer support"],
      },
      communicationPreferences: ["Email", "LinkedIn", "Professional networks"],
      competitiveAwareness:
        "Aware of major players but seeks personalized solutions",
      decisionMakingProcess: "Research-heavy, seeks demos and trials",
      version: 1,
      isPrimary: true,
      isActive: true,
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000,
      generatedFromEmails: [],
    },
  ];

  const selectedPersona = mockPersonas.find((p) => p._id === selectedPersonaId);

  return (
    <div className="space-y-6">
      {viewMode === "list" ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customer Personas</h1>
              <p className="text-gray-600 mt-1">
                AI-generated insights about your target audience
              </p>
            </div>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2">
              <Sparkles className="h-5 w-5" />
              Regenerate Personas
            </Button>
          </div>

          <Tabs defaultValue="current">
            <TabsList>
              <TabsTrigger value="current">Current Personas</TabsTrigger>
              <TabsTrigger value="history">Version History</TabsTrigger>
            </TabsList>

            <TabsContent value="current" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {mockPersonas.map((persona) => (
                  <PersonaCard
                    key={persona._id}
                    persona={persona}
                    onView={(id) => {
                      setSelectedPersonaId(id);
                      setViewMode("detail");
                    }}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <PersonaHistory
                versions={mockPersonas}
                onViewVersion={(id) => {
                  setSelectedPersonaId(id);
                  setViewMode("detail");
                }}
                onRestoreVersion={(id) => console.log("Restore:", id)}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <>
          <Button
            onClick={() => setViewMode("list")}
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Personas
          </Button>
          {selectedPersona && <PersonaDetail persona={selectedPersona} />}
        </>
      )}
    </div>
  );
}
