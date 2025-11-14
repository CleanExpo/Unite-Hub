import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
// import EmailProvider from "next-auth/providers/email"; // Requires database adapter

const providers = [];

// Add Google provider with build-time fallbacks
providers.push(
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID || "dummy-client-id.apps.googleusercontent.com",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy-secret-key-for-build",
  })
);

// Email provider disabled - requires database adapter (Convex/Supabase)
// Can be re-enabled by adding an adapter to authOptions
// if (
//   process.env.EMAIL_SERVER_HOST &&
//   process.env.EMAIL_SERVER_USER &&
//   process.env.EMAIL_SERVER_PASSWORD
// ) {
//   providers.push(
//     EmailProvider({
//       server: {
//         host: process.env.EMAIL_SERVER_HOST,
//         port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
//         auth: {
//           user: process.env.EMAIL_SERVER_USER,
//           pass: process.env.EMAIL_SERVER_PASSWORD,
//         },
//       },
//       from: process.env.EMAIL_FROM || "noreply@unite-hub.io",
//     })
//   );
// }

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session?.user && user) {
        (session.user as any).id = user.id;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Export the NextAuth instance for v4
const handler = NextAuth(authOptions);
export default handler;

// Export auth function for API routes (NextAuth v4 compatible)
export async function auth() {
  // This is a placeholder - in production, use getServerSession from next-auth
  // For now, return null to allow unauthenticated access in development
  return null;
}
