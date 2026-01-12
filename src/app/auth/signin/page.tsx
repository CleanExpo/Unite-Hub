"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignInPage() {
  const { signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    const { error } = await signInWithGoogle();

    if (error) {
      setError(error.message || "Failed to sign in with Google");
      setIsLoading(false);
    }
    // On success, Supabase will redirect to /auth/callback
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <span className="text-white font-bold text-3xl">UH</span>
          </div>
          <h1 className="text-4xl font-bold text-white">Welcome to Unite-Hub</h1>
          <p className="text-blue-200 text-lg">AI-Powered Marketing Automation</p>
        </div>

        {/* Sign In Card */}
        <Card className="border-0 shadow-2xl bg-white">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-3xl text-center font-bold text-text-primary">Sign in to continue</CardTitle>
            <CardDescription className="text-center text-text-muted text-base">
              Access your marketing dashboard
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Google Sign-In Button */}
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              variant="default"
              size="lg"
              className="w-full h-16 text-lg font-semibold bg-white hover:bg-bg-hover text-text-primary border-2 border-border-subtle hover:border-accent-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-text-muted">Secure Authentication</span>
              </div>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-5 space-y-3 border border-accent-100">
              <div className="flex items-start gap-3 text-base font-medium text-text-primary">
                <svg className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>5 AI-Powered Marketing Features</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <svg className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Automated Content Generation</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-text-secondary">
                <svg className="w-5 h-5 text-success-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Competitor Intelligence & Analytics</span>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-text-muted pt-4">
              By signing in, you agree to our{" "}
              <a href="/terms" className="underline hover:text-text-secondary">Terms</a>
              {" "}and{" "}
              <a href="/privacy" className="underline hover:text-text-secondary">Privacy Policy</a>
            </p>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <p className="text-center text-sm text-text-muted">
          Need help?{" "}
          <a href="mailto:support@unite-group.in" className="text-accent-600 hover:text-accent-700 font-medium">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
