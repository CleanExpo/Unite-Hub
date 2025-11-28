"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIConsultationPanel } from "@/components/ai/AIConsultationPanel";
import { Loader2, Plus, MessageSquare, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Consultation {
  id: string;
  title: string | null;
  status: "active" | "closed";
  explanation_mode: string;
  created_at: string;
}

export default function ClientAIConsultingPage() {
  const { toast } = useToast();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [activeConsultation, setActiveConsultation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadConsultations();
  }, []);

  async function loadConsultations() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai-consultations");
      if (!res.ok) throw new Error("Failed to load consultations");
      const data = await res.json();
      setConsultations(data);

      // Auto-select first active consultation
      const active = data.find((c: Consultation) => c.status === "active");
      if (active) {
        setActiveConsultation(active.id);
      }
    } catch (error) {
      console.error("Failed to load consultations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createConsultation() {
    setCreating(true);
    try {
      // TODO: Get business_id from context/session
      const res = await fetch("/api/ai-consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_id: "placeholder-business-id", // Replace with actual business_id
          title: `Strategy Session ${new Date().toLocaleDateString()}`,
          explanation_mode: "founder",
        }),
      });

      if (!res.ok) throw new Error("Failed to create consultation");

      const consultation = await res.json();
      setConsultations((prev) => [consultation, ...prev]);
      setActiveConsultation(consultation.id);

      toast({
        title: "New Session Created",
        description: "Your AI strategy session is ready.",
      });
    } catch (error) {
      console.error("Failed to create consultation:", error);
      toast({
        title: "Error",
        description: "Failed to create consultation session",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            AI Strategy & Clarity Sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Use your AI credits to talk with AI Phill about your strategy, SEO,
            Boost Bump options, Blue Ocean moves, risks and next steps. All
            conversations stay inside your dashboard.
          </p>
        </div>
        <Button onClick={createConsultation} disabled={creating}>
          {creating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Session List */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Your Sessions
          </h3>
          {consultations.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                No sessions yet. Start a new one!
              </CardContent>
            </Card>
          ) : (
            consultations.map((c) => (
              <Card
                key={c.id}
                className={`cursor-pointer transition-colors ${
                  activeConsultation === c.id
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => setActiveConsultation(c.id)}
              >
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {c.title || "Strategy Session"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {c.status === "active" ? (
                      <span className="w-2 h-2 rounded-full bg-green-500" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-3">
          {activeConsultation ? (
            <div className="h-[600px]">
              <AIConsultationPanel
                consultationId={activeConsultation}
                initialMode="founder"
              />
            </div>
          ) : (
            <Card className="h-[600px] flex items-center justify-center">
              <CardContent className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">
                  Select a session or create a new one to start chatting with AI
                  Phill.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
