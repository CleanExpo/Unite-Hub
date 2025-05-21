import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from "@supabase/supabase-js"

// Required environment variables:
// - NEXTAUTH_SECRET: Secret for NextAuth
// - GOOGLE_CLIENT_ID: Google OAuth client ID
// - GOOGLE_CLIENT_SECRET: Google OAuth client secret
// - SUPABASE_URL: Supabase URL
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          // Authenticate with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error || !data.user) {
            return null
          }

          // Get user profile data
          const { data: profileData } = await supabase
            .from("user_profiles")
            .select("*")
            .eq("user_id", data.user.id)
            .single()

          return {
            id: data.user.id,
            email: data.user.email,
            name: profileData?.full_name || data.user.email?.split("@")[0],
            image: profileData?.avatar_url,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}
