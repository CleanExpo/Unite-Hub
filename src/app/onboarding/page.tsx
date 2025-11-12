"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phone: "",
    website: "",
    teamSize: "",
    clients: "",
    industry: "",
  });

  const steps = [
    { number: 1, title: "Company Info", description: "Tell us about your agency" },
    { number: 2, title: "Workspace Setup", description: "Create your first client workspace" },
    { number: 3, title: "Team Members", description: "Invite your team" },
    { number: 4, title: "Integration", description: "Connect your email & integrations" },
    { number: 5, title: "Complete", description: "Launch your account" },
  ];

  const progress = (step / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900/50">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-white">Welcome to Unite-Hub</h1>
            <span className="text-sm text-slate-400">Step {step} of {steps.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Step Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            {steps.map((s) => (
              <div
                key={s.number}
                className={`p-3 rounded border transition cursor-pointer ${
                  step === s.number
                    ? "bg-blue-600/20 border-blue-600 text-white"
                    : step > s.number
                    ? "bg-green-600/20 border-green-600 text-green-300"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                onClick={() => step > s.number && setStep(s.number)}
              >
                <div className="font-semibold text-sm">{s.title}</div>
                <div className="text-xs opacity-75">{s.description}</div>
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">{steps[step - 1].title}</CardTitle>
                <CardDescription>{steps[step - 1].description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {step === 1 && (
                  <Step1Form formData={formData} setFormData={setFormData} />
                )}
                {step === 2 && <Step2Form formData={formData} setFormData={setFormData} />}
                {step === 3 && <Step3Form />}
                {step === 4 && <Step4Form />}
                {step === 5 && <Step5Completion />}

                {/* Navigation Buttons */}
                <div className="flex gap-3 pt-6 border-t border-slate-700">
                  <Button
                    variant="outline"
                    onClick={() => setStep(step - 1)}
                    disabled={step === 1}
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={() => setStep(step + 1)}
                    disabled={step === steps.length}
                    className="ml-auto bg-blue-600 hover:bg-blue-700"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1Form({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-white mb-2 block">Company Name *</Label>
        <Input
          placeholder="Your Agency Name"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-white mb-2 block">Email *</Label>
        <Input
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-white mb-2 block">Phone</Label>
        <Input
          placeholder="+1 (555) 000-0000"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-white mb-2 block">Website</Label>
        <Input
          placeholder="https://your-agency.com"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-white mb-2 block">Team Size *</Label>
        <select
          value={formData.teamSize}
          onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white"
        >
          <option value="">Select...</option>
          <option value="1-3">1-3 people</option>
          <option value="4-10">4-10 people</option>
          <option value="10-20">10-20 people</option>
          <option value="20+">20+ people</option>
        </select>
      </div>
    </div>
  );
}

function Step2Form({ formData, setFormData }: any) {
  return (
    <div className="space-y-4">
      <p className="text-slate-300">Create your first client workspace</p>
      <div>
        <Label className="text-white mb-2 block">Workspace Name *</Label>
        <Input
          placeholder="e.g., Duncan's Marketing"
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-white mb-2 block">Workspace Description</Label>
        <Input
          placeholder="Description of this client's workspace"
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>
      <div className="bg-blue-600/10 border border-blue-600/30 rounded p-4">
        <p className="text-sm text-blue-300">
          💡 You can add more client workspaces anytime from the dashboard.
        </p>
      </div>
    </div>
  );
}

function Step3Form() {
  return (
    <div className="space-y-4">
      <p className="text-slate-300">Invite your team members</p>
      <div>
        <Label className="text-white mb-2 block">Team Member Email</Label>
        <Input
          type="email"
          placeholder="team@email.com"
          className="bg-slate-700 border-slate-600 text-white"
        />
      </div>
      <div>
        <Label className="text-white mb-2 block">Role</Label>
        <select className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white">
          <option>Admin</option>
          <option>Manager</option>
          <option>Member</option>
          <option>Viewer</option>
        </select>
      </div>
      <Button className="w-full bg-slate-700 hover:bg-slate-600">+ Add Another</Button>
      <p className="text-xs text-slate-400">You can add more team members later</p>
    </div>
  );
}

function Step4Form() {
  return (
    <div className="space-y-4">
      <p className="text-slate-300">Connect your integrations</p>

      <div className="space-y-3">
        <div className="bg-slate-700 border border-slate-600 rounded p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-white">Gmail</p>
            <p className="text-sm text-slate-400">Connect to process emails</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Connect</Button>
        </div>

        <div className="bg-slate-700 border border-slate-600 rounded p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-white">Outlook</p>
            <p className="text-sm text-slate-400">Connect to process emails</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">Connect</Button>
        </div>

        <div className="bg-slate-700 border border-slate-600 rounded p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold text-white">Slack</p>
            <p className="text-sm text-slate-400">Notifications and updates</p>
          </div>
          <Button variant="outline" className="border-slate-600 text-slate-300">Connect</Button>
        </div>
      </div>

      <p className="text-xs text-slate-400">You can add more integrations anytime</p>
    </div>
  );
}

function Step5Completion() {
  return (
    <div className="space-y-6 text-center">
      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">Welcome to Unite-Hub!</h3>
        <p className="text-slate-300">Your account is set up and ready to go.</p>
      </div>

      <div className="bg-green-600/10 border border-green-600/30 rounded p-4 space-y-2">
        <p className="text-sm text-green-300 font-semibold">✓ Account created</p>
        <p className="text-sm text-green-300 font-semibold">✓ First workspace ready</p>
        <p className="text-sm text-green-300 font-semibold">✓ Integrations connected</p>
      </div>

      <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700">
        Go to Dashboard
      </Button>
    </div>
  );
}
