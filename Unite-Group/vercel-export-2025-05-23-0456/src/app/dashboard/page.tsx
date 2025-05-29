"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

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
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
        Welcome to Your Dashboard
      </h1>
      
      <div style={{ 
        backgroundColor: "#f3f4f6", 
        padding: "1.5rem", 
        borderRadius: "0.5rem",
        marginBottom: "2rem"
      }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
          User Information
        </h2>
        <p>Email: {user?.email}</p>
        <p>User ID: {user?.id}</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
        <div style={{
          backgroundColor: "#dbeafe",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          textAlign: "center"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Projects</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>0</p>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Active Projects</p>
        </div>
        
        <div style={{
          backgroundColor: "#dcfce7",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          textAlign: "center"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Tasks</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>0</p>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Pending Tasks</p>
        </div>
        
        <div style={{
          backgroundColor: "#fef3c7",
          padding: "1.5rem",
          borderRadius: "0.5rem",
          textAlign: "center"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", marginBottom: "0.5rem" }}>Team</h3>
          <p style={{ fontSize: "2rem", fontWeight: "bold" }}>1</p>
          <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>Team Members</p>
        </div>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "600", marginBottom: "1rem" }}>Quick Actions</h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button style={{
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
            fontWeight: "500"
          }}>
            Create New Project
          </button>
          <button style={{
            backgroundColor: "#10b981",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
            fontWeight: "500"
          }}>
            Add Task
          </button>
          <button style={{
            backgroundColor: "#f59e0b",
            color: "white",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.375rem",
            border: "none",
            cursor: "pointer",
            fontWeight: "500"
          }}>
            Invite Team Member
          </button>
        </div>
      </div>
    </main>
  );
}