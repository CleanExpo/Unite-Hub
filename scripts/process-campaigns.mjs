#!/usr/bin/env node

async function processCampaigns() {
  console.log("⏰ Processing pending campaign steps...\n");

  try {
    const response = await fetch(
      "http://localhost:3008/api/campaigns/drip",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_pending",
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
