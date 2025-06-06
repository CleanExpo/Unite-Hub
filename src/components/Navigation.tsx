"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale, defaultLocale } from "@/i18n";

// Helper function to create locale-aware paths
function getLocalizedPath(path: string, locale: string): string {
  return `/${locale}${path}`;
}

export default function Navigation() {
  const params = useParams();
  const currentLocale = (params?.locale as Locale) || defaultLocale;
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
    router.push(getLocalizedPath("/", currentLocale));
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
      <Link href={getLocalizedPath("/", currentLocale)} style={{ fontSize: "1.25rem", fontWeight: "bold", textDecoration: "none", color: "black" }}>
        Unite Group
      </Link>

      <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        {/* Main navigation links */}
        <Link href={getLocalizedPath("/services", currentLocale)} style={{ textDecoration: "none", color: "#0070f3" }}>
          Services
        </Link>
        <Link href={getLocalizedPath("/pricing", currentLocale)} style={{ textDecoration: "none", color: "#0070f3" }}>
          Pricing
        </Link>
        <Link href={getLocalizedPath("/about", currentLocale)} style={{ textDecoration: "none", color: "#0070f3" }}>
          About
        </Link>
        <Link href={getLocalizedPath("/contact", currentLocale)} style={{ textDecoration: "none", color: "#0070f3" }}>
          Contact
        </Link>
        
        <div style={{ width: "1px", height: "24px", backgroundColor: "#e5e7eb", margin: "0 0.5rem" }} />
        
        <LanguageSwitcher currentLocale={currentLocale} />
        
        {!loading && (
          <>
            {user ? (
              <>
                <Link href={getLocalizedPath("/dashboard", currentLocale)} style={{ textDecoration: "none", color: "#0070f3" }}>
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
                <Link href={getLocalizedPath("/login", currentLocale)} style={{ textDecoration: "none", color: "#0070f3" }}>
                  Login
                </Link>
                <Link
                  href={getLocalizedPath("/register", currentLocale)}
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
