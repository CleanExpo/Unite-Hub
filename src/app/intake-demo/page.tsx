"use client";

import { IntakeForm } from "@/components/intake/IntakeForm";

export default function IntakeDemoPage() {
  const handleSubmit = (data: any) => {
    console.log("Form submitted:", data);
    alert("Thank you! Your project request has been submitted. We'll be in touch within 24 hours.");
  };

  return <IntakeForm onSubmit={handleSubmit} />;
}
