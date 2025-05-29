"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabaseClient.auth.getUser();
      setUser(data.user);
      setLoading(false);
    };

    getUser();

    const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    router.push("/");
  };

  return (
    <nav style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "1rem 2rem",
      borderBottom: "1px solid #e5e7eb",
      backgroundColor: "white"
    }}>
      <Link href="/" style={{ fontSize: "1.25rem", fontWeight: "bold", textDecoration: "none", color: "black" }}>
        Unite Group
      </Link>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {!loading && (
          <>
            {user ? (
              <>
                <Link href="/dashboard" style={{ textDecoration: "none", color: "#0070f3" }}>
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "0.25rem",
                    cursor: "pointer"
                  }}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" style={{ textDecoration: "none", color: "#0070f3" }}>
                  Login
                </Link>
                <Link
                  href="/register"
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#0070f3",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "0.25rem"
                  }}
                >
                  Register
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
}
