/**
 * Trusted Mode Wizard Component - Phase 9
 *
 * Multi-step wizard for Trusted Mode onboarding.
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Globe,
  FileText,
  Settings,
  Lock,
} from "lucide-react";

interface TrustedModeWizardProps {
  clientId: string;
  clientName: string;
  clientDomain: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

type WizardStep =
  | "intro"
  | "identity"
  | "ownership"
  | "consent"
  | "scopes"
  | "backup"
  | "review";

interface StepConfig {
  key: WizardStep;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const STEPS: StepConfig[] = [
  {
    key: "intro",
    title: "Introduction",
    description: "Understand Trusted Mode",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    key: "identity",
    title: "Identity",
    description: "Verify business identity",
    icon: <FileText className="w-5 h-5" />,
  },
  {
    key: "ownership",
    title: "Ownership",
    description: "Verify website ownership",
    icon: <Globe className="w-5 h-5" />,
  },
  {
    key: "consent",
    title: "Consent",
    description: "Review and sign agreement",
    icon: <Lock className="w-5 h-5" />,
  },
  {
    key: "scopes",
    title: "Scopes",
    description: "Configure autonomy",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    key: "backup",
    title: "Backup",
    description: "Emergency settings",
    icon: <Shield className="w-5 h-5" />,
  },
  {
    key: "review",
    title: "Review",
    description: "Final confirmation",
    icon: <CheckCircle className="w-5 h-5" />,
  },
];

export function TrustedModeWizard({
  clientId,
  clientName,
  clientDomain,
  onComplete,
  onCancel,
}: TrustedModeWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("intro");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    // Identity
    abn: "",
    legalName: "",
    // Ownership
    verificationMethod: "GSC" as "GSC" | "DNS_TXT" | "HTML_FILE" | "MANUAL",
    gscPropertyId: "",
    verificationCode: "",
    // Backup
    restoreEmail: "",
    emergencyPhone: "",
    nightlyBackup: true,
    // Scopes
    seoEnabled: false,
    seoAutoFix: false,
    contentEnabled: false,
    contentAutoFaq: false,
    adsEnabled: false,
    adsDraftOnly: true,
    croEnabled: false,
    maxRiskLevel: "LOW" as "LOW" | "MEDIUM" | "HIGH",
    maxDailyActions: 10,
    // Consent
    consentAcknowledged: false,
    consentSigned: false,
  });

  const currentStepIndex = STEPS.findIndex((s) => s.key === currentStep);

  const handleNext = async () => {
    setError(null);

    switch (currentStep) {
      case "intro":
        setCurrentStep("identity");
        break;

      case "identity":
        if (!formData.abn || !formData.legalName) {
          setError("Please fill in all required fields");
          return;
        }
        setCurrentStep("ownership");
        break;

      case "ownership":
        setCurrentStep("consent");
        break;

      case "consent":
        if (!formData.consentAcknowledged) {
          setError("Please acknowledge the terms");
          return;
        }
        setCurrentStep("scopes");
        break;

      case "scopes":
        setCurrentStep("backup");
        break;

      case "backup":
        if (!formData.restoreEmail) {
          setError("Restore email is required");
          return;
        }
        setCurrentStep("review");
        break;

      case "review":
        await handleSubmit();
        break;
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].key);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      // In production, this would call the API endpoints sequentially
      // For now, simulate the flow

      // 1. Initialize
      const initResponse = await fetch("/api/trust/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          restore_email: formData.restoreEmail,
          emergency_phone: formData.emergencyPhone || undefined,
          nightly_backup_enabled: formData.nightlyBackup,
        }),
      });

      if (!initResponse.ok) {
        throw new Error("Failed to initialize Trusted Mode");
      }

      // 2. Configure scopes
      const scopesResponse = await fetch("/api/trust/configure-scopes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          seo_scope: {
            enabled: formData.seoEnabled,
            auto_fix_technical: formData.seoAutoFix,
          },
          content_scope: {
            enabled: formData.contentEnabled,
            auto_add_faq: formData.contentAutoFaq,
          },
          ads_scope: {
            enabled: formData.adsEnabled,
            draft_only: formData.adsDraftOnly,
          },
          cro_scope: {
            enabled: formData.croEnabled,
          },
          max_daily_actions: formData.maxDailyActions,
          max_risk_level_allowed: formData.maxRiskLevel,
        }),
      });

      if (!scopesResponse.ok) {
        throw new Error("Failed to configure scopes");
      }

      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "intro":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">
                What is Trusted Mode?
              </h3>
              <p className="text-muted-foreground">
                Trusted Mode enables autonomous SEO, Content, Ads, and CRO
                changes with strict safety rails.
              </p>
            </div>

            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Benefits</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• 24/7 autonomous optimization</li>
                    <li>• Instant response to issues</li>
                    <li>• Consistent improvements</li>
                    <li>• Full audit trail</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Safety Rails</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Risk-based change limits</li>
                    <li>• Automatic rollback</li>
                    <li>• Nightly backups</li>
                    <li>• Human oversight for high-risk changes</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "identity":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Business Identity</h3>
              <p className="text-sm text-muted-foreground">
                Verify your business identity for legal compliance.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="abn">ABN/ACN *</Label>
                <Input
                  id="abn"
                  placeholder="12 345 678 901"
                  value={formData.abn}
                  onChange={(e) =>
                    setFormData({ ...formData, abn: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Australian Business Number or Company Number
                </p>
              </div>

              <div>
                <Label htmlFor="legalName">Legal Business Name *</Label>
                <Input
                  id="legalName"
                  placeholder="Your Company Pty Ltd"
                  value={formData.legalName}
                  onChange={(e) =>
                    setFormData({ ...formData, legalName: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        );

      case "ownership":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Website Ownership</h3>
              <p className="text-sm text-muted-foreground">
                Verify you own {clientDomain}
              </p>
            </div>

            <Tabs
              value={formData.verificationMethod}
              onValueChange={(v) =>
                setFormData({
                  ...formData,
                  verificationMethod: v as any,
                })
              }
            >
              <TabsList className="grid grid-cols-4">
                <TabsTrigger value="GSC">GSC</TabsTrigger>
                <TabsTrigger value="DNS_TXT">DNS</TabsTrigger>
                <TabsTrigger value="HTML_FILE">HTML</TabsTrigger>
                <TabsTrigger value="MANUAL">Manual</TabsTrigger>
              </TabsList>

              <TabsContent value="GSC" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your Google Search Console property.
                </p>
                <Input
                  placeholder="sc-domain:example.com"
                  value={formData.gscPropertyId}
                  onChange={(e) =>
                    setFormData({ ...formData, gscPropertyId: e.target.value })
                  }
                />
              </TabsContent>

              <TabsContent value="DNS_TXT" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Add this TXT record to your DNS:
                </p>
                <code className="block p-2 bg-muted rounded text-sm">
                  unite-hub-verify={clientId.substring(0, 8)}
                </code>
                <Input
                  placeholder="Enter the TXT record value"
                  value={formData.verificationCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      verificationCode: e.target.value,
                    })
                  }
                />
              </TabsContent>

              <TabsContent value="HTML_FILE" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a verification file to your website root.
                </p>
                <Input
                  placeholder="Verification code from file"
                  value={formData.verificationCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      verificationCode: e.target.value,
                    })
                  }
                />
              </TabsContent>

              <TabsContent value="MANUAL" className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Request manual verification by our team.
                </p>
              </TabsContent>
            </Tabs>
          </div>
        );

      case "consent":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Legal Consent</h3>
              <p className="text-sm text-muted-foreground">
                Review and acknowledge the Trusted Mode agreement.
              </p>
            </div>

            <Card>
              <CardContent className="pt-4 max-h-64 overflow-y-auto text-sm">
                <h4 className="font-medium mb-2">Trusted Mode Agreement</h4>
                <p className="mb-4">
                  By enabling Trusted Mode, you authorize Unite-Hub to make
                  autonomous changes to your website's SEO, content, advertising,
                  and conversion optimization within the configured scope limits.
                </p>
                <h5 className="font-medium mb-1">Key Terms:</h5>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Changes are subject to configured risk limits</li>
                  <li>• All changes are logged and can be rolled back</li>
                  <li>• High-risk changes require human approval</li>
                  <li>• You can revoke access at any time</li>
                  <li>• Nightly backups are maintained for 30 days</li>
                </ul>
              </CardContent>
            </Card>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent"
                checked={formData.consentAcknowledged}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    consentAcknowledged: checked as boolean,
                  })
                }
              />
              <Label htmlFor="consent" className="text-sm">
                I have read and agree to the Trusted Mode terms
              </Label>
            </div>
          </div>
        );

      case "scopes":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Autonomy Scopes</h3>
              <p className="text-sm text-muted-foreground">
                Configure which domains can operate autonomously.
              </p>
            </div>

            <div className="grid gap-4">
              {/* SEO Scope */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.seoEnabled}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, seoEnabled: c as boolean })
                        }
                      />
                      <Label className="font-medium">SEO</Label>
                    </div>
                    <Badge variant={formData.seoEnabled ? "default" : "outline"}>
                      {formData.seoEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {formData.seoEnabled && (
                    <div className="ml-6 mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.seoAutoFix}
                          onCheckedChange={(c) =>
                            setFormData({ ...formData, seoAutoFix: c as boolean })
                          }
                        />
                        <Label className="text-sm">Auto-fix technical issues</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Content Scope */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.contentEnabled}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, contentEnabled: c as boolean })
                        }
                      />
                      <Label className="font-medium">Content</Label>
                    </div>
                    <Badge
                      variant={formData.contentEnabled ? "default" : "outline"}
                    >
                      {formData.contentEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {formData.contentEnabled && (
                    <div className="ml-6 mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.contentAutoFaq}
                          onCheckedChange={(c) =>
                            setFormData({
                              ...formData,
                              contentAutoFaq: c as boolean,
                            })
                          }
                        />
                        <Label className="text-sm">Auto-add FAQ sections</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ads Scope */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.adsEnabled}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, adsEnabled: c as boolean })
                        }
                      />
                      <Label className="font-medium">Ads</Label>
                    </div>
                    <Badge variant={formData.adsEnabled ? "default" : "outline"}>
                      {formData.adsEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  {formData.adsEnabled && (
                    <div className="ml-6 mt-2 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.adsDraftOnly}
                          onCheckedChange={(c) =>
                            setFormData({
                              ...formData,
                              adsDraftOnly: c as boolean,
                            })
                          }
                        />
                        <Label className="text-sm">Draft only (no auto-publish)</Label>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CRO Scope */}
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.croEnabled}
                        onCheckedChange={(c) =>
                          setFormData({ ...formData, croEnabled: c as boolean })
                        }
                      />
                      <Label className="font-medium">CRO</Label>
                    </div>
                    <Badge variant={formData.croEnabled ? "default" : "outline"}>
                      {formData.croEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Global Limits */}
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <h4 className="font-medium">Global Limits</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Max Risk Level</Label>
                      <select
                        className="w-full mt-1 p-2 border rounded"
                        value={formData.maxRiskLevel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxRiskLevel: e.target.value as any,
                          })
                        }
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                      </select>
                    </div>
                    <div>
                      <Label>Max Daily Actions</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={formData.maxDailyActions}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxDailyActions: parseInt(e.target.value) || 10,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case "backup":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Backup & Recovery</h3>
              <p className="text-sm text-muted-foreground">
                Configure emergency contacts and backup settings.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="restoreEmail">Restore Email *</Label>
                <Input
                  id="restoreEmail"
                  type="email"
                  placeholder="admin@example.com"
                  value={formData.restoreEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, restoreEmail: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Receive rollback notifications and emergency alerts
                </p>
              </div>

              <div>
                <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                <Input
                  id="emergencyPhone"
                  type="tel"
                  placeholder="+61 412 345 678"
                  value={formData.emergencyPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, emergencyPhone: e.target.value })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="nightlyBackup"
                  checked={formData.nightlyBackup}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      nightlyBackup: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="nightlyBackup">
                  Enable nightly backups (30-day retention)
                </Label>
              </div>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Review & Activate</h3>
              <p className="text-sm text-muted-foreground">
                Review your configuration before activating Trusted Mode.
              </p>
            </div>

            <div className="space-y-4">
              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Client</h4>
                  <p className="text-sm">{clientName}</p>
                  <p className="text-sm text-muted-foreground">{clientDomain}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Enabled Domains</h4>
                  <div className="flex flex-wrap gap-2">
                    {formData.seoEnabled && <Badge>SEO</Badge>}
                    {formData.contentEnabled && <Badge>Content</Badge>}
                    {formData.adsEnabled && <Badge>Ads</Badge>}
                    {formData.croEnabled && <Badge>CRO</Badge>}
                    {!formData.seoEnabled &&
                      !formData.contentEnabled &&
                      !formData.adsEnabled &&
                      !formData.croEnabled && (
                        <span className="text-sm text-muted-foreground">
                          None enabled
                        </span>
                      )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Limits</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-muted-foreground">Max Risk:</span>
                    <span>{formData.maxRiskLevel}</span>
                    <span className="text-muted-foreground">Daily Actions:</span>
                    <span>{formData.maxDailyActions}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <h4 className="font-medium mb-2">Emergency Contact</h4>
                  <p className="text-sm">{formData.restoreEmail}</p>
                  {formData.emergencyPhone && (
                    <p className="text-sm text-muted-foreground">
                      {formData.emergencyPhone}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {STEPS.map((step, index) => (
            <div
              key={step.key}
              className={`flex flex-col items-center ${
                index <= currentStepIndex
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index < currentStepIndex
                    ? "bg-primary text-primary-foreground"
                    : index === currentStepIndex
                    ? "border-2 border-primary"
                    : "border-2 border-muted"
                }`}
              >
                {index < currentStepIndex ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  step.icon
                )}
              </div>
              <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-muted rounded">
          <div
            className="h-full bg-primary rounded transition-all"
            style={{
              width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>{STEPS[currentStepIndex].title}</CardTitle>
          <CardDescription>
            {STEPS[currentStepIndex].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={currentStepIndex === 0 ? onCancel : handleBack}
          disabled={loading}
        >
          {currentStepIndex === 0 ? (
            "Cancel"
          ) : (
            <>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </>
          )}
        </Button>

        <Button onClick={handleNext} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : currentStep === "review" ? (
            <>
              Activate Trusted Mode
              <Shield className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
