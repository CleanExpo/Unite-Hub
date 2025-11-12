"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRoot() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/overview");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <p className="text-slate-400">Loading dashboard...</p>
    </div>
  );
}
