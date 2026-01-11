import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, FileText, SearchCheck } from "lucide-react";
import { getLocalSeoSchemaSummary } from "@/lib/seo/localSeoEngineService";

interface SeoSchemaPageProps {
  searchParams?: {
    workspaceId?: string;
  };
}

/**
 * Synthex 2026 Local SEO – Schema Markup Dashboard
 *
 * Reads from `schema_markup_generated` (and the primary
 * `synthex_local_seo_profiles` row for context) to show
 * structured data coverage and validation state for a
 * given workspace.
 *
 * Usage (dev/testing):
 *   /dashboard/seo/schema?workspaceId=<workspace_uuid>
 */
export default async function SeoSchemaPage({
  searchParams,
}: SeoSchemaPageProps) {
  const workspaceId = searchParams?.workspaceId;

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
              To view schema markup, open this page with a workspace ID:
            </p>
            <pre className="mt-3 rounded bg-slate-900/60 p-3 text-xs text-slate-200 overflow-x-auto">
              {"/dashboard/seo/schema?workspaceId=<workspace_uuid>"}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, markup } = await getLocalSeoSchemaSummary(workspaceId, {
    limit: 100,
  });

  const hasData = markup.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <SearchCheck className="h-7 w-7 text-emerald-400" />
          Schema Markup
        </h1>
        <p className="text-slate-400 mt-1">
          View generated JSON-LD, validation status, and rich result eligibility for your key pages.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Workspace ID: <span className="font-mono">{workspaceId}</span>
        </p>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-400" />
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
                Schema automation: {profile.schema_auto_generation ? "enabled" : "disabled"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              No Local SEO profile has been created for this workspace yet. Schema markup can still be
              generated and tracked, but linking it to a profile unlocks richer reporting.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Page-level schema markup
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex items-start gap-3 rounded-lg bg-slate-900/60 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-medium text-slate-100 mb-1">No schema markup records yet</p>
                <p className="text-slate-400">
                  The <code className="font-mono">schema_markup_generated</code> table is empty for this workspace.
                  Once Synthex begins generating JSON-LD for your pages, new rows will appear here
                  automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="py-2 pr-4 text-left">Page URL</th>
                    <th className="py-2 pr-4 text-left">Schema Type</th>
                    <th className="py-2 pr-4 text-left">Validation</th>
                    <th className="py-2 pr-4 text-left">Rich Results</th>
                    <th className="py-2 pr-4 text-right">Impressions</th>
                    <th className="py-2 pr-4 text-right">Clicks</th>
                    <th className="py-2 pr-4 text-left">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {markup.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-800 hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="py-2 pr-4 text-slate-100 max-w-xs truncate" title={row.page_url}>
                        {row.page_url}
                      </td>
                      <td className="py-2 pr-4 text-slate-300">{row.schema_type}</td>
                      <td className="py-2 pr-4 text-slate-300">
                        {row.validation_status}
                      </td>
                      <td className="py-2 pr-4 text-slate-300">
                        {row.google_rich_results_eligible ? "Eligible" : "Not eligible"}
                      </td>
                      <td className="py-2 pr-4 text-right text-slate-300">
                        {row.rich_results_impressions}
                      </td>
                      <td className="py-2 pr-4 text-right text-slate-300">
                        {row.rich_results_clicks}
                      </td>
                      <td className="py-2 pr-4 text-slate-400 text-xs">
                        {row.last_performance_update || row.updated_at}
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
