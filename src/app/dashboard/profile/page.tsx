"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auth context handles user loading
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);

  // Generate initials from user's full name
  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Profile" }]} />

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-slate-400">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar and Name */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {profile?.avatar_url && (
                <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
              )}
              <AvatarFallback className="text-2xl">{getInitials(profile?.full_name)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-white">{profile?.full_name || user.email?.split('@')[0]}</h2>
              <p className="text-slate-400">{user.email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700"></div>

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Email Address</label>
              <div className="text-white">{user.email}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <div className="text-white">{profile?.full_name || "Not set"}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">User ID</label>
              <div className="text-slate-300 text-sm font-mono">{user.id}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Account Created</label>
              <div className="text-white">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {profile?.bio && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-400 mb-1">Bio</label>
                <div className="text-white">{profile.bio}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Account Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-900 rounded-lg">
              <div className="text-2xl font-bold text-white">Active</div>
              <div className="text-sm text-slate-400">Account Status</div>
            </div>
            <div className="text-center p-4 bg-slate-900 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))}
              </div>
              <div className="text-sm text-slate-400">Days Since Join</div>
            </div>
            <div className="text-center p-4 bg-slate-900 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString()}
              </div>
              <div className="text-sm text-slate-400">Last Sign In</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
