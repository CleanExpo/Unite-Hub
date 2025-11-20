"use client";

/**
 * Operator Onboarding Wizard - Phase 10 Week 9
 *
 * Step-by-step wizard for onboarding new operators with roles, playbooks,
 * guardrails, and insights configuration.
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Book,
  Shield,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Rocket,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface OperatorOnboardingWizardProps {
  organizationId: string;
  operatorId: string;
  onComplete: () => void;
}

const STEPS: OnboardingStep[] = [
  {
    id: "role",
    title: "Set Your Role",
    description: "Define your operator role and permissions",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "playbooks",
    title: "Review Playbooks",
    description: "Understand the playbooks assigned to you",
    icon: <Book className="w-5 h-5" />,
  },
  {
    id: "guardrails",
    title: "Understand Guardrails",
    description: "Learn about safety guardrails and their actions",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: "insights",
    title: "Insights & Feedback",
    description: "How your performance is tracked and improved",
    icon: <BarChart3 className="w-5 h-5" />,
  },
];

export function OperatorOnboardingWizard({
  organizationId,
  operatorId,
  onComplete,
}: OperatorOnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [acknowledgedPlaybooks, setAcknowledgedPlaybooks] = useState(false);
  const [acknowledgedGuardrails, setAcknowledgedGuardrails] = useState(false);
  const [acknowledgedInsights, setAcknowledgedInsights] = useState(false);
  const [completing, setCompleting] = useState(false);

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (STEPS[currentStep].id) {
      case "role":
        return !!selectedRole;
      case "playbooks":
        return acknowledgedPlaybooks;
      case "guardrails":
        return acknowledgedGuardrails;
      case "insights":
        return acknowledgedInsights;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      // Save onboarding completion
      await fetch("/api/operator/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "complete_onboarding",
          organization_id: organizationId,
          role: selectedRole,
        }),
      });

      onComplete();
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
    } finally {
      setCompleting(false);
    }
  };

  const renderStepContent = () => {
    switch (STEPS[currentStep].id) {
      case "role":
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Your operator role determines your permissions and responsibilities
              in the review process.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Select Your Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Choose a role..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANALYST">Analyst</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="OWNER">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedRole && (
                <Card className="bg-muted">
                  <CardContent className="pt-4">
                    {selectedRole === "ANALYST" && (
                      <div>
                        <h4 className="font-semibold">Analyst Role</h4>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <li>• Comment on proposals and reviews</li>
                          <li>• Cannot vote on approvals</li>
                          <li>• Receive coaching hints</li>
                          <li>• Run sandbox simulations</li>
                        </ul>
                      </div>
                    )}
                    {selectedRole === "MANAGER" && (
                      <div>
                        <h4 className="font-semibold">Manager Role</h4>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <li>• Vote on approvals (weight: 2)</li>
                          <li>• Create and manage playbooks</li>
                          <li>• Assign playbooks to analysts</li>
                          <li>• View team insights and biases</li>
                        </ul>
                      </div>
                    )}
                    {selectedRole === "OWNER" && (
                      <div>
                        <h4 className="font-semibold">Owner Role</h4>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <li>• Override any decision (weight: 100)</li>
                          <li>• Configure autonomy levels</li>
                          <li>• Apply tuning recommendations</li>
                          <li>• Full access to all features</li>
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      case "playbooks":
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Playbooks define the procedures and rules you must follow when
              reviewing proposals.
            </p>

            <Card className="bg-muted">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">What are Playbooks?</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Playbooks contain rules that automatically guide your
                      decisions. They may require additional approvals, block
                      certain actions, or provide coaching tips.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <h4 className="font-semibold">Rule Actions</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Rules can: Allow, Block, Require Quorum, Simulate, Escalate,
                      or Coach. Always pay attention to coaching hints!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ack-playbooks"
                checked={acknowledgedPlaybooks}
                onCheckedChange={(checked) =>
                  setAcknowledgedPlaybooks(checked === true)
                }
              />
              <label htmlFor="ack-playbooks" className="text-sm">
                I understand that I must follow the playbooks assigned to me
              </label>
            </div>
          </div>
        );

      case "guardrails":
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Guardrails are safety mechanisms that protect against risky
              decisions.
            </p>

            <div className="space-y-3">
              <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-red-100 text-red-800">BLOCK</Badge>
                    <span className="font-semibold">Blocked Actions</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Some actions are completely blocked based on conditions like
                    low operator score or high risk level.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-orange-100 text-orange-800">
                      REQUIRE_QUORUM
                    </Badge>
                    <span className="font-semibold">Quorum Required</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Some decisions require multiple approvers before proceeding.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-blue-100 text-blue-800">SIMULATE</Badge>
                    <span className="font-semibold">Sandbox Only</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Some actions must be tested in sandbox mode before real
                    execution.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ack-guardrails"
                checked={acknowledgedGuardrails}
                onCheckedChange={(checked) =>
                  setAcknowledgedGuardrails(checked === true)
                }
              />
              <label htmlFor="ack-guardrails" className="text-sm">
                I understand guardrails are in place for safety and will respect
                them
              </label>
            </div>
          </div>
        );

      case "insights":
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Your performance is tracked to help you improve and to tune the
              system&apos;s autonomy levels.
            </p>

            <Card className="bg-muted">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h4 className="font-semibold">Performance Metrics</h4>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>
                      • <strong>Accuracy Score</strong>: % of correct decisions
                    </li>
                    <li>
                      • <strong>Speed Score</strong>: Review efficiency
                    </li>
                    <li>
                      • <strong>Consistency Score</strong>: Decision variance
                    </li>
                    <li>
                      • <strong>Reliability Score</strong>: Weighted composite
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold">Bias Detection</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    The system monitors for potential biases like over-approving,
                    rushing reviews, or inconsistent criteria application.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold">Continuous Improvement</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your feedback and outcomes are used to tune the system&apos;s
                    autonomy levels for better decisions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center gap-2">
              <Checkbox
                id="ack-insights"
                checked={acknowledgedInsights}
                onCheckedChange={(checked) =>
                  setAcknowledgedInsights(checked === true)
                }
              />
              <label htmlFor="ack-insights" className="text-sm">
                I understand my performance is tracked and will strive for
                accuracy
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="w-5 h-5" />
          Operator Onboarding
        </CardTitle>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step indicators */}
        <div className="flex justify-between">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                index <= currentStep
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStep
                    ? "bg-primary text-primary-foreground"
                    : index === currentStep
                    ? "border-2 border-primary"
                    : "border border-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.icon
                )}
              </div>
              <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>

        {/* Current step content */}
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {STEPS[currentStep].icon}
            {STEPS[currentStep].title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {STEPS[currentStep].description}
          </p>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || completing}
            >
              {completing ? "Completing..." : "Complete Setup"}
              <CheckCircle className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default OperatorOnboardingWizard;
