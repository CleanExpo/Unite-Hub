/**
 * TEST DEMO INITIALIZATION
 * Simple script to test the demo initialization API endpoint
 */

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function testDemoInitialization() {
  console.log("Testing Demo Initialization API");
  console.log("================================\n");

  try {
    // Test 1: Check demo status (GET)
    console.log("1. Checking demo status...");
    const statusResponse = await fetch(`${API_URL}/api/demo/initialize`, {
      method: "GET",
    });

    const statusData = await statusResponse.json();
    console.log("Status:", JSON.stringify(statusData, null, 2));
    console.log("");

    // Test 2: Initialize demo (POST)
    console.log("2. Initializing demo...");
    const initResponse = await fetch(`${API_URL}/api/demo/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const initData = await initResponse.json();

    if (initData.success) {
      console.log("✓ Demo initialized successfully!");
      console.log("\nDemo Data:");
      console.log("- Organization ID:", initData.data.orgId);
      console.log("- Client ID:", initData.data.clientId);
      console.log("- Persona ID:", initData.data.personaId);
      console.log("- Strategy ID:", initData.data.strategyId);
      console.log("- Calendar Posts:", initData.data.postCount);
      console.log("\nDemo Details:");
      console.log("- Organization:", initData.demo.organizationName);
      console.log("- Client:", initData.demo.clientName);
      console.log("- Persona:", initData.demo.personaName);
      console.log("- Strategy:", initData.demo.strategyTitle);
    } else {
      console.error("✗ Demo initialization failed:", initData.error);
      console.error("Message:", initData.message);
    }
    console.log("");

    // Test 3: Check demo status again (should show initialized)
    console.log("3. Verifying demo status...");
    const verifyResponse = await fetch(`${API_URL}/api/demo/initialize`, {
      method: "GET",
    });

    const verifyData = await verifyResponse.json();
    console.log("Verification:", JSON.stringify(verifyData, null, 2));

    if (verifyData.initialized) {
      console.log("\n✓ Demo is fully initialized and verified!");
    } else {
      console.error("\n✗ Demo verification failed");
    }
  } catch (error) {
    console.error("\n✗ Test failed with error:", error.message);
    console.error(error);
  }
}

// Run the test
testDemoInitialization();
