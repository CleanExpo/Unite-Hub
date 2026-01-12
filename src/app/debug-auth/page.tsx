"use client";

import { useAuth } from "@/contexts/AuthContext";
import { supabaseBrowser } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function DebugAuthPage() {
  const auth = useAuth();
  const [sessionInfo, setSessionInfo] = useState<any>(null);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data, error }) => {
      setSessionInfo({ session: data.session, error });
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Auth Debug Page</h1>

      <div className="space-y-6">
        {/* AuthContext State */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">AuthContext State</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-400">Loading:</span>{" "}
              <span className={auth.loading ? "text-warning-400" : "text-success-400"}>
                {auth.loading ? "TRUE" : "FALSE"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">User:</span>{" "}
              <span className={auth.user ? "text-success-400" : "text-error-400"}>
                {auth.user ? auth.user.email : "NULL"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Profile:</span>{" "}
              <span className={auth.profile ? "text-success-400" : "text-error-400"}>
                {auth.profile ? auth.profile.full_name : "NULL"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Organizations:</span>{" "}
              <span className={auth.organizations.length > 0 ? "text-success-400" : "text-error-400"}>
                {auth.organizations.length} orgs
              </span>
            </div>
            <div>
              <span className="text-gray-400">Current Org:</span>{" "}
              <span className={auth.currentOrganization ? "text-success-400" : "text-error-400"}>
                {auth.currentOrganization?.organization?.name || "NULL"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Workspace ID:</span>{" "}
              <span className={auth.currentOrganization?.org_id ? "text-success-400" : "text-error-400"}>
                {auth.currentOrganization?.org_id || "NULL"}
              </span>
            </div>
          </div>
        </section>

        {/* Session Info */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Session Info</h2>
          <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(sessionInfo, null, 2)}
          </pre>
        </section>

        {/* Organizations Detail */}
        {auth.organizations.length > 0 && (
          <section className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Organizations Detail</h2>
            <pre className="bg-gray-900 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(auth.organizations, null, 2)}
            </pre>
          </section>
        )}

        {/* Actions */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-info-600 rounded hover:bg-info-700"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                auth.signOut();
                setTimeout(() => window.location.href = '/login', 500);
              }}
              className="px-4 py-2 bg-error-600 rounded hover:bg-error-700"
            >
              Sign Out
            </button>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-accent-600 rounded hover:bg-accent-700"
            >
              Clear LocalStorage & Reload
            </button>
          </div>
        </section>

        {/* Console Instructions */}
        <section className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debugging Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
            <li>Open Browser Console (F12)</li>
            <li>Look for messages starting with <code className="bg-gray-900 px-1">[AuthContext]</code></li>
            <li>Check if "loading = false" message appears</li>
            <li>If stuck, check Network tab for failed requests</li>
            <li>Check Application tab → Local Storage for session</li>
          </ol>
        </section>
      </div>
    </div>
  );
}
