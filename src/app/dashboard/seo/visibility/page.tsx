import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocalSeoVisibilitySummary } from "@/lib/seo/localSeoEngineService";
import { AlertTriangle, Search } from "lucide-react";

interface SeoVisibilityPageProps {
  searchParams?: {
    workspaceId?: string;
  };
}

/**
 * Synthex 2026 Local SEO – AI Search Visibility View
 *
 * This page is an initial, minimal dashboard for the new
 * `ai_search_visibility` + `synthex_local_seo_profiles` tables.
 *
 * Usage (dev/testing):
 *   /dashboard/seo/visibility?workspaceId=<workspace_uuid>
 *
 * In a later pass we can wire this to the active workspace
 * selection (e.g. from the WorkspaceSwitcher) instead of
 * reading workspaceId from the query string.
 */
export default async function SeoVisibilityPage({
  searchParams,
}: SeoVisibilityPageProps) {
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
              To view AI search visibility, open this page with a workspace ID:
            </p>
            <pre className="mt-3 rounded bg-slate-900/60 p-3 text-xs text-slate-200 overflow-x-auto">
              {"/dashboard/seo/visibility?workspaceId=<workspace_uuid>"}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { profile, visibility } = await getLocalSeoVisibilitySummary(workspaceId, {
    limit: 50,
  });

  const hasData = visibility.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Search className="h-7 w-7 text-cyan-400" />
          AI Search Visibility
        </h1>
        <p className="text-slate-400 mt-1">
          Live view of how AI search surfaces your brand across Google SGE, Bing Copilot, and other assistants.
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
                AI SGE tracking: {profile.ai_sge_tracking_enabled ? "enabled" : "disabled"} •
                Schema automation: {profile.schema_auto_generation ? "enabled" : "disabled"} •
                GBP automation: {profile.gbp_automation_enabled ? "enabled" : "disabled"}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300">
              No Local SEO profile has been created for this workspace yet. The AI Search Visibility table
              will still populate as agents write data, but you can create a profile later to unlock
              more targeted reporting.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Recent AI search appearances
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="flex items-start gap-3 rounded-lg bg-slate-900/60 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-medium text-slate-100 mb-1">No AI search visibility records yet</p>
                <p className="text-slate-400">
                  The <code className="font-mono">ai_search_visibility</code> table is empty for this workspace.
                  Once Synthex agents begin monitoring AI search results, new rows will appear here
                  automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase">
                    <th className="py-2 pr-4 text-left">Query</th>
                    <th className="py-2 pr-4 text-left">Platform</th>
                    <th className="py-2 pr-4 text-left">Status</th>
                    <th className="py-2 pr-4 text-right">Position</th>
                    <th className="py-2 pr-4 text-right">Search Volume</th>
                    <th className="py-2 pr-4 text-right">Difficulty</th>
                    <th className="py-2 pr-4 text-left">Last Checked</th>
                  </tr>
                </thead>
                <tbody>
                  {visibility.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-800 hover:bg-slate-800/60 transition-colors"
                    >
                      <td className="py-2 pr-4 text-slate-100 max-w-xs truncate" title={row.query}>
                        {row.query}
                      </td>
                      <td className="py-2 pr-4 text-slate-300">{row.ai_platform}</td>
                      <td className="py-2 pr-4 text-slate-300">{row.visibility_status}</td>
                      <td className="py-2 pr-4 text-right text-slate-300">
                        {row.position ?? "-"}
                      </td>
                      <td className="py-2 pr-4 text-right text-slate-300">
                        {row.search_volume ?? "-"}
                      </td>
                      <td className="py-2 pr-4 text-right text-slate-300">
                        {row.difficulty_score ?? "-"}
                      </td>
                      <td className="py-2 pr-4 text-slate-400 text-xs">
                        {row.checked_at || row.created_at}
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
