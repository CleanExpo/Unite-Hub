"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      alert("Registration successful! Please check your email for verification.");
      router.push("/login");
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1.5rem" }}>
        Register for Unite Group
      </h1>

      {error && (
        <div style={{ 
          padding: "0.75rem",
          marginBottom: "1rem",
          backgroundColor: "#fee2e2",
          color: "#b91c1c",
          borderRadius: "0.25rem"
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label htmlFor="email" style={{ display: "block", marginBottom: "0.5rem" }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ 
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.25rem",
              border: "1px solid #d1d5db"
            }}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: "block", marginBottom: "0.5rem" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ 
              width: "100%",
              padding: "0.5rem",
              borderRadius: "0.25rem",
              border: "1px solid #d1d5db"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            backgroundColor: "#0070f3",
            color: "white",
            padding: "0.5rem 1rem",
            borderRadius: "0.25rem",
            border: "none",
            cursor: "pointer",
            marginTop: "0.5rem"
          }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>

      <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
        <p>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#0070f3", textDecoration: "underline" }}>
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
