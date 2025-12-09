"use client";

import React, { useState, useEffect } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Mail,
  Upload,
  Users,
  Rocket,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

export function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const { currentStep, completionPercentage, completeStep, skipOnboarding, goToStep } = useOnboarding();
  const { user, profile, refreshProfile } = useAuth();
  const router = useRouter();

  // Step 1 state
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Step 2 state
  const [selectedProvider, setSelectedProvider] = useState<"gmail" | "outlook" | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  // Step 3 state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [contactsFound, setContactsFound] = useState(0);

  // Step 4 state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Step 5 state
  const [tourStep, setTourStep] = useState(0);

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with existing profile data
  useEffect(() => {
    if (profile) {
      setBusinessName(profile.business_name || "");
      setPhone(profile.phone || "");
      setTimezone(profile.timezone || "America/New_York");
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Step 1: Profile Setup
  const handleStep1Complete = async () => {
    if (!user) {
return;
}
    setIsSubmitting(true);

    try {
      let avatarUrl = profile?.avatar_url || null;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from("public")
          .upload(filePath, avatarFile);

        if (uploadError) {
throw uploadError;
}

        const { data: urlData } = supabaseBrowser.storage
          .from("public")
          .getPublicUrl(filePath);

        avatarUrl = urlData.publicUrl;
      }

      // Update user profile
      const { error } = await supabaseBrowser
        .from("user_profiles")
        .update({
          business_name: businessName,
          phone,
          timezone,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (error) {
throw error;
}

      await refreshProfile();
      await completeStep(1, { business_name: businessName, phone, timezone });
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Connect Integration
  const handleIntegrationConnect = async (provider: "gmail" | "outlook") => {
    setIsConnecting(true);
    setSelectedProvider(provider);

    try {
      if (provider === "gmail") {
        // Open Gmail OAuth in popup
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          "/api/integrations/gmail/auth",
          "Gmail OAuth",
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Poll for popup close
        const pollTimer = setInterval(() => {
          if (popup?.closed) {
            clearInterval(pollTimer);
            // Check if connection was successful
            checkIntegrationStatus();
          }
        }, 500);
      } else {
        // Outlook integration (to be implemented)
        alert("Outlook integration coming soon!");
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Error connecting integration:", error);
      setIsConnecting(false);
    }
  };

  const checkIntegrationStatus = async () => {
    try {
      const { data, error } = await supabaseBrowser
        .from("integrations")
        .select("*")
        .eq("user_id", user?.id)
        .eq("provider", "gmail")
        .maybeSingle();

      if (data && data.is_active) {
        setConnectionSuccess(true);
        setIsConnecting(false);
        // Auto-advance after 2 seconds
        setTimeout(() => {
          handleStep2Complete();
        }, 2000);
      } else {
        setIsConnecting(false);
      }
    } catch (error) {
      console.error("Error checking integration status:", error);
      setIsConnecting(false);
    }
  };

  const handleStep2Complete = async () => {
    await completeStep(2, { integration_provider: selectedProvider });
  };

  // Step 3: Import Contacts
  const handleStep3Start = async () => {
    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Simulate sync progress
      const interval = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);

      // Trigger actual sync
      const response = await fetch("/api/integrations/gmail/sync", {
        method: "POST",
      });

      if (!response.ok) {
throw new Error("Sync failed");
}

      const result = await response.json();
      setContactsFound(result.contactsCount || 0);

      // Wait for progress to complete
      setTimeout(() => {
        setIsSyncing(false);
      }, 5000);
    } catch (error) {
      console.error("Error syncing contacts:", error);
      setIsSyncing(false);
    }
  };

  const handleStep3Complete = async () => {
    await completeStep(3, { contacts_imported: contactsFound });
  };

  // Step 4: Create Campaign (Optional)
  const handleStep4Complete = async () => {
    if (selectedTemplate) {
      // Create campaign from template
      try {
        const response = await fetch("/api/campaigns/from-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template: selectedTemplate }),
        });

        if (!response.ok) {
throw new Error("Failed to create campaign");
}

        await completeStep(4, { campaign_template: selectedTemplate });
      } catch (error) {
        console.error("Error creating campaign:", error);
      }
    } else {
      // Skip campaign creation
      await goToStep(5);
    }
  };

  // Step 5: Dashboard Tour
  const handleStep5Complete = async () => {
    await completeStep(5);
    onClose();
    router.push("/dashboard/overview");
  };

  // Skip entire onboarding
  const handleSkip = async () => {
    await skipOnboarding();
    onClose();
  };

  // Navigate steps
  const handleBack = () => {
    if (currentStep > 1) {
      goToStep(currentStep - 1);
    }
  };

  // Render current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || undefined} />
                  <AvatarFallback className="text-2xl">
                    {profile?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Acme Inc."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger id="timezone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {!connectionSuccess ? (
              <>
                <p className="text-sm text-muted-foreground text-center">
                  Connect your email to start importing contacts and tracking engagement.
                </p>

                <div className="grid gap-4">
                  <Card
                    className={`cursor-pointer transition-all hover:border-primary ${
                      selectedProvider === "gmail" ? "border-primary bg-primary/5" : ""
                    }`}
                    onClick={() => !isConnecting && setSelectedProvider("gmail")}
                  >
                    <CardContent className="flex items-center gap-4 p-6">
                      <Mail className="h-8 w-8 text-primary" />
                      <div className="flex-1">
                        <h4 className="font-semibold">Gmail</h4>
                        <p className="text-sm text-muted-foreground">
                          Connect your Google account
                        </p>
                      </div>
                      {selectedProvider === "gmail" && (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      )}
                    </CardContent>
                  </Card>

                  <Card
                    className={`cursor-pointer transition-all hover:border-primary opacity-50 ${
                      selectedProvider === "outlook" ? "border-primary bg-primary/5" : ""
                    }`}
                  >
                    <CardContent className="flex items-center gap-4 p-6">
                      <Mail className="h-8 w-8" />
                      <div className="flex-1">
                        <h4 className="font-semibold">Outlook</h4>
                        <p className="text-sm text-muted-foreground">Coming soon</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedProvider && (
                  <Button
                    className="w-full"
                    onClick={() => handleIntegrationConnect(selectedProvider)}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        Connect {selectedProvider === "gmail" ? "Gmail" : "Outlook"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-500/10 p-3">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Successfully Connected!</h3>
                  <p className="text-sm text-muted-foreground">
                    Your {selectedProvider === "gmail" ? "Gmail" : "Outlook"} account is now
                    connected.
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {!isSyncing && contactsFound === 0 ? (
              <>
                <div className="text-center space-y-4">
                  <Users className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Import Your Contacts</h3>
                    <p className="text-sm text-muted-foreground">
                      We'll scan your emails and automatically extract contacts.
                    </p>
                  </div>
                </div>

                <Button className="w-full" onClick={handleStep3Start}>
                  Start Import
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : isSyncing ? (
              <div className="space-y-4 py-8">
                <div className="text-center space-y-2">
                  <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                  <h3 className="text-lg font-semibold">Importing Contacts...</h3>
                  <p className="text-sm text-muted-foreground">
                    This may take a few moments
                  </p>
                </div>
                <Progress value={syncProgress} className="w-full" />
                <p className="text-center text-sm text-muted-foreground">
                  {syncProgress}% complete
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="rounded-full bg-green-500/10 p-3">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Import Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    Found {contactsFound} contacts. AI scoring in progress...
                  </p>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <Rocket className="h-12 w-12 mx-auto text-primary" />
              <h3 className="text-lg font-semibold">Create Your First Campaign</h3>
              <p className="text-sm text-muted-foreground">
                Get started with a pre-built template or skip for now
              </p>
            </div>

            <div className="grid gap-3">
              {[
                {
                  id: "welcome",
                  title: "Welcome Email",
                  description: "Send a warm introduction to new contacts",
                },
                {
                  id: "followup",
                  title: "Follow-up Sequence",
                  description: "3-email nurture sequence for prospects",
                },
                {
                  id: "reengagement",
                  title: "Re-engagement",
                  description: "Win back cold contacts",
                },
              ].map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:border-primary ${
                    selectedTemplate === template.id ? "border-primary bg-primary/5" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template.id)}
                >
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{template.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    {selectedTemplate === template.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => goToStep(5)}>
                Skip for now
              </Button>
              <Button onClick={handleStep4Complete} disabled={!selectedTemplate}>
                Create Campaign
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Sparkles className="h-16 w-16 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold">You're All Set!</h3>
                <p className="text-muted-foreground">
                  Welcome to Unite-Hub. Let's take a quick tour of your dashboard.
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-muted/50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Contacts</h4>
                  <p className="text-xs text-muted-foreground">
                    View and manage all your contacts with AI-powered scoring
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Campaigns</h4>
                  <p className="text-xs text-muted-foreground">
                    Create and track email campaigns with automation
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Analytics</h4>
                  <p className="text-xs text-muted-foreground">
                    Monitor engagement and performance metrics
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {currentStep === 1 && "Welcome to Unite-Hub"}
              {currentStep === 2 && "Connect Your Email"}
              {currentStep === 3 && "Import Contacts"}
              {currentStep === 4 && "Create Your First Campaign"}
              {currentStep === 5 && "Almost Done!"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Step {currentStep} of 5
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Progress value={completionPercentage} className="w-full" />

          {renderStepContent()}

          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1 || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep !== 5 && (
              <Button
                onClick={() => {
                  if (currentStep === 1) {
handleStep1Complete();
} else if (currentStep === 2 && connectionSuccess) {
handleStep2Complete();
} else if (currentStep === 3 && contactsFound > 0) {
handleStep3Complete();
} else if (currentStep === 4) {
handleStep4Complete();
}
                }}
                disabled={
                  isSubmitting ||
                  (currentStep === 1 && !businessName) ||
                  (currentStep === 2 && !connectionSuccess) ||
                  (currentStep === 3 && contactsFound === 0 && !isSyncing)
                }
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    {currentStep === 4 ? "Continue" : "Next"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            {currentStep === 5 && (
              <Button onClick={handleStep5Complete}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
