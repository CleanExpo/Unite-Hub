"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <main className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        Welcome to Your Dashboard
      </h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2"><strong>Email:</strong> {user?.email}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="text-center bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Projects</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-gray-600">Active Projects</p>
          </CardContent>
        </Card>
        
        <Card className="text-center bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Tasks</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-gray-600">Pending Tasks</p>
          </CardContent>
        </Card>
        
        <Card className="text-center bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-2">Team</h3>
            <p className="text-3xl font-bold text-yellow-600">1</p>
            <p className="text-sm text-gray-600">Team Members</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <Button asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/organizations">Manage Organizations</Link>
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              Add Task
            </Button>
            <Button className="bg-amber-600 hover:bg-amber-700">
              Invite Team Member
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
