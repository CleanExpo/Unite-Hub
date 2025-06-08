"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, KeyRound, AlertCircle, ArrowLeft, Check } from "lucide-react";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [tokenChecked, setTokenChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        setError("Invalid or expired password reset link. Please request a new one.");
        setTokenChecked(true);
        return;
      }
      
      if (data.session) {
        setValidToken(true);
      } else {
        // Check if we have a hash parameter (for password reset)
        const hash = window.location.hash;
        if (hash && hash.includes('type=recovery')) {
          setValidToken(true);
        } else {
          setError("No valid recovery session found. Please request a password reset link.");
        }
      }
      
      setTokenChecked(true);
    };
    
    checkSession();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabaseClient.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccess(true);
      
      // Automatically redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred while updating your password");
    } finally {
      setLoading(false);
    }
  };

  if (!tokenChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-4">
          <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
          <p className="text-white text-lg">Verifying your password reset link...</p>
        </div>
      </div>
    );
  }

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
          <CardTitle className="text-white text-xl">Update your password</CardTitle>
          <CardDescription className="text-slate-400">
            Create a new secure password for your account
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
                <Check className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Your password has been successfully updated.
                  You will be redirected to the login page shortly.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => router.push('/login')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go to login
              </Button>
            </div>
          ) : validToken ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">New Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="bg-slate-700 border-slate-600 text-white"
                  minLength={6}
                />
                <p className="text-xs text-slate-400">Password must be at least 6 characters</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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
                    Updating password...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Update password
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-300">
                The password reset link is invalid or has expired. Please request a new password reset.
              </p>
              <Button 
                onClick={() => router.push('/reset-password')}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to reset password
              </Button>
            </div>
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
