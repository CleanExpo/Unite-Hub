"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRoot() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/overview");
  }, [router]);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <p className="text-text-muted">Loading dashboard...</p>
    </div>
  );
}
