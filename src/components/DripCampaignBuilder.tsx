"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Save, Play, Pause, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

export function DripCampaignBuilder({
  campaignId,
  onSave,
}: {
  campaignId?: string;
  onSave?: (campaign: any) => void;
}) {
  const { currentOrganization } = useAuth();
  const [campaign, setCampaign] = useState({
    name: "",
    description: "",
    trigger_type: "manual",
    trigger_value: "",
    status: "draft",
  });

  const [steps, setSteps] = useState<any[]>([
    {
      step_number: 1,
      delay_days: 0,
      delay_hours: 0,
      subject_line: "",
      content_template: "",
      condition_type: "none",
    },
  ]);

  const [selectedStep, setSelectedStep] = useState(0);

  const addStep = () => {
    const newStep = {
      step_number: steps.length + 1,
      delay_days: 0,
      delay_hours: 0,
      subject_line: "",
      content_template: "",
      condition_type: "none",
    };
    setSteps([...steps, newStep]);
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const workspaceId = currentOrganization?.org_id;
      if (!workspaceId) {
        alert("No organization selected");
        return;
      }

      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        return;
      }

      const res = await fetch("/api/campaigns/drip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: "create",
          workspaceId,
          ...campaign,
        }),
      });

      const { campaign: newCampaign } = await res.json();

      // Save steps
      for (const step of steps) {
        await fetch("/api/campaigns/drip", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "add_step",
            campaign_id: newCampaign.id,
            ...step,
          }),
        });
      }

      if (onSave) {
onSave(newCampaign);
}
      alert("Campaign saved!");
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Campaign Settings */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Campaign Settings</CardTitle>
          <CardDescription>Configure your drip campaign</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-white mb-2 block">Campaign Name</Label>
            <Input
              placeholder="e.g., Welcome Series"
              value={campaign.name}
              onChange={(e) =>
                setCampaign({ ...campaign, name: e.target.value })
              }
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div>
            <Label className="text-white mb-2 block">Description</Label>
            <Textarea
              placeholder="What is this campaign about?"
              value={campaign.description || ""}
              onChange={(e) =>
                setCampaign({ ...campaign, description: e.target.value })
              }
              className="bg-slate-700 border-slate-600 text-white min-h-20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-white mb-2 block">Trigger Type</Label>
              <Select
                value={campaign.trigger_type}
                onValueChange={(value) =>
                  setCampaign({ ...campaign, trigger_type: value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="manual">Manual Enrollment</SelectItem>
                  <SelectItem value="new_contact">New Contact</SelectItem>
                  <SelectItem value="tag">By Tag</SelectItem>
                  <SelectItem value="score_threshold">
                    AI Score Threshold
                  </SelectItem>
                  <SelectItem value="email_open">Email Opened</SelectItem>
                  <SelectItem value="email_click">Email Clicked</SelectItem>
                  <SelectItem value="no_reply">No Reply (7 days)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white mb-2 block">Status</Label>
              <Select
                value={campaign.status}
                onValueChange={(value) =>
                  setCampaign({ ...campaign, status: value })
                }
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Steps */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Campaign Flow</CardTitle>
            <CardDescription>
              Build your multi-email sequence
            </CardDescription>
          </div>
          <Button
            onClick={addStep}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step Tabs */}
          <Tabs
            value={`step-${selectedStep}`}
            onValueChange={(value) =>
              setSelectedStep(parseInt(value.split("-")[1]))
            }
            className="w-full"
          >
            <TabsList className="grid w-full gap-2">
              {steps.map((step, idx) => (
                <TabsTrigger key={idx} value={`step-${idx}`} className="text-xs">
                  Email {step.step_number}
                </TabsTrigger>
              ))}
            </TabsList>

            {steps.map((step, idx) => (
              <TabsContent key={idx} value={`step-${idx}`} className="space-y-4">
                <div className="bg-slate-700 rounded p-4 border border-slate-600 space-y-4">
                  {/* Delay */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white mb-2 block text-sm">
                        Delay (Days)
                      </Label>
                      <Input
                        type="number"
                        value={step.delay_days}
                        onChange={(e) =>
                          updateStep(idx, "delay_days", parseInt(e.target.value))
                        }
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-white mb-2 block text-sm">
                        Delay (Hours)
                      </Label>
                      <Input
                        type="number"
                        value={step.delay_hours}
                        onChange={(e) =>
                          updateStep(idx, "delay_hours", parseInt(e.target.value))
                        }
                        className="bg-slate-600 border-slate-500 text-white text-sm"
                      />
                    </div>
                  </div>

                  {/* Subject Line */}
                  <div>
                    <Label className="text-white mb-2 block text-sm">
                      Subject Line
                    </Label>
                    <Input
                      placeholder="Email subject"
                      value={step.subject_line}
                      onChange={(e) =>
                        updateStep(idx, "subject_line", e.target.value)
                      }
                      className="bg-slate-600 border-slate-500 text-white text-sm"
                    />
                  </div>

                  {/* Email Content */}
                  <div>
                    <Label className="text-white mb-2 block text-sm">
                      Email Content
                    </Label>
                    <Textarea
                      placeholder="Email body (use {{name}}, {{company}} for personalization)"
                      value={step.content_template}
                      onChange={(e) =>
                        updateStep(idx, "content_template", e.target.value)
                      }
                      className="bg-slate-600 border-slate-500 text-white text-sm min-h-32"
                    />
                  </div>

                  {/* Condition */}
                  <div>
                    <Label className="text-white mb-2 block text-sm">
                      Condition (Next Step Logic)
                    </Label>
                    <Select
                      value={step.condition_type}
                      onValueChange={(value) =>
                        updateStep(idx, "condition_type", value)
                      }
                    >
                      <SelectTrigger className="bg-slate-600 border-slate-500 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="none">
                          No condition (Always send)
                        </SelectItem>
                        <SelectItem value="if_opened">
                          If previous email opened
                        </SelectItem>
                        <SelectItem value="if_clicked">
                          If previous email clicked
                        </SelectItem>
                        <SelectItem value="if_replied">
                          If replied
                        </SelectItem>
                        <SelectItem value="if_not_opened">
                          If NOT opened
                        </SelectItem>
                        <SelectItem value="if_not_clicked">
                          If NOT clicked
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Delete Button */}
                  {steps.length > 1 && (
                    <Button
                      onClick={() => removeStep(idx)}
                      variant="outline"
                      size="sm"
                      className="border-red-600/30 text-red-400 hover:bg-red-900/20 w-full gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove Step
                    </Button>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Visual Preview */}
          <div className="bg-slate-700 rounded p-4 border border-slate-600">
            <p className="text-sm text-slate-400 mb-3">Campaign Flow Preview:</p>
            <div className="flex items-center gap-2 flex-wrap">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <Badge className="bg-blue-600">
                    Day {step.delay_days} - Email {step.step_number}
                  </Badge>
                  {idx < steps.length - 1 && (
                    <span className="text-slate-400">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
        >
          <Save className="w-4 h-4" />
          Save Campaign
        </Button>
        {campaignId && (
          <>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Play className="w-4 h-4" />
              Activate
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
