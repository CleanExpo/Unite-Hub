"use client";

/**
 * Email Unsubscribe Page
 *
 * P0-004: CAN-SPAM Compliance
 * Allows users to unsubscribe from marketing emails
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";

type UnsubscribeState = "loading" | "verify" | "form" | "success" | "error";

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<UnsubscribeState>("loading");
  const [email, setEmail] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [reason, setReason] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verify token on mount
  useEffect(() => {
    if (token) {
      verifyToken();
    } else {
      setState("form");
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/email/unsubscribe?token=${token}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setMaskedEmail(data.email);
        setState("verify");
      } else {
        setErrorMessage(data.error || "Invalid unsubscribe link");
        setState("error");
      }
    } catch {
      setErrorMessage("Failed to verify unsubscribe link");
      setState("error");
    }
  };

  const handleUnsubscribe = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token || undefined,
          email: !token ? email : undefined,
          reason: reason || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setState("success");
      } else {
        setErrorMessage(data.error || "Failed to unsubscribe");
        setState("error");
      }
    } catch {
      setErrorMessage("Failed to process unsubscribe request");
      setState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setErrorMessage("Please enter your email address");
      return;
    }

    await handleUnsubscribe();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-muted-foreground" />
          </div>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>
            Manage your email subscription preferences
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Loading State */}
          {state === "loading" && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">Verifying...</p>
            </div>
          )}

          {/* Token Verification Success - Confirm Unsubscribe */}
          {state === "verify" && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">
                  You are about to unsubscribe:
                </p>
                <p className="font-medium text-lg">{maskedEmail}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Help us improve by telling us why you're unsubscribing..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleUnsubscribe}
                disabled={isSubmitting}
                className="w-full"
                variant="destructive"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Confirm Unsubscribe"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You will no longer receive marketing emails from us.
                Transactional emails (receipts, security alerts) will still be sent.
              </p>
            </div>
          )}

          {/* Manual Form - No Token */}
          {state === "form" && (
            <form onSubmit={handleManualUnsubscribe} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (optional)</Label>
                <Textarea
                  id="reason"
                  placeholder="Help us improve by telling us why you're unsubscribing..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                variant="destructive"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Unsubscribe"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Enter your email to unsubscribe from marketing communications.
              </p>
            </form>
          )}

          {/* Success State */}
          {state === "success" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Unsubscribed Successfully</h3>
              <p className="text-muted-foreground mb-6">
                You have been removed from our marketing email list.
                You may still receive transactional emails.
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = "/"}
              >
                Return to Homepage
              </Button>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Something Went Wrong</h3>
              <p className="text-muted-foreground mb-6">{errorMessage}</p>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setState("form");
                    setErrorMessage("");
                  }}
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.location.href = "/"}
                >
                  Go Home
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
