"use client";

/**
 * Email Preview Component
 * Shows how the email will look on desktop and mobile
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone } from "lucide-react";

interface EmailPreviewProps {
  step: {
    subjectLine: string;
    preheaderText?: string;
    emailBody: string;
    cta: {
      text: string;
      url?: string;
      type: string;
    };
  };
  senderName?: string;
  senderEmail?: string;
}

export function EmailPreview({
  step,
  senderName = "Your Name",
  senderEmail = "you@company.com",
}: EmailPreviewProps) {
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");

  const renderEmail = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Email Header */}
        <div className="border-b p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold">{senderName}</p>
              <p className="text-sm text-muted-foreground">{senderEmail}</p>
            </div>
            <p className="text-xs text-muted-foreground">Just now</p>
          </div>
          <p className="font-semibold text-lg">{step.subjectLine}</p>
          {step.preheaderText && (
            <p className="text-sm text-muted-foreground mt-1">{step.preheaderText}</p>
          )}
        </div>

        {/* Email Body */}
        <div className="p-6">
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap">{step.emailBody}</div>
          </div>

          {/* CTA Button */}
          <div className="mt-6">
            {step.cta.type === "button" && (
              <Button className="w-full sm:w-auto">
                {step.cta.text}
              </Button>
            )}
            {step.cta.type === "link" && (
              <a
                href={step.cta.url || "#"}
                className="text-primary hover:underline"
                onClick={(e) => {
 if (!step.cta.url) {
e.preventDefault();
} 
}}
              >
                {step.cta.text}
              </a>
            )}
            {step.cta.type === "calendar" && (
              <Button variant="outline" className="w-full sm:w-auto">
                {step.cta.text}
              </Button>
            )}
            {step.cta.type === "reply" && (
              <p className="text-sm text-muted-foreground italic">
                Reply to this email to {step.cta.text.toLowerCase()}
              </p>
            )}
          </div>

          {/* Email Footer */}
          <div className="mt-8 pt-4 border-t text-xs text-muted-foreground">
            <p>Best regards,</p>
            <p className="font-medium">{senderName}</p>
            <p className="mt-2">
              <span className="hover:underline cursor-default text-muted-foreground" title="Preview only">Unsubscribe</span>
              {" | "}
              <span className="hover:underline cursor-default text-muted-foreground" title="Preview only">Update preferences</span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email Preview</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={deviceView === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setDeviceView("desktop")}
            >
              <Monitor className="h-4 w-4 mr-1" />
              Desktop
            </Button>
            <Button
              variant={deviceView === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setDeviceView("mobile")}
            >
              <Smartphone className="h-4 w-4 mr-1" />
              Mobile
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className={deviceView === "mobile" ? "max-w-sm mx-auto" : "max-w-2xl mx-auto"}>
          {renderEmail()}
        </div>

        {/* Preview Info */}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-2">Preview Information</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Subject Length</p>
              <p>{step.subjectLine.length} characters</p>
            </div>
            <div>
              <p className="text-muted-foreground">Body Length</p>
              <p>{step.emailBody.length} characters</p>
            </div>
            <div>
              <p className="text-muted-foreground">Estimated Read Time</p>
              <p>{Math.ceil(step.emailBody.split(' ').length / 200)} min</p>
            </div>
            <div>
              <p className="text-muted-foreground">CTA Type</p>
              <p className="capitalize">{step.cta.type}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
