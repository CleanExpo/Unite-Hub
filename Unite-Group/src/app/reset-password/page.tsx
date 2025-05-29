"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, KeyRound, AlertCircle, ArrowLeft } from "lucide-react";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred during password reset request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
          <span className="text-slate-900 font-bold text-lg">UG</span>
        </div>
        <h1 className="text-2xl font-bold text-white">UNITE Group</h1>
      </Link>
      
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-xl">
        <CardHeader>
          <CardTitle className="text-white text-xl">Reset your password</CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email and we'll send you a password reset link
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-red-900/20 text-red-400 border-red-800">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {success ? (
            <div className="space-y-4">
              <Alert className="mb-4 bg-green-900/20 text-green-400 border-green-800">
                <AlertDescription>
                  Password reset link has been sent to your email address.
                  Please check your inbox and follow the instructions.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Send reset link
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-slate-700 pt-4">
          <p className="text-sm text-slate-400">
            Remember your password?{" "}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-medium">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
