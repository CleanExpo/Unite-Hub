// src/app/(founder)/founder/command-centre/page.tsx
//
// Read-only Nexus Command Centre home. Renders the project registry as cards and
// a summary of the read-only tool catalogue. No mutations, no tool invocation.
// Auth is enforced by the (founder) layout (redirects unauthenticated users).

export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getProjects } from '@/lib/command-centre/registry'
import { getToolCatalogue } from '@/lib/command-centre/tools/catalogue'
import { ExternalLink, GitBranch, Rocket } from 'lucide-react'

function statusVariant(status: string): 'success' | 'warning' | 'outline' {
  if (status === 'active') return 'success'
  if (status === 'stub') return 'warning'
  return 'outline'
}

export default async function CommandCentrePage() {
  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }

  const [projects, tools] = await Promise.all([getProjects(), getToolCatalogue()])

  const toolsBySource = tools.reduce<Record<string, number>>((acc, tool) => {
    acc[tool.source] = (acc[tool.source] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Command Centre"
        subtitle="Read-only view of the portfolio registry and the discovered tool catalogue"
        tip="This is the starter slice — read-only. No queue, approvals, or tool execution are wired here yet."
      />

      {/* Project registry */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Projects
          </h2>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {projects.length} registered
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((project) => (
            <Card key={project.name} variant="default" padding="sm" className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white/90">{project.name}</h3>
                <Badge variant={statusVariant(project.status)} size="sm">
                  {project.status}
                </Badge>
              </div>

              <p className="text-xs text-white/50 leading-relaxed">{project.business_purpose}</p>

              <dl className="flex flex-col gap-1.5 text-[11px] text-white/40">
                <div className="flex items-center gap-1.5">
                  <Rocket size={12} strokeWidth={1.5} className="shrink-0" />
                  <span>{project.deployment_target}</span>
                  <span className="text-white/20">·</span>
                  <span>{project.linear_prefix}-*</span>
                </div>
                {project.github_repo && (
                  <div className="flex items-center gap-1.5">
                    <GitBranch size={12} strokeWidth={1.5} className="shrink-0" />
                    <span className="truncate">{project.github_repo}</span>
                  </div>
                )}
                {project.production_url && (
                  <a
                    href={project.production_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#00F5FF]/70 hover:text-[#00F5FF] transition-colors"
                  >
                    <ExternalLink size={12} strokeWidth={1.5} className="shrink-0" />
                    <span className="truncate">{project.production_url.replace(/^https?:\/\//, '')}</span>
                  </a>
                )}
              </dl>
            </Card>
          ))}
        </div>
      </section>

      {/* Tool catalogue summary */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            Tool Catalogue
          </h2>
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {tools.length} sources · list-only (no execution)
          </span>
        </div>

        <Card variant="default" padding="sm" className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {Object.entries(toolsBySource).map(([source, count]) => (
              <Badge key={source} variant="info" size="sm">
                {source}: {count}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {tools.map((tool) => (
              <div
                key={tool.tool_key}
                className="flex items-start justify-between gap-2 px-3 py-2 rounded-sm bg-white/[0.02] border-[0.5px] border-white/[0.06]"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-xs font-medium text-white/80 truncate">{tool.tool_key}</span>
                  <span className="text-[11px] text-white/40 truncate">{tool.description}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge variant="outline" size="sm">
                    {tool.risk_class}
                  </Badge>
                  {tool.approval_required && (
                    <span className="text-[10px] text-[#f59e0b]/70">approval</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  )
}
