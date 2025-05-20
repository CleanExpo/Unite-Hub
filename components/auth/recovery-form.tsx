"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Mail, MessageSquare, Key, ArrowRight, Check } from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import { getSecurityQuestions, logRecoveryAttempt, verifySecurityQuestionAnswers } from "@/lib/account-recovery"
import type { SecurityQuestion } from "@/types/account-recovery"
import Link from "next/link"

export function RecoveryForm() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("email")
  const [email, setEmail] = useState("")
  const [recoveryCode, setRecoveryCode] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<{ id: number; answer: string }[]>([
    { id: 0, answer: "" },
    { id: 0, answer: "" },
    { id: 0, answer: "" },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [userId, setUserId] = useState<string | null>(null)

  // Load security questions
  const loadSecurityQuestions = async () => {
    const questions = await getSecurityQuestions()
    setSecurityQuestions(questions)
  }

  // Handle email recovery
  const handleEmailRecovery = async () => {
    if (!email) return

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      // Log recovery attempt
      await logRecoveryAttempt(email, "email", "initiated")

      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      // Log successful verification
      await logRecoveryAttempt(email, "email", "verified")

      toast({
        title: "Recovery Email Sent",
        description: "Check your email for instructions to reset your password.",
      })

      setStep(2)
    } catch (error: any) {
      console.error("Error sending recovery email:", error)

      // Log failed attempt
      await logRecoveryAttempt(email, "email", "failed")

      toast({
        title: "Recovery Failed",
        description: "We couldn't send a recovery email. Please try another method.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle recovery code
  const handleRecoveryCode = async () => {
    if (!email || !recoveryCode) return

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      // Log recovery attempt
      await logRecoveryAttempt(email, "recovery_code", "initiated")

      // Find user by email
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email)

      if (userError || !userData?.user) {
        throw new Error("User not found")
      }

      setUserId(userData.user.id)

      // Verify recovery code
      const { data, error } = await supabase.functions.invoke("verify-recovery-code", {
        body: { userId: userData.user.id, code: recoveryCode },
      })

      if (error || !data?.success) {
        throw new Error("Invalid recovery code")
      }

      // Log successful verification
      await logRecoveryAttempt(email, "recovery_code", "verified", userData.user.id)

      // Generate a password reset link
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) throw resetError

      // Log successful completion
      await logRecoveryAttempt(email, "recovery_code", "completed", userData.user.id)

      toast({
        title: "Recovery Successful",
        description: "Check your email for instructions to reset your password.",
      })

      setStep(2)
    } catch (error: any) {
      console.error("Error verifying recovery code:", error)

      // Log failed attempt
      await logRecoveryAttempt(email, "recovery_code", "failed", userId || undefined)

      toast({
        title: "Recovery Failed",
        description: "The recovery code is invalid. Please try another method.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle security questions
  const handleSecurityQuestions = async () => {
    if (!email || selectedQuestions.some((q) => q.id === 0 || !q.answer)) return

    setIsLoading(true)
    try {
      const supabase = getSupabaseClient()
      // Log recovery attempt
      await logRecoveryAttempt(email, "security_questions", "initiated")

      // Find user by email
      const { data: userData, error: userError } = await supabase.auth.admin.getUserByEmail(email)

      if (userError || !userData?.user) {
        throw new Error("User not found")
      }

      setUserId(userData.user.id)

      // Verify security questions
      const isVerified = await verifySecurityQuestionAnswers(
        userData.user.id,
        selectedQuestions.map((q) => ({ questionId: q.id, answer: q.answer })),
      )

      if (!isVerified) {
        throw new Error("Incorrect answers")
      }

      // Log successful verification
      await logRecoveryAttempt(email, "security_questions", "verified", userData.user.id)

      // Generate a password reset link
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) throw resetError

      // Log successful completion
      await logRecoveryAttempt(email, "security_questions", "completed", userData.user.id)

      toast({
        title: "Recovery Successful",
        description: "Check your email for instructions to reset your password.",
      })

      setStep(2)
    } catch (error: any) {
      console.error("Error verifying security questions:", error)

      // Log failed attempt
      await logRecoveryAttempt(email, "security_questions", "failed", userId || undefined)

      toast({
        title: "Recovery Failed",
        description: "The answers to your security questions are incorrect. Please try another method.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle question selection
  const handleQuestionChange = (index: number, questionId: number) => {
    const newQuestions = [...selectedQuestions]
    newQuestions[index] = { ...newQuestions[index], id: questionId }
    setSelectedQuestions(newQuestions)
  }

  // Handle answer change
  const handleAnswerChange = (index: number, answer: string) => {
    const newQuestions = [...selectedQuestions]
    newQuestions[index] = { ...newQuestions[index], answer }
    setSelectedQuestions(newQuestions)
  }

  // Load security questions when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "security" && securityQuestions.length === 0) {
      loadSecurityQuestions()
    }
  }

  if (step === 2) {
    return (
      <Card className="bg-[#001428] border-[#4ecdc4]/20">
        <CardHeader>
          <CardTitle className="text-center">Recovery Email Sent</CardTitle>
          <CardDescription className="text-center">Check your inbox to reset your password</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4 pt-4">
          <div className="rounded-full bg-[#4ecdc4]/20 p-3">
            <Check className="h-6 w-6 text-[#4ecdc4]" />
          </div>
          <p className="text-center text-sm text-gray-400">
            We've sent recovery instructions to <strong>{email}</strong>. Please check your inbox and follow the
            instructions to reset your password.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button asChild className="w-full bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
            <Link href="/auth/signin">Return to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="bg-[#001428] border-[#4ecdc4]/20">
      <CardHeader>
        <CardTitle>Account Recovery</CardTitle>
        <CardDescription>Choose a method to recover your account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Your Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-[#001428] border-[#4ecdc4]/20"
            />
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3 bg-[#002a42]">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="recovery">Recovery Code</TabsTrigger>
              <TabsTrigger value="security">Security Questions</TabsTrigger>
            </TabsList>
            <TabsContent value="email" className="space-y-4 pt-4">
              <div className="flex items-start space-x-2">
                <Mail className="h-5 w-5 text-[#4ecdc4] mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Email Recovery</p>
                  <p className="text-xs text-gray-400">
                    We'll send a password reset link to your email address. This is the most common recovery method.
                  </p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="recovery" className="space-y-4 pt-4">
              <div className="flex items-start space-x-2">
                <Key className="h-5 w-5 text-[#4ecdc4] mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Recovery Code</p>
                  <p className="text-xs text-gray-400">
                    Enter one of your backup recovery codes that you saved when setting up your account.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recoveryCode">Recovery Code</Label>
                <Input
                  id="recoveryCode"
                  placeholder="XXXXX-XXXXX"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="bg-[#001428] border-[#4ecdc4]/20 font-mono"
                />
              </div>
            </TabsContent>
            <TabsContent value="security" className="space-y-4 pt-4">
              <div className="flex items-start space-x-2">
                <MessageSquare className="h-5 w-5 text-[#4ecdc4] mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Security Questions</p>
                  <p className="text-xs text-gray-400">
                    Answer your security questions to verify your identity and recover your account.
                  </p>
                </div>
              </div>

              {securityQuestions.length > 0 ? (
                <div className="space-y-4">
                  {[0, 1, 2].map((index) => (
                    <div key={index} className="space-y-2">
                      <Label htmlFor={`question-${index}`}>Question {index + 1}</Label>
                      <Select
                        value={selectedQuestions[index].id.toString()}
                        onValueChange={(value) => handleQuestionChange(index, Number.parseInt(value))}
                      >
                        <SelectTrigger id={`question-${index}`} className="bg-[#001428] border-[#4ecdc4]/20">
                          <SelectValue placeholder="Select a security question" />
                        </SelectTrigger>
                        <SelectContent>
                          {securityQuestions.map((question) => (
                            <SelectItem key={question.id} value={question.id.toString()}>
                              {question.question}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Your answer"
                        value={selectedQuestions[index].answer}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        className="bg-[#001428] border-[#4ecdc4]/20 mt-1"
                        disabled={selectedQuestions[index].id === 0}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-[#4ecdc4]" />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
          onClick={
            activeTab === "email"
              ? handleEmailRecovery
              : activeTab === "recovery"
                ? handleRecoveryCode
                : handleSecurityQuestions
          }
          disabled={
            isLoading ||
            !email ||
            (activeTab === "recovery" && !recoveryCode) ||
            (activeTab === "security" &&
              (selectedQuestions.some((q) => q.id === 0) || selectedQuestions.some((q) => !q.answer)))
          }
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recovering...
            </>
          ) : (
            <>
              Recover Account <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
