/**
 * Populate ALL Linear Projects
 * Updates description, status, dates, and creates issues for each project.
 */

import { LinearClient } from '@linear/sdk';

const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) {
  console.error('LINEAR_API_KEY required');
  process.exit(1);
}

const client = new LinearClient({ apiKey: API_KEY });

// Project definitions
const PROJECT_CONFIGS = {
  'Restore Assist': {
    description: 'Disaster recovery inspection and assessment platform. Next.js 14, Prisma, PostgreSQL, Tailwind CSS. NIR inspections, claims management, authority forms, PDF generation. Live at disaster-recovery-seven.vercel.app',
    state: 'started',
    startDate: '2025-12-01',
    targetDate: '2026-03-31',
    issues: [
      { title: 'V1.1 — NIR Inspection Workflow', description: 'Non-Invasive Report inspection creation, editing, photo upload, PDF generation.', priority: 2, state: 'done' },
      { title: 'V1.2 — Interview & Assessment Module', description: 'Structured interview forms, damage assessment checklists, room-by-room inspection flow.', priority: 2, state: 'done' },
      { title: 'V1.3 — Claims Management System', description: 'Insurance claim tracking, status updates, document attachments, client communication log.', priority: 2, state: 'done' },
      { title: 'V1.4 — Authority Forms & UX Polish', description: 'Digital authority form signatures, form validation, responsive design improvements.', priority: 2, state: 'done' },
      { title: 'V1.5 — Production Hardening', description: 'Security headers, CSRF, rate limiting, Sentry monitoring, error boundaries, loading skeletons, mobile responsive sidebar, SEO metadata, health endpoint.', priority: 1, state: 'done' },
      { title: 'V2.0 — Multi-tenant SaaS Conversion', description: 'Convert from single-tenant to multi-tenant with workspace isolation, RLS policies, subscription billing via Stripe.', priority: 2, state: 'todo' },
    ],
  },

  'Synthex': {
    description: 'White-label AI marketing platform for small businesses (synthex.social). Experiment engine, financial tracking, market radar, competitor monitoring. Part of Unite-Hub ecosystem.',
    state: 'started',
    startDate: '2025-06-01',
    targetDate: '2026-06-30',
    issues: [
      { title: 'Core Platform — Multi-tenant White-label Engine', description: 'Client workspace isolation, custom branding per tenant, synthex_* table prefix schema, RLS policies.', priority: 2, state: 'done' },
      { title: 'Experiment Engine — A/B Testing Framework', description: 'synthex_exp_experiments table, variant management, traffic splitting, statistical significance calculation.', priority: 2, state: 'in progress' },
      { title: 'Financial Tracking — Accounts & Transactions', description: 'synthex_fin_accounts, transaction history, revenue attribution, ROI dashboards.', priority: 3, state: 'in progress' },
      { title: 'Market Radar — Competitor Monitoring (Phase D45)', description: 'Real-time competitor tracking, keyword monitoring, SERP position alerts, market share analysis.', priority: 2, state: 'in progress' },
      { title: 'Content Generation — AI Campaign Builder', description: 'Claude AI-powered content generation, multi-platform campaigns, A/B copy variants, scheduling.', priority: 3, state: 'todo' },
      { title: 'Client Dashboard — White-label Analytics', description: 'Branded analytics dashboard, KPI tracking, automated reports, client-facing metrics.', priority: 3, state: 'todo' },
    ],
  },

  'G-Pilot': {
    // Already has description, keep it
    state: 'started',
    issues: [
      { title: 'Core Agent Orchestration Framework', description: 'Gemini 2.0 agent runtime, task decomposition, parallel execution, state management across 14+ specialized agents.', priority: 1, state: 'in progress' },
      { title: 'Security Layer — Military-grade Encryption', description: 'End-to-end encryption, secure agent communication, credential vault, audit logging.', priority: 1, state: 'in progress' },
      { title: 'Agent Registry & Discovery', description: 'Dynamic agent registration, capability discovery, health monitoring, load balancing across agent pool.', priority: 2, state: 'in progress' },
      { title: 'Task Queue & Scheduling System', description: 'Priority-based task queue, cron scheduling, retry logic, dead letter queue, background job processing.', priority: 2, state: 'todo' },
      { title: 'Monitoring Dashboard', description: 'Real-time agent status, task throughput metrics, error rates, resource utilization, alerting.', priority: 3, state: 'todo' },
      { title: 'API Gateway & External Integrations', description: 'REST/GraphQL gateway, webhook management, third-party API connectors, rate limiting.', priority: 3, state: 'todo' },
    ],
  },

  'CCW-ERP/CRM': {
    description: 'Client ERP/CRM system for CCW. Business operations management including inventory, invoicing, customer relationships, and workflow automation.',
    state: 'planned',
    startDate: '2026-01-27',
    targetDate: '2026-04-30',
    issues: [
      { title: 'Requirements & Architecture Design', description: 'Client discovery, business process mapping, tech stack selection, database schema design.', priority: 1, state: 'in progress' },
      { title: 'Core CRM Module — Contacts & Companies', description: 'Contact management, company profiles, relationship mapping, activity timeline.', priority: 2, state: 'todo' },
      { title: 'ERP — Inventory & Stock Management', description: 'Product catalog, stock levels, warehouse tracking, reorder alerts, barcode scanning.', priority: 2, state: 'todo' },
      { title: 'Invoicing & Financial Module', description: 'Invoice generation, payment tracking, tax calculation, financial reporting, Xero/MYOB integration.', priority: 2, state: 'todo' },
      { title: 'Workflow Automation', description: 'Custom workflow builder, approval chains, notifications, task assignment, SLA tracking.', priority: 3, state: 'todo' },
      { title: 'Reporting & Analytics Dashboard', description: 'Business KPIs, sales pipeline, revenue forecasting, custom report builder.', priority: 3, state: 'backlog' },
    ],
  },

  'ATO': {
    description: 'Australian Tax Office compliance and integration project. Tax reporting automation, BAS lodgement, STP (Single Touch Payroll) compliance, ABN verification.',
    state: 'started',
    startDate: '2026-01-20',
    targetDate: '2026-01-30',
    issues: [
      { title: 'ATO API Integration — Authentication & Setup', description: 'ATO Developer Portal registration, OAuth2 machine-to-machine auth, API key management, sandbox testing.', priority: 1, state: 'in progress' },
      { title: 'BAS Lodgement Automation', description: 'Business Activity Statement data collection, GST calculation, automated lodgement via ATO API.', priority: 1, state: 'in progress' },
      { title: 'STP Phase 2 Compliance', description: 'Single Touch Payroll reporting, employee payment summaries, tax withholding calculations.', priority: 2, state: 'todo' },
      { title: 'ABN/TFN Verification Service', description: 'ABN Lookup API integration, TFN validation, entity type verification, GST registration status check.', priority: 2, state: 'todo' },
      { title: 'Tax Reporting Dashboard', description: 'Quarterly tax summary, obligation tracking, deadline reminders, compliance status overview.', priority: 3, state: 'todo' },
    ],
  },

  'DR - NRPG': {
    // Already has description and 5 issues, add more
    state: 'started',
    issues: [
      { title: 'Service Pages — 27 Sub-service Pages', description: 'Water damage, fire/smoke, mould remediation, storm damage, biohazard cleanup. SEO-optimized content pages with structured data.', priority: 2, state: 'done' },
      { title: 'Contractor Directory & Verification', description: 'Certified contractor profiles, license verification, service area coverage, review system, booking flow.', priority: 2, state: 'todo' },
      { title: 'Property Owner Portal', description: 'Damage assessment submission, contractor matching, job tracking, document upload, communication hub.', priority: 2, state: 'todo' },
      { title: 'SEO & Local Search Optimization', description: 'Schema markup for LocalBusiness, service area pages, Google Business Profile integration, citation management.', priority: 3, state: 'in progress' },
    ],
  },
};

async function main() {
  const viewer = await client.viewer;
  console.log(`Auth: ${viewer.name}\n`);

  // Get team
  const teams = await client.teams();
  const team = teams.nodes.find(t => t.name === 'Unite-Hub');
  if (!team) { console.error('Team not found'); process.exit(1); }

  // Get workflow states
  const states = await team.states();
  const stateMap = {};
  for (const s of states.nodes) {
    stateMap[s.name.toLowerCase()] = s.id;
  }
  console.log('States:', Object.keys(stateMap).join(', '));

  // Get all projects
  const projects = await client.projects();

  for (const [projectName, config] of Object.entries(PROJECT_CONFIGS)) {
    const project = projects.nodes.find(p => p.name === projectName);
    if (!project) {
      console.log(`\n--- SKIP: ${projectName} (not found) ---`);
      continue;
    }

    console.log(`\n--- ${projectName} (${project.id}) ---`);

    // Update project metadata
    const updateData = {};
    if (config.description && !project.description) updateData.description = config.description;
    if (config.state) updateData.state = config.state;
    if (config.startDate && !project.startDate) updateData.startDate = config.startDate;
    if (config.targetDate && !project.targetDate) updateData.targetDate = config.targetDate;

    if (Object.keys(updateData).length > 0) {
      try {
        const result = await client.updateProject(project.id, updateData);
        console.log(`  Updated: ${JSON.stringify(Object.keys(updateData))}, success=${result.success}`);
      } catch (err) {
        console.error(`  Update error: ${err.message}`);
      }
    } else {
      console.log('  Metadata: up to date');
    }

    // Create issues
    if (config.issues && config.issues.length > 0) {
      const existing = await project.issues();
      const existingTitles = existing.nodes.map(i => i.title);

      let created = 0;
      for (const issue of config.issues) {
        if (existingTitles.some(t => t === issue.title)) {
          continue;
        }

        const stateId = stateMap[issue.state] || stateMap['backlog'];
        try {
          const result = await client.createIssue({
            teamId: team.id,
            projectId: project.id,
            title: issue.title,
            description: issue.description,
            priority: issue.priority,
            stateId: stateId,
          });
          if (result.success) {
            const newIssue = await result.issue;
            console.log(`  + ${newIssue?.identifier}: ${issue.title}`);
            created++;
          }
        } catch (err) {
          console.error(`  Error: ${issue.title} — ${err.message}`);
        }
      }
      console.log(`  Created ${created} issues (${existingTitles.length} existing)`);
    }
  }

  console.log('\n=== All projects updated ===');
}

main().catch(e => { console.error(e); process.exit(1); });
