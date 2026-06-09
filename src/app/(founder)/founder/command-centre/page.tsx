// src/app/(founder)/founder/command-centre/page.tsx
//
// Nexus Command Deck — flight-deck console for the Unite-Group Nexus.
// Read-only starter slice: portfolio registry + read-only capability bus.
// No mutations, no queue, no tool invocation. Auth enforced by the (founder) layout.

export const dynamic = 'force-dynamic'

import { Chakra_Petch } from 'next/font/google'
import { getProjects, type CommandCentreProject } from '@/lib/command-centre/registry'
import { getToolCatalogue } from '@/lib/command-centre/tools/catalogue'
import { LiveClock } from './LiveClock'
import { CommandPalette } from './CommandPalette'
import { IdeaConsole } from './IdeaConsole'
import { QueueBoard } from './QueueBoard'
import styles from './command-deck.module.css'

const chakra = Chakra_Petch({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-chakra',
  display: 'swap',
})

// Stable per-project accent (instrument swatch) — purely visual brand separation.
const BRAND_SWATCH: Record<string, string> = {
  'Unite-Hub': '#38e1ff',
  RestoreAssist: '#34d399',
  Synthex: '#a855f7',
  'Disaster-Recovery': '#fb7185',
  'DR-NRPG': '#f97316',
  'ATO-APP': '#facc15',
  'CCW-CRM': '#22d3ee',
  'Authority-Site': '#818cf8',
  'Nexus-Hub': '#38e1ff',
  'Pi-CEO-Dev': '#4ade80',
  CARSI: '#e879f9',
}
function swatchFor(name: string): string {
  if (BRAND_SWATCH[name]) return BRAND_SWATCH[name]
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return `hsl(${h} 80% 62%)`
}

const RISK_RAIL: Record<string, string> = {
  read: '#38e1ff',
  'write-local': '#34d399',
  'write-shared': '#fbbf24',
  external: '#fb923c',
  destructive: '#f87171',
}
function railFor(risk: string): string {
  return RISK_RAIL[risk] ?? '#6f879b'
}

function ledState(status: string): 'active' | 'stub' | 'idle' {
  if (status === 'active') return 'active'
  if (status === 'stub') return 'stub'
  return 'idle'
}

function hostOf(url?: string): string {
  return url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : ''
}

export default async function CommandDeckPage() {
  const [projects, tools] = await Promise.all([getProjects(), getToolCatalogue()])

  const activeCount = projects.filter((p) => p.status === 'active').length
  const sources = tools.reduce<Record<string, number>>((acc, t) => {
    acc[t.source] = (acc[t.source] ?? 0) + 1
    return acc
  }, {})
  const pad2 = (n: number) => String(n).padStart(2, '0')

  return (
    <div className={`${chakra.variable} ${styles.deck}`}>
      <CommandPalette
        projects={projects.map((p) => ({ name: p.name, status: p.status, production_url: p.production_url }))}
        tools={tools.map((t) => ({ tool_key: t.tool_key, source: t.source, risk_class: t.risk_class }))}
      />

      {/* ── Status strip ─────────────────────────────────────────────── */}
      <header className={`${styles.statusStrip} ${styles.reveal}`}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>NX</span>
          <span className={styles.brandText}>
            <span className={styles.brandTitle}>Nexus Command</span>
            <span className={styles.brandSub}>Unite-Group // Command Deck</span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <LiveClock className={styles.clock} />
          <span className={styles.clockLabel}>Mission Time · UTC</span>
        </div>

        <div className={styles.metrics}>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{pad2(projects.length)}</span>
            <span className={styles.metricLabel}>Projects</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue} data-tone="go">{pad2(activeCount)}</span>
            <span className={styles.metricLabel}>Active</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{pad2(tools.length)}</span>
            <span className={styles.metricLabel}>Tools</span>
          </div>
          <div className={styles.metric}>
            <span className={styles.metricValue}>{pad2(Object.keys(sources).length)}</span>
            <span className={styles.metricLabel}>Sources</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
          <span className={styles.sys}>
            <span className={styles.led} data-state="active" />
            <span className={styles.sysText}>All systems nominal</span>
          </span>
          <span className={styles.kbd}>
            <b>⌘K</b> command palette
          </span>
        </div>
      </header>

      {/* ── Idea intake ──────────────────────────────────────────────── */}
      <div className={styles.sectionHead} id="idea-intake">
        <span className={styles.sectionLabel}>Idea Intake</span>
        <span className={styles.sectionMeta}>idea → board → queue</span>
      </div>

      <section className={`${styles.reveal}`} style={{ animationDelay: '0.02s' }}>
        <IdeaConsole projects={projects.map((p) => ({ name: p.name }))} />
      </section>

      {/* ── Task queue ───────────────────────────────────────────────── */}
      <div className={styles.sectionHead} id="task-queue">
        <span className={styles.sectionLabel}>Task Queue</span>
        <span className={styles.sectionMeta}>proposed → approve → queued</span>
      </div>

      <section className={`${styles.reveal}`} style={{ animationDelay: '0.06s' }}>
        <QueueBoard />
      </section>

      {/* ── Portfolio ────────────────────────────────────────────────── */}
      <div className={styles.sectionHead} id="portfolio">
        <span className={styles.sectionLabel}>Portfolio Registry</span>
        <span className={styles.sectionMeta}>{projects.length} units · {activeCount} live</span>
      </div>

      <section className={styles.panelGrid}>
        {projects.map((project: CommandCentreProject, i: number) => (
          <article
            key={project.name}
            className={`${styles.panel} ${styles.reveal}`}
            style={{ '--swatch': swatchFor(project.name), animationDelay: `${0.04 * i}s` } as React.CSSProperties}
          >
            <div className={styles.panelHead}>
              <span className={styles.led} data-state={ledState(project.status)} />
              <span className={styles.pname}>{project.name}</span>
              <span className={styles.statusTag}>{project.status}</span>
            </div>

            <p className={styles.ppurpose}>{project.business_purpose}</p>

            <div className={styles.readouts}>
              <div className={styles.readout}>
                <span className={styles.readoutKey}>Deploy</span>
                <span className={styles.readoutVal}>{project.deployment_target}</span>
              </div>
              <div className={styles.readout}>
                <span className={styles.readoutKey}>Linear</span>
                <span className={styles.readoutVal}>{project.linear_prefix}-*</span>
              </div>
              {project.github_repo && (
                <div className={styles.readout}>
                  <span className={styles.readoutKey}>Repo</span>
                  <span className={styles.readoutVal}>{project.github_repo}</span>
                </div>
              )}
              {project.production_url && (
                <a
                  className={styles.plink}
                  href={project.production_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ↗ {hostOf(project.production_url)}
                </a>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* ── Capability bus ───────────────────────────────────────────── */}
      <div className={styles.sectionHead} id="capability-bus">
        <span className={styles.sectionLabel}>Capability Bus</span>
        <span className={styles.sectionMeta}>{tools.length} tools · {Object.keys(sources).length} sources</span>
      </div>

      <section className={`${styles.bus} ${styles.reveal}`} style={{ animationDelay: '0.1s' }}>
        <div className={styles.busTop}>
          <div className={styles.sources}>
            {Object.entries(sources).map(([source, count]) => (
              <span key={source} className={styles.sourceChip}>
                {source} <b>{count}</b>
              </span>
            ))}
          </div>
          <span className={styles.stamp}>
            <span className={styles.led} data-state="active" />
            List-only · no execution
          </span>
        </div>

        <div className={styles.toolGrid}>
          {tools.map((tool) => (
            <div
              key={tool.tool_key}
              className={styles.toolRow}
              style={{ '--rail': railFor(tool.risk_class) } as React.CSSProperties}
            >
              <div style={{ minWidth: 0 }}>
                <div className={styles.toolKey}>{tool.tool_key}</div>
                <div className={styles.toolDesc}>{tool.description}</div>
              </div>
              <div style={{ flexShrink: 0, textAlign: 'right' }}>
                <span className={styles.riskTag}>{tool.risk_class}</span>
                {tool.approval_required && <span className={styles.approval}>approval</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
