/**
 * Unite-Hub Cross-Business Dashboard — UNI-868
 * Real-time view of all 6 businesses in one screen.
 * Redirects to the fully-built /staff/dashboard KPI view.
 */

import { redirect } from "next/navigation";

export default function UniteHubCrossBusinessDashboard() {
  redirect("/staff/dashboard");
}
