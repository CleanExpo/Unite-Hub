"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardRoot() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dashboard/overview");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <p className="text-white/30">Loading dashboard...</p>
    </div>
  );
}
