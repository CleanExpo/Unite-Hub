#!/usr/bin/env node

/**
 * Fix User Initialization Script - Simplified
 *
 * Fixes: user missing profile or organization link
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TARGET_USER_ID = process.argv[2] || "0082768b-c40a-4c4e-8150-84a3dd406cbc";

console.log(`\n🔧 Fixing initialization for user: ${TARGET_USER_ID}\n`);

async function fixUserInitialization() {
  // 1. Get user from auth
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(TARGET_USER_ID);

  if (authError || !authUser) {
    console.error("❌ User not found:", authError?.message);
    process.exit(1);
  }

  console.log(`✅ User: ${authUser.user.email}`);

  // 2. Check/Create profile
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("*")
    .eq("id", TARGET_USER_ID)
    .maybeSingle();

  if (!profile) {
    const fullName = authUser.user.user_metadata?.full_name || authUser.user.email?.split("@")[0] || "User";

    await supabaseAdmin.from("user_profiles").insert({
      id: TARGET_USER_ID,
      email: authUser.user.email,
      full_name: fullName,
    });

    console.log("✅ Profile created");
  } else {
    console.log("✅ Profile exists");
  }

  // 3. Check user_organizations
  const { data: userOrgs } = await supabaseAdmin
    .from("user_organizations")
    .select("*, organizations(id, name)")
    .eq("user_id", TARGET_USER_ID);

  let orgId;

  if (!userOrgs || userOrgs.length === 0) {
    // Create org
    const { data: newOrg } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: `${authUser.user.email?.split("@")[0]}'s Organization`,
        email: authUser.user.email,
        plan: "starter",
        status: "trial",
      })
      .select()
      .single();

    orgId = newOrg.id;
    console.log(`✅ Organization created: ${newOrg.name}`);

    // Create workspace
    const { data: newWorkspace } = await supabaseAdmin
      .from("workspaces")
      .insert({
        org_id: orgId,
        name: "Default Workspace",
      })
      .select()
      .single();

    console.log(`✅ Workspace created: ${newWorkspace.name}`);

    // Link user to org (NO workspace_id column - that doesn't exist!)
    await supabaseAdmin.from("user_organizations").insert({
      user_id: TARGET_USER_ID,
      org_id: orgId,
      role: "owner",
      is_active: true,
    });

    console.log("✅ User linked to organization");
  } else {
    console.log(`✅ Organization exists: ${userOrgs[0].organizations.name}`);
    orgId = userOrgs[0].org_id;
  }

  // 4. Verify
  console.log("\n📊 Final Status:\n");

  const { data: check } = await supabaseAdmin
    .from("user_organizations")
    .select(`
      user_id,
      org_id,
      role,
      organizations(name, status),
      workspaces:workspaces!inner(id, name)
    `)
    .eq("user_id", TARGET_USER_ID)
    .eq("workspaces.org_id", orgId)
    .single();

  if (check) {
    console.log("✅ User ID:", check.user_id);
    console.log("✅ Organization:", check.organizations.name);
    console.log("✅ Workspace:", check.workspaces?.name, `(${check.workspaces?.id})`);
    console.log("✅ Role:", check.role);
    console.log("\n🎉 Initialization complete! User should now be able to access the dashboard.");
  }
}

fixUserInitialization().catch(console.error);
