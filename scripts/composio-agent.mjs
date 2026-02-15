/**
 * Composio Agent - Unite-Hub
 *
 * Uses Composio SDK with OpenAI Agents to execute tasks
 * across connected apps (Gmail, GitHub, Supabase, etc.)
 *
 * Usage: node scripts/composio-agent.mjs "Your task description"
 *
 * Requires:
 *   - COMPOSIO_API_KEY (ak_...) in .env.local
 *   - OPENAI_API_KEY in .env.local
 *   - Connected apps via Composio dashboard
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { Composio } from "@composio/core";
import { Agent, run } from "@openai/agents";
import { OpenAIAgentsProvider } from "@composio/openai-agents";

const COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY;
const EXTERNAL_USER_ID = process.env.COMPOSIO_USER_ID;

if (!COMPOSIO_API_KEY) {
  console.error("Missing COMPOSIO_API_KEY in .env.local");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY in .env.local");
  process.exit(1);
}

// Connection IDs for authenticated apps
const CONNECTIONS = {
  gmail: "ca_wJT3eNeEBNv9",
  github: "ca_Pi7sWzTJrGsv",
  supabase: "ca_xVSVPA1TsRHP",
  linear: "ca_8xcCyjw2bixa",
};

// Extra actions to load per toolkit (beyond the default toolkit tools)
const EXTRA_ACTIONS = {
  github: [
    "GITHUB_LIST_REPOSITORIES_FOR_THE_AUTHENTICATED_USER",
    "GITHUB_LIST_REPOSITORIES_FOR_A_USER",
    "GITHUB_LIST_ORGANIZATION_REPOSITORIES",
  ],
};

// Determine which toolkits to load based on task
const task =
  process.argv[2] ||
  "List my recent Gmail emails and summarize the top 3 unread ones.";

const taskLower = task.toLowerCase();
const toolkits = [];
const isMetaQuery =
  taskLower.includes("composio") ||
  taskLower.includes("connected app") ||
  taskLower.includes("connections") ||
  taskLower.includes("integrations") ||
  taskLower.includes("what apps");

if (
  taskLower.includes("email") ||
  taskLower.includes("gmail") ||
  taskLower.includes("mail")
) {
  toolkits.push("gmail");
}
if (
  taskLower.includes("github") ||
  taskLower.includes("repo") ||
  (taskLower.includes("issue") && !taskLower.includes("linear")) ||
  (taskLower.includes("pr") && !taskLower.includes("linear"))
) {
  toolkits.push("github");
}
if (
  taskLower.includes("supabase") ||
  taskLower.includes("database") ||
  taskLower.includes("db")
) {
  toolkits.push("supabase");
}
if (
  taskLower.includes("linear") ||
  taskLower.includes("ticket") ||
  taskLower.includes("sprint")
) {
  toolkits.push("linear");
}
// Default to gmail if no toolkit detected (unless meta query)
if (toolkits.length === 0 && !isMetaQuery) toolkits.push("gmail");

// Initialize Composio with OpenAI Agents provider
const provider = new OpenAIAgentsProvider();
const composio = new Composio({
  apiKey: COMPOSIO_API_KEY,
  provider: provider,
});

// Handle meta queries (connection listing) without loading toolkit tools
if (isMetaQuery && toolkits.length === 0) {
  console.log("Loading connection info...\n");

  const connList = await composio.connectedAccounts.list({
    user_id: EXTERNAL_USER_ID,
  });
  const connections = connList.items ?? connList ?? [];

  const connectionSummary = connections.map((c) => ({
    id: c.id,
    app: c.toolkit?.slug || c.appName || c.clientUniqueUserId || "unknown",
    status: c.status,
    created: c.createdAt,
  }));

  const connectionsJson = JSON.stringify(connectionSummary, null, 2);

  // Use a simple agent with connection data baked into instructions
  const agent = new Agent({
    name: "Unite-Hub Agent",
    model: "gpt-4o",
    instructions: `You are a helpful assistant for Unite-Hub, an AI-first CRM platform.
The user is asking about their Composio connected apps. Here is the live data:

${connectionsJson}

Present this information in a clean, readable format. Include the app name, status, connection ID, and creation date.
Known connection IDs: Gmail=${CONNECTIONS.gmail}, GitHub=${CONNECTIONS.github}, Supabase=${CONNECTIONS.supabase}, Linear=${CONNECTIONS.linear}`,
  });

  console.log(`Running: ${task}\n`);
  const result = await run(agent, task);
  console.log(`\nDone`);
  if (result.finalOutput) console.log(result.finalOutput);
  process.exit(0);
}

// Get connected account IDs for selected toolkits
const connectedAccountIds = toolkits
  .map((t) => CONNECTIONS[t])
  .filter(Boolean);

console.log(`Loading tools for: ${toolkits.join(", ")}`);

// Get raw tools directly (bypassing tool router)
const rawTools = await composio.tools.getRawComposioTools({
  toolkits: toolkits,
  connectedAccountIds: connectedAccountIds,
});

// Load extra actions for the selected toolkits
const extraActionSlugs = toolkits.flatMap((t) => EXTRA_ACTIONS[t] || []);
if (extraActionSlugs.length > 0) {
  const extraTools = await composio.tools.getRawComposioTools({
    tools: extraActionSlugs,
    connectedAccountIds: connectedAccountIds,
  });
  // Merge, avoiding duplicates
  const existingSlugs = new Set(rawTools.map((t) => (t.slug || t.name || "").toUpperCase()));
  for (const t of extraTools) {
    const slug = (t.slug || t.name || "").toUpperCase();
    if (!existingSlugs.has(slug)) {
      rawTools.push(t);
      existingSlugs.add(slug);
    }
  }
}

// Build a mapping of tool slug → version from raw tools
const toolVersionMap = {};
for (const tool of rawTools) {
  const slug = tool.slug || tool.name;
  if (slug && tool.version) {
    toolVersionMap[slug.toUpperCase()] = tool.version;
  }
}

// Custom execute function that properly passes userId + connectedAccountId
// (createExecuteFnForProviders doesn't propagate userId correctly)
const customExecuteFn = async (toolSlug, params) => {
  const slug = typeof toolSlug === "object" ? toolSlug.slug || toolSlug.name : toolSlug;
  const version = toolVersionMap[slug?.toUpperCase()] || undefined;

  // Determine the right connection ID based on toolkit prefix
  let accountId = connectedAccountIds[0];
  const slugUpper = (slug || "").toUpperCase();
  if (slugUpper.startsWith("GMAIL_")) accountId = CONNECTIONS.gmail;
  else if (slugUpper.startsWith("GITHUB_")) accountId = CONNECTIONS.github;
  else if (slugUpper.startsWith("SUPABASE_")) accountId = CONNECTIONS.supabase;
  else if (slugUpper.startsWith("LINEAR_")) accountId = CONNECTIONS.linear;

  console.log(`  → Executing: ${slug} (version: ${version || "auto"})`);

  const result = await composio.tools.execute(slug, {
    connectedAccountId: accountId,
    userId: EXTERNAL_USER_ID,
    arguments: params || {},
    ...(version ? { version } : {}),
  });

  return result;
};

// Wrap for OpenAI Agents format using custom executor
const tools = await provider.wrapTools(rawTools, customExecuteFn);

console.log(`Loaded ${tools.length} tools`);

// Create agent with direct tools
const agent = new Agent({
  name: "Unite-Hub Agent",
  model: "gpt-4o",
  instructions: `You are a helpful assistant for Unite-Hub, an AI-first CRM platform.
You have direct access to tools for: ${toolkits.join(", ")}.
Execute the user's request using the available tools.
Present results in a clean, readable format.
Do not ask for authentication - all apps are already connected.`,
  tools: tools,
});

console.log(`Running: ${task}\n`);

const result = await run(agent, task);

console.log(`\nDone`);
if (result.finalOutput) {
  console.log(result.finalOutput);
}
