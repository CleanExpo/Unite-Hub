"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/branding/Logo";
import { ArrowLeft, ArrowRight, Upload, Check, Lock, Zap } from "lucide-react";

interface IntakeFormProps {
  onSubmit?: (data: FormData) => void;
  className?: string;
}

interface FormData {
  services: string[];
  projectDescription: string;
  budget: string;
  timeline: string;
  files: File[];
  companyName: string;
  yourName: string;
  email: string;
  phone: string;
}

const services = [
  { id: "branding", name: "Branding", description: "Logo, identity, guidelines", icon: "🎨" },
  { id: "web-design", name: "Web Design", description: "UI/UX, mockups, prototypes", icon: "💻" },
  { id: "development", name: "Development", description: "Custom websites, web apps", icon: "⚙️" },
  { id: "marketing", name: "Marketing", description: "SEO, social media, content", icon: "📈" },
];

const budgetRanges = [
  { id: "under-10k", label: "Under $10K" },
  { id: "10k-25k", label: "$10K - $25K" },
  { id: "25k-50k", label: "$25K - $50K" },
  { id: "50k-100k", label: "$50K - $100K" },
  { id: "100k-plus", label: "$100K+" },
  { id: "not-sure", label: "Not Sure" },
];

const timelines = [
  { value: "", label: "Select timeline..." },
  { value: "asap", label: "ASAP / Urgent" },
  { value: "1-month", label: "Within 1 month" },
  { value: "2-3-months", label: "2-3 months" },
  { value: "3-6-months", label: "3-6 months" },
  { value: "flexible", label: "Flexible" },
];

const steps = [
  { number: 1, label: "Services" },
  { number: 2, label: "Project Details" },
  { number: 3, label: "About You" },
  { number: 4, label: "Review" },
];

export function IntakeForm({ onSubmit, className }: IntakeFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    services: [],
    projectDescription: "",
    budget: "",
    timeline: "",
    files: [],
    companyName: "",
    yourName: "",
    email: "",
    phone: "",
  });

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (serviceId: string) => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter((s) => s !== serviceId)
        : [...prev.services, serviceId],
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        files: Array.from(e.target.files || []),
      }));
    }
  };

  const handleSubmit = () => {
    onSubmit?.(formData);
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-10", className)}>
      <Card className="w-full max-w-4xl shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-unite-teal to-unite-blue text-white p-12 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center">
              <Logo size="sm" showText={false} />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">Start Your Project</h1>
          <p className="text-lg opacity-90">Tell us about your vision and we'll create something amazing together</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between p-8 border-b border-gray-200 bg-white">
          {steps.map((step, index) => (
            <div key={step.number} className="flex-1 flex flex-col items-center relative">
              {index < steps.length - 1 && (
                <div className={cn(
                  "absolute top-5 left-1/2 w-full h-0.5 -z-10",
                  step.number < currentStep ? "bg-unite-teal" : "bg-gray-200"
                )} />
              )}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-base mb-2 relative z-10 transition-all",
                step.number === currentStep ? "bg-gradient-to-br from-unite-teal to-unite-blue text-white" :
                step.number < currentStep ? "bg-unite-teal text-white" :
                "bg-gray-200 text-gray-500"
              )}>
                {step.number < currentStep ? <Check className="h-5 w-5" /> : step.number}
              </div>
              <span className="text-xs text-gray-600 text-center">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Form Body */}
        <CardContent className="p-10">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">What services do you need?</h2>
              <p className="text-gray-600 mb-8">Select all that apply. We'll tailor our approach to your specific needs.</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                {services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "p-5 border-2 rounded-xl cursor-pointer transition-all text-center",
                      formData.services.includes(service.id)
                        ? "border-unite-teal bg-unite-teal/5"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="text-3xl mb-3">{service.icon}</div>
                    <div className="font-semibold text-base mb-1">{service.name}</div>
                    <div className="text-xs text-gray-500">{service.description}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Tell us about your project</h2>
              <p className="text-gray-600 mb-8">Provide as much detail as possible to help us understand your needs.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Tell us about your project <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-unite-teal focus:border-transparent resize-none"
                    rows={5}
                    placeholder="What are you looking to achieve? What problem are you trying to solve? Any specific features or requirements?"
                    value={formData.projectDescription}
                    onChange={(e) => updateField("projectDescription", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">The more details you provide, the better we can help</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Project Budget <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {budgetRanges.map((budget) => (
                      <div
                        key={budget.id}
                        onClick={() => updateField("budget", budget.id)}
                        className={cn(
                          "p-4 border-2 rounded-lg cursor-pointer transition-all text-center text-sm font-semibold",
                          formData.budget === budget.id
                            ? "border-unite-teal bg-unite-teal/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        {budget.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    When do you need this completed? <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-unite-teal focus:border-transparent"
                    value={formData.timeline}
                    onChange={(e) => updateField("timeline", e.target.value)}
                  >
                    {timelines.map((timeline) => (
                      <option key={timeline.value} value={timeline.value}>
                        {timeline.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Reference Materials (Optional)</label>
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-unite-teal hover:bg-unite-teal/5 transition-all block">
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <div className="text-sm text-gray-600">
                      <strong>Click to upload</strong> or drag and drop<br />
                      Brand assets, examples, inspiration, requirements (Max 10MB)
                    </div>
                    {formData.files.length > 0 && (
                      <div className="mt-4 text-xs text-unite-teal">
                        {formData.files.length} file(s) selected
                      </div>
                    )}
                  </label>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Tell us about yourself</h2>
              <p className="text-gray-600 mb-8">We'll use this information to create your client portal and stay in touch.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-unite-teal focus:border-transparent"
                    placeholder="Your company name"
                    value={formData.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-unite-teal focus:border-transparent"
                    placeholder="First and last name"
                    value={formData.yourName}
                    onChange={(e) => updateField("yourName", e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-unite-teal focus:border-transparent"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">We'll send your project updates and portal access to this email</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Phone Number</label>
                  <input
                    type="tel"
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-unite-teal focus:border-transparent"
                    placeholder="+61 4XX XXX XXX"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="flex justify-center gap-10 p-6 bg-gray-50 rounded-xl mt-8">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Lock className="h-5 w-5" />
                  <span>Secure & Private</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Zap className="h-5 w-5" />
                  <span>24h Response Time</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-5 w-5" />
                  <span>No Obligation Quote</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h2 className="text-2xl font-bold mb-2">Review your submission</h2>
              <p className="text-gray-600 mb-8">Please review your information before submitting.</p>

              <div className="space-y-6">
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">Services Selected</h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.services.map((serviceId) => {
                      const service = services.find((s) => s.id === serviceId);
                      return (
                        <Badge key={serviceId} className="bg-unite-teal text-white">
                          {service?.icon} {service?.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">Project Details</h3>
                  <p className="text-sm text-gray-700 mb-2">{formData.projectDescription}</p>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div><strong>Budget:</strong> {budgetRanges.find((b) => b.id === formData.budget)?.label}</div>
                    <div><strong>Timeline:</strong> {timelines.find((t) => t.value === formData.timeline)?.label}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="font-semibold mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><strong>Company:</strong> {formData.companyName}</div>
                    <div><strong>Name:</strong> {formData.yourName}</div>
                    <div><strong>Email:</strong> {formData.email}</div>
                    <div><strong>Phone:</strong> {formData.phone || "Not provided"}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className="border-gray-300"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < 4 ? (
              <Button
                onClick={() => setCurrentStep((prev) => Math.min(4, prev + 1))}
                className="bg-gradient-to-r from-unite-teal to-unite-blue text-white"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                className="bg-gradient-to-r from-unite-teal to-unite-blue text-white"
              >
                Submit Project Request
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
