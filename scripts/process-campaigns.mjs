#!/usr/bin/env node

async function processCampaigns() {
  console.log("⏰ Processing pending campaign steps...\n");

  try {
    const baseUrl = process.env.UNITE_HUB_BASE_URL || "http://localhost:3008";
    const response = await fetch(
      `${baseUrl}/api/campaigns/drip`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_pending",
          dryRun: true,
        }),
      }
    );

    const { result } = await response.json();

    console.log(`✅ Processed ${result.processed} steps`);
    console.log(`❌ Failed ${result.failed} steps`);
    console.log("\n✨ Campaign processing complete!");
  } catch (error) {
    console.error("Error:", error);
  }
}

processCampaigns();
