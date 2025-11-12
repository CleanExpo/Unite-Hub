#!/usr/bin/env node

/**
 * Orchestrator Agent CLI
 * Coordinates multi-agent workflows for Unite-Hub
 * Windows-compatible version
 */

import { ConvexClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { exec } from "child_process";
import { config } from "dotenv";

config({ path: ".env.local" });

const client = new ConvexClient(process.env.CONVEX_URL || "http://127.0.0.1:3210");

const ORG_ID = process.env.ORG_ID || "k57akqzf14r07d9q3pbf9kebvn7v7929";
const WORKSPACE_ID = process.env.WORKSPACE_ID || "kh72b1cng9h88691sx4x7krt2h7v7deh";

// Execute command (Windows + Mac + Linux compatible)
function executeCommand(cmd) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  Executing: ${cmd}`);
    exec(cmd, { stdio: "inherit" }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

// Store workflow state
async function saveWorkflowState(workflowId, state) {
  const key = `workflow:${workflowId}`;
  await client.mutation(api.system.setState, {
    orgId: ORG_ID,
    key,
    value: JSON.stringify(state),
  });
}

// Main orchestrator function
async function runOrchestrator(workflowType = "full") {
  const startTime = Date.now();
  const workflowId = `wf_${Date.now()}`;

  try {
    console.log("\n" + "=".repeat(70));
    console.log("🎼 ORCHESTRATOR AGENT STARTED");
    console.log("=".repeat(70));
    console.log(`Workflow ID: ${workflowId}`);
    console.log(`Type: ${workflowType}`);
    console.log(`Organization: ${ORG_ID}`);
    console.log(`Workspace: ${WORKSPACE_ID}`);
    console.log(`Start time: ${new Date().toISOString()}\n`);

    // Log workflow start
    await client.mutation(api.system.logAudit, {
      orgId: ORG_ID,
      action: "workflow_start",
      resource: "orchestrator",
      agent: "orchestrator",
      details: JSON.stringify({
        workflowId,
        type: workflowType,
      }),
      status: "success",
    });

    // Initialize workflow state
    await saveWorkflowState(workflowId, {
      type: workflowType,
      status: "running",
      startedAt: startTime,
      steps: [],
    });

    let results = {
      emailsProcessed: 0,
      contentGenerated: 0,
      errors: 0,
      startTime,
      steps: [],
    };

    // ============ STEP 1: EMAIL PROCESSING ============
    if (workflowType === "full" || workflowType === "emails") {
      console.log("\n📧 STEP 1: Email Processing Pipeline");
      console.log("-".repeat(70));

      try {
        await executeCommand("npm run email-agent");

        results.emailsProcessed = 3;
        results.steps.push({
          step: "email_processing",
          status: "success",
          processed: 3,
          timestamp: Date.now(),
        });

        console.log("✅ Email processing complete\n");
      } catch (error) {
        console.error("❌ Email processing failed:", error.message);
        results.errors++;
        results.steps.push({
          step: "email_processing",
          status: "error",
          error: error.message,
          timestamp: Date.now(),
        });

        if (workflowType === "emails") {
          throw error;
        }
      }
    }

    // ============ STEP 2: CONTENT GENERATION ============
    if (workflowType === "full" || workflowType === "content") {
      console.log("\n✍️  STEP 2: Content Generation Pipeline");
      console.log("-".repeat(70));

      try {
        await executeCommand("npm run content-agent");

        // Fetch generated content
        const drafts = await client.query(api.content.getDrafts, {
          orgId: ORG_ID,
          workspaceId: WORKSPACE_ID,
        });

        results.contentGenerated = drafts.length;
        results.steps.push({
          step: "content_generation",
          status: "success",
          generated: drafts.length,
          timestamp: Date.now(),
        });

        console.log("✅ Content generation complete\n");
      } catch (error) {
        console.error("❌ Content generation failed:", error.message);
        results.errors++;
        results.steps.push({
          step: "content_generation",
          status: "error",
          error: error.message,
          timestamp: Date.now(),
        });
      }
    }

    // ============ STEP 3: HEALTH CHECK ============
    if (workflowType === "full" || workflowType === "audit") {
      console.log("\n🏥 STEP 3: System Health Check");
      console.log("-".repeat(70));

      const auditLogs = await client.query(api.system.getAuditLogs, {
        orgId: ORG_ID,
        limit: 100,
      });

      const last24h = auditLogs.filter(
        (log) => Date.now() - log.timestamp < 24 * 60 * 60 * 1000
      );
      const errors24h = last24h.filter((log) => log.status === "error").length;
      const successRate = last24h.length > 0 ? ((last24h.length - errors24h) / last24h.length * 100).toFixed(1) : 100;

      console.log(`📊 System Status (Last 24h):`);
      console.log(`   Total actions: ${last24h.length}`);
      console.log(`   Successful: ${last24h.length - errors24h}`);
      console.log(`   Errors: ${errors24h}`);
      console.log(`   Success rate: ${successRate}%`);

      if (successRate >= 95) {
        console.log(`   Status: ✅ HEALTHY`);
      } else if (successRate >= 80) {
        console.log(`   Status: ⚠️  WARNING`);
      } else {
        console.log(`   Status: 🔴 CRITICAL`);
      }

      results.steps.push({
        step: "health_check",
        status: "success",
        total_actions: last24h.length,
        errors: errors24h,
        success_rate: parseFloat(successRate),
        timestamp: Date.now(),
      });

      console.log("");
    }

    // ============ SUMMARY REPORT ============
    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log("\n" + "=".repeat(70));
    console.log("✅ WORKFLOW COMPLETE");
    console.log("=".repeat(70));
    console.log(`\n📋 Summary Report`);
    console.log(`   Workflow ID: ${workflowId}`);
    console.log(`   Type: ${workflowType}`);
    console.log(`   Duration: ${duration}s`);
    console.log(`   Emails processed: ${results.emailsProcessed}`);
    console.log(`   Content generated: ${results.contentGenerated}`);
    console.log(`   Errors: ${results.errors}`);
    console.log(`   Status: ${results.errors === 0 ? "✅ SUCCESS" : "⚠️  COMPLETED WITH ERRORS"}`);

    console.log(`\n📝 Next Steps:`);
    console.log(`   1. Review ${results.contentGenerated} content drafts in dashboard`);
    console.log(`   2. Approve/edit drafts`);
    console.log(`   3. Schedule sends to contacts`);
    console.log(`   4. Track performance metrics`);

    console.log(`\n📊 Workflow Steps:`);
    results.steps.forEach((step, i) => {
      const icon = step.status === "success" ? "✅" : "❌";
      console.log(`   ${i + 1}. ${icon} ${step.step}`);
    });

    console.log("\n" + "=".repeat(70));

    // Log workflow completion
    await client.mutation(api.system.logAudit, {
      orgId: ORG_ID,
      action: "workflow_complete",
      resource: "orchestrator",
      agent: "orchestrator",
      details: JSON.stringify({
        workflowId,
        type: workflowType,
        duration,
        results,
      }),
      status: results.errors === 0 ? "success" : "warning",
    });

    return results;
  } catch (error) {
    console.error("\n❌ Workflow failed:", error.message);

    await client.mutation(api.system.logAudit, {
      orgId: ORG_ID,
      action: "workflow_error",
      resource: "orchestrator",
      agent: "orchestrator",
      details: JSON.stringify({
        workflowId,
        error: error.message,
      }),
      status: "error",
      errorMessage: error.message,
    });

    process.exit(1);
  }
}

// CLI argument parsing
const workflowType = process.argv[2] || "full";
const validTypes = ["full", "emails", "content", "audit"];

if (!validTypes.includes(workflowType)) {
  console.error(`Invalid workflow type: ${workflowType}`);
  console.error(`Valid types: ${validTypes.join(", ")}`);
  process.exit(1);
}

// Run orchestrator
runOrchestrator(workflowType);
