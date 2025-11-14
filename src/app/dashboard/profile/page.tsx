"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Please log in to view your profile.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-gray-900">{user.email}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <div className="mt-1 text-gray-600 text-sm font-mono">{user.id}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Created</label>
            <div className="mt-1 text-gray-600 text-sm">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
