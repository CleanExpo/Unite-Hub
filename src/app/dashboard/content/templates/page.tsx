"use client";

import { useParams } from "next/navigation";
import { TemplateLibrary } from "@/components/social-templates/TemplateLibrary";
import ClientPortalLayout from "@/components/layout/ClientPortalLayout";

export default function TemplatesPage() {
  const params = useParams();
  const clientId = params?.clientId as string;

  return (
    <ClientPortalLayout clientId={clientId}>
      <div className="container mx-auto px-4 py-8">
        <TemplateLibrary clientId={clientId} />
      </div>
    </ClientPortalLayout>
  );
}
