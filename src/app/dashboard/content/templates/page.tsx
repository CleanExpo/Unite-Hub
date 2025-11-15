"use client";

import { TemplateLibrary } from "@/components/social-templates/TemplateLibrary";
import { MessageSquare } from "lucide-react";
import { FeaturePageWrapper } from "@/components/features/FeaturePageWrapper";
import { Id } from "@/convex/_generated/dataModel";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function TemplatesPage() {
  return (
    <FeaturePageWrapper
      featureName="Social Copy Templates"
      description="250+ pre-written templates across all platforms"
      icon={<MessageSquare className="h-20 w-20 text-slate-600" />}
    >
      {(clientId) => (
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={[
            { label: "Content", href: "/dashboard/content" },
            { label: "Templates" }
          ]} />
          <TemplateLibrary clientId={clientId} />
        </div>
      )}
    </FeaturePageWrapper>
  );
}
