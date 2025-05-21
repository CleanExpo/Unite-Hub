import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { createClient } from "@supabase/supabase-js"
import type { JWT } from "next-auth/jwt"

// Required environment variables:
// - NEXTAUTH_SECRET: Secret for NextAuth
// - GOOGLE_CLIENT_ID: Google OAuth client ID
// - GOOGLE_CLIENT_SECRET: Google OAuth client secret
// - SUPABASE_URL: Supabase URL
// - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key

const supabase = createClient(process.env.SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")

// Define custom session type
interface ExtendedSession {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string | null
    permissions?: string[]
  }
  expires: string
}

// Define custom JWT type
interface ExtendedJWT extends JWT {
  id?: string
  role?: string
  permissions?: string[]
}

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

          // Get user role
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("roles(name)")
            .eq("user_id", data.user.id)
            .single()

          const role = roleData?.roles?.name || "user"

          // Get user permissions
          const { data: permissionsData } = await supabase
            .from("user_permissions")
            .select("permission")
            .eq("user_id", data.user.id)

          const permissions = permissionsData?.map((p) => p.permission) || []

          return {
            id: data.user.id,
            email: data.user.email,
            name: profileData?.full_name || data.user.email?.split("@")[0],
            image: profileData?.avatar_url,
            role,
            permissions,
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
    // JWT Callback - Called whenever a JWT is created or updated
    async jwt({ token, user, account, profile, trigger }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "user"
        token.permissions = (user as any).permissions || []
      }

      // Handle account linking
      if (account) {
        token.provider = account.provider
      }

      // If it's a sign-in event from Google, sync with Supabase
      if (trigger === "signIn" && account?.provider === "google") {
        try {
          // Check if user exists in Supabase
          const { data: existingUser } = await supabase
            .from("user_profiles")
            .select("user_id")
            .eq("email", token.email)
            .single()

          if (!existingUser) {
            // Create new user in Supabase
            const { data: newUser, error } = await supabase
              .from("user_profiles")
              .insert({
                user_id: token.sub,
                email: token.email,
                full_name: token.name,
                avatar_url: token.picture,
                created_at: new Date().toISOString(),
              })
              .single()

            if (error) {
              console.error("Error creating user in Supabase:", error)
            }

            // Assign default role
            await supabase.from("user_roles").insert({
              user_id: token.sub,
              role_id: 1, // Assuming 1 is the ID for the "user" role
            })
          }
        } catch (error) {
          console.error("Error syncing with Supabase:", error)
        }
      }

      return token as ExtendedJWT
    },

    // Session Callback - Called whenever a session is checked
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.permissions = token.permissions as string[]
      }
      return session as ExtendedSession
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}
