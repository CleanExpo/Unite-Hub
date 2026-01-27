/**
 * Populate Unite-Hub Linear Project
 *
 * One-time script to set up the Unite-Hub project in Linear with
 * accurate description, status, and development issues.
 */

import { LinearClient } from '@linear/sdk';

const API_KEY = process.env.LINEAR_API_KEY;
if (!API_KEY) {
  console.error('LINEAR_API_KEY environment variable required');
  process.exit(1);
}

const client = new LinearClient({ apiKey: API_KEY });

async function main() {
  console.log('Connecting to Linear...');

  // 1. Verify connection
  const viewer = await client.viewer;
  console.log(`Authenticated as: ${viewer.name} (${viewer.email})`);

  // 2. Get teams
  const teams = await client.teams();
  const uniteHubTeam = teams.nodes.find(t => t.name === 'Unite-Hub');
  if (!uniteHubTeam) {
    console.error('Unite-Hub team not found. Available teams:', teams.nodes.map(t => t.name));
    process.exit(1);
  }
  console.log(`Team: ${uniteHubTeam.name} (${uniteHubTeam.key})`);

  // 3. Find Unite-Hub project
  const projects = await client.projects();
  console.log(`Found ${projects.nodes.length} projects:`);
  for (const p of projects.nodes) {
    console.log(`  - ${p.name} (${p.id}) state=${p.state}`);
  }

  const project = projects.nodes.find(p => p.name === 'Unite-Hub');
  if (!project) {
    console.error('Unite-Hub project not found');
    process.exit(1);
  }
  console.log(`\nTarget project: ${project.name} (${project.id})`);

  // 4. Update project properties
  console.log('\nUpdating project...');
  const description = `AI-first marketing CRM and automation platform for agencies.

**Tech Stack**: Next.js 16 (App Router), React 19, Supabase PostgreSQL, Anthropic Claude API, TypeScript 5.x

**Products**:
- **Unite-Hub**: Core CRM — email, contacts, campaigns, AI agents, 100+ API routes
- **Synthex.social**: White-label AI marketing platform for small businesses

**Architecture**: Three-layer — Next.js App Router → AI Agent Layer (43 agents) → Supabase PostgreSQL (100+ tables, multi-tenant RLS)

**Key Integrations**: Linear, Gmail, Google Search Console, Stripe, Brave Search, Claude AI (Opus/Sonnet/Haiku)

**Repository**: https://github.com/CleanExpo/Unite-Hub`;

  try {
    const updateResult = await client.updateProject(project.id, {
      description: description,
      state: 'started',
      startDate: '2024-11-01',
      targetDate: '2026-06-30',
    });
    console.log(`Project update success: ${updateResult.success}`);
  } catch (err) {
    console.error('Project update error:', err.message);
  }

  // 5. Get workflow states for issue creation
  const states = await uniteHubTeam.states();
  console.log('\nWorkflow states:');
  const stateMap = {};
  for (const s of states.nodes) {
    console.log(`  - ${s.name} (${s.type}) id=${s.id}`);
    stateMap[s.name.toLowerCase()] = s.id;
  }

  // 6. Check existing issues
  const existingIssues = await project.issues();
  const existingTitles = existingIssues.nodes.map(i => i.title);
  console.log(`\nExisting issues: ${existingTitles.length}`);
  existingTitles.forEach(t => console.log(`  - ${t}`));

  // 7. Create development issues
  const issues = [
    {
      title: 'Core CRM Platform — Contacts, Campaigns, Email',
      description: `## Scope\n- Contact management with workspace isolation\n- Campaign creation and scheduling\n- Email integration (Gmail OAuth, SendGrid/Resend)\n- Multi-tenant RLS on all tables\n\n## Status\n✅ Complete — 100+ API routes, full CRUD, workspace filtering`,
      priority: 2, // High
      state: 'done',
    },
    {
      title: 'AI Agent Layer — 43 Agents with Orchestrator',
      description: `## Scope\n- Email Agent: Extract intents from incoming emails\n- Content Agent: Generate personalized campaigns\n- Orchestrator: Coordinate multi-agent workflows\n- 8 Founder OS Agents: Business intelligence\n- AI Phill, Cognitive Twin, SEO Leak, Social Inbox, etc.\n\n## Status\n✅ Complete — Class 1 Grade 4 (verification + feedback loops)`,
      priority: 2,
      state: 'done',
    },
    {
      title: 'Dashboard & UI — Design System Implementation',
      description: `## Scope\n- 28+ dashboard pages with shadcn/ui components\n- Design token system (bg-bg-card, accent-500 orange)\n- Responsive layout with mobile sidebar\n- Loading skeletons, error boundaries, 404 pages\n\n## Status\n✅ Complete — Design system enforced, 9/10 quality gate`,
      priority: 3, // Medium
      state: 'done',
    },
    {
      title: 'Linear Integration — API Client & Dashboard',
      description: `## Scope\n- @linear/sdk v38 integration\n- 6 API endpoints (projects, issues CRUD)\n- Webhook handler with HMAC verification\n- React dashboard component at /dashboard/linear\n- linearClient.ts with 20+ methods\n\n## Status\n✅ Code complete — API key now configured`,
      priority: 3,
      state: 'done',
    },
    {
      title: 'Google OAuth & Search Console Integration',
      description: `## Scope\n- Google OAuth 2.0 for authentication\n- Google Search Console API enabled\n- Scopes: email, profile, openid, webmasters, webmasters.readonly\n- Supabase Auth with PKCE flow\n\n## Status\n✅ Complete — OAuth configured in Google Cloud Console`,
      priority: 3,
      state: 'done',
    },
    {
      title: 'Production Hardening — Security, Error Handling, SEO',
      description: `## Scope\n- Security headers (X-Frame-Options, CSP, CSRF)\n- Rate limiting on public API routes\n- Input sanitization (HTML strip, entity encode)\n- Sentry error monitoring\n- Error boundaries + global error pages\n- Loading skeleton states\n- SEO metadata (OG tags, robots.txt, sitemap)\n- Health endpoint (/api/health)\n\n## Status\n🔄 In Progress — Applied to RestoreAssist, pending Unite-Hub`,
      priority: 2,
      state: 'in progress',
    },
    {
      title: 'Synthex.social — White-label AI Marketing Platform',
      description: `## Scope\n- Experiment engine (A/B testing)\n- Financial tracking (accounts, transactions)\n- Market radar (competitor monitoring)\n- White-label theming per client\n\n## Status\n🔄 In Progress — Phase D45 (market radar)`,
      priority: 3,
      state: 'in progress',
    },
    {
      title: 'Founder Intelligence OS — 8 Agent System',
      description: `## Scope\n- AI Phill: Strategic advisor with journal\n- Cognitive Twin: 13-domain business health monitoring\n- SEO Leak: Competitive intelligence\n- Social Inbox: Multi-platform monitoring\n- Pre-Client: Lead clustering\n- Boost Bump: Background job queue\n\n## Status\n🔄 In Progress — Phase 5 complete (real-time monitoring, WebSocket alerts)`,
      priority: 3,
      state: 'in progress',
    },
    {
      title: 'Deployment & CI/CD — Vercel + Supabase',
      description: `## Scope\n- Vercel deployment (syd1 region)\n- Supabase PostgreSQL with connection pooling\n- Environment variable management\n- Docker support (optional)\n- GitHub Actions CI\n\n## Status\n⏳ Todo — Production deployment pipeline needed`,
      priority: 2,
      state: 'todo',
    },
    {
      title: 'Testing — Unit, Integration, E2E, Load',
      description: `## Scope\n- 235+ Vitest unit tests (100% pass)\n- Playwright E2E tests\n- Pact contract tests\n- Percy visual regression\n- k6 load tests (contacts, auth)\n\n## Status\n🔄 In Progress — Core tests passing, need E2E expansion`,
      priority: 3,
      state: 'in progress',
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const issue of issues) {
    if (existingTitles.some(t => t === issue.title)) {
      console.log(`  SKIP (exists): ${issue.title}`);
      skipped++;
      continue;
    }

    // Find state ID
    const stateId = stateMap[issue.state] || stateMap['backlog'];

    try {
      const result = await client.createIssue({
        teamId: uniteHubTeam.id,
        projectId: project.id,
        title: issue.title,
        description: issue.description,
        priority: issue.priority,
        stateId: stateId,
      });

      if (result.success) {
        const newIssue = await result.issue;
        console.log(`  CREATED: ${newIssue?.identifier} — ${issue.title}`);
        created++;
      } else {
        console.error(`  FAILED: ${issue.title}`);
      }
    } catch (err) {
      console.error(`  ERROR creating "${issue.title}": ${err.message}`);
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total issues: ${created + skipped + existingTitles.length}`);

  // 8. Final project status
  const updatedProject = await client.project(project.id);
  console.log(`\nProject: ${updatedProject.name}`);
  console.log(`State: ${updatedProject.state}`);
  console.log(`Progress: ${Math.round(updatedProject.progress * 100)}%`);
  console.log(`URL: ${updatedProject.url}`);
  console.log('\nDone!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
