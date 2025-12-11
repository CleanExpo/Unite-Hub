import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, LayoutList, Sparkles } from "lucide-react";
import { getLocalSeoServiceContentSummary } from "@/lib/seo/localSeoEngineService";

interface SeoServicesPageProps {
  searchParams?: {
    workspaceId?: string;
    status?: string;
  };
}

/**
 * Synthex 2026 Local SEO – Service-level Content Strategy
 *
 * Reads from `service_content_strategy` (and the primary
 * `synthex_local_seo_profiles` row for context) to show
 * per-service content strategy and draft status for a
 * given workspace.
 *
 * Usage (dev/testing):
 *   /dashboard/seo/services?workspaceId=<workspace_uuid>
 */
export default async function SeoServicesPage({
  searchParams,
}: SeoServicesPageProps) {
  const workspaceId = searchParams?.workspaceId;
  const statusFilter = searchParams?.status;

  if (!workspaceId) {
    return (
      <div className="space-y-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Workspace required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">
              To view service-level content strategy, open this page with a workspace ID:
            </p>
            <pre className="mt-3 rounded bg-slate-900/60 p-3 text-xs text-slate-200 overflow-x-auto">
              {"/dashboard/seo/services?workspaceId=<workspace_uuid>"}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, services } = await getLocalSeoServiceContentSummary(workspaceId, {
    status: statusFilter,
    limit: 100,
  });

  const hasData = services.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <LayoutList className="h-7 w-7 text-violet-400" />
          Service Content Strategy
        </h1>
        <p className="text-slate-400 mt-1">
          Inspect per-service keywords, topics, FAQs, and content status for Local SEO landing pages.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Workspace ID: <span className="font-mono">{workspaceId}</span>
        </p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base">
            {profile
              ? `Local SEO Profile: ${profile.business_name}`
              : "Local SEO Profile (none configured yet)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile ? (
            <div className="text-sm text-slate-300 space-y-1">
              <div>
                <span className="font-semibold">Category:</span> {profile.business_category}
              </div>
              <div className="text-xs text-slate-400">
                Content automation: {profile.citation_syndication_enabled ? "enabled" : "disabled"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              No Local SEO profile has been created for this workspace yet. Service-level strategies
              can still be defined, but linking them to a profile unlocks richer reporting.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Services & content plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex items-start gap-3 rounded-lg bg-slate-900/60 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-medium text-slate-100 mb-1">No service content strategies yet</p>
                <p className="text-slate-400">
                  The <code className="font-mono">service_content_strategy</code> table is empty for this workspace.
                  Once Synthex begins generating service-level content plans, new rows will appear here
                  automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="py-2 pr-4 text-left">Service</th>
                    <th className="py-2 pr-4 text-left">Category</th>
                    <th className="py-2 pr-4 text-left">Status</th>
                    <th className="py-2 pr-4 text-right">Local Relevance</th>
                    <th className="py-2 pr-4 text-left">Primary Keywords</th>
                    <th className="py-2 pr-4 text-left">Target URL</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-800 hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="py-2 pr-4 text-slate-100">{row.service_name}</td>
                      <td className="py-2 pr-4 text-slate-300">{row.service_category || "—"}</td>
                      <td className="py-2 pr-4 text-slate-300">{row.content_status}</td>
                      <td className="py-2 pr-4 text-right text-slate-300">
                        {row.local_relevance_score ?? "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-300 max-w-xs truncate">
                        {Array.isArray(row.primary_keywords)
                          ? row.primary_keywords
                              .map((k: any) => k.keyword || "")
                              .filter(Boolean)
                              .join(", ") || "—"
                          : "—"}
                      </td>
                      <td className="py-2 pr-4 text-slate-300 max-w-xs truncate" title={row.target_url || undefined}>
                        {row.target_url || ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
