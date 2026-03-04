"use client";

import React from "react";
import { redirect } from "next/navigation";

// Portal dashboard redirects to the main client portal
export default function PortalDashboardPage() {
  redirect("/client");
}
