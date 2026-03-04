"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * DEMO MODE - Quick access for testing features
 * Bypasses authentication for development/testing
 */
export default function DemoPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Initializing demo...");

  useEffect(() => {
    const initDemo = async () => {
      try {
        setStatus("Creating demo organization and client...");

        // Call demo initialization endpoint
        const response = await fetch("/api/demo/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          throw new Error("Failed to initialize demo");
        }

        const data = await response.json();

        // Set demo session in localStorage
        localStorage.setItem("demo_mode", "true");
        localStorage.setItem("demo_org_id", data.orgId || "demo-org-123");
        localStorage.setItem("demo_client_id", data.clientId || "demo-client-456");
        localStorage.setItem("unite_hub_current_client_id", data.clientId || "demo-client-456");

        setStatus("Redirecting to dashboard...");

        // Redirect to dashboard
        setTimeout(() => {
          router.push("/dashboard/overview");
        }, 500);
      } catch (error) {
        console.error("Demo initialization error:", error);
        // Fallback to static IDs if API fails
        localStorage.setItem("demo_mode", "true");
        localStorage.setItem("demo_org_id", "demo-org-123");
        localStorage.setItem("demo_client_id", "demo-client-456");
        localStorage.setItem("unite_hub_current_client_id", "demo-client-456");

        setStatus("Redirecting to dashboard...");
        setTimeout(() => {
          router.push("/dashboard/overview");
        }, 500);
      }
    };

    initDemo();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4">
          <span className="text-white font-bold text-2xl">🧪</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Entering Demo Mode</h1>
        <p className="text-slate-400">{status}</p>
        <div className="flex gap-2 justify-center items-center mt-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
}
