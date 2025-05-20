"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import {
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Copy,
  Key,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react"
import { getSupabaseClient } from "@/lib/supabase"
import {
  generateTOTPSecret,
  generateTOTPUri,
  verifyTOTP,
  markTOTPAsVerified,
  isTOTPEnabled,
  disableTOTP,
  generateBackupCodes,
  getBackupCodes,
} from "@/lib/two-factor-auth"
import {
  getSecurityQuestions,
  getUserSecurityQuestions,
  saveSecurityQuestionAnswers,
  getUserRecoveryMethods,
  generateRecoveryCodes,
  addRecoveryMethod,
  removeRecoveryMethod,
  setPrimaryRecoveryMethod,
} from "@/lib/account-recovery"
import type { SecurityQuestion, RecoveryMethod } from "@/types/account-recovery"
import { QRCodeSVG } from "qrcode.react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

export function SecuritySettings() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("password")
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // 2FA States
  const [is2FAEnabled, setIs2FAEnabled] = useState(false)
  const [is2FALoading, setIs2FALoading] = useState(true)
  const [setupMode, setSetupMode] = useState(false)
  const [verifyMode, setVerifyMode] = useState(false)
  const [disableMode, setDisableMode] = useState(false)
  const [backupCodesMode, setBackupCodesMode] = useState(false)
  const [totpSecret, setTotpSecret] = useState("")
  const [totpUri, setTotpUri] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [backupCodes, setBackupCodes] = useState([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)

  // Recovery States
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([])
  const [userQuestions, setUserQuestions] = useState<SecurityQuestion[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<{ id: number; answer: string }[]>([
    { id: 0, answer: "" },
    { id: 0, answer: "" },
    { id: 0, answer: "" },
  ])
  const [recoveryMethods, setRecoveryMethods] = useState<RecoveryMethod[]>([])
  const [isLoadingRecovery, setIsLoadingRecovery] = useState(true)
  const [showSecurityQuestionsDialog, setShowSecurityQuestionsDialog] = useState(false)
  const [showRecoveryCodesDialog, setShowRecoveryCodesDialog] = useState(false)
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [backupEmail, setBackupEmail] = useState("")
  const [showBackupEmailDialog, setShowBackupEmailDialog] = useState(false)
  const [backupPhone, setBackupPhone] = useState("")
  const [showBackupPhoneDialog, setShowBackupPhoneDialog] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)

  useEffect(() => {
    if (user) {
      checkTwoFactorStatus()
      loadRecoveryData()
    }
  }, [user])

  const checkTwoFactorStatus = async () => {
    if (!user) return

    try {
      setIs2FALoading(true)
      const enabled = await isTOTPEnabled(user.id)
      setIs2FAEnabled(enabled)
    } catch (error) {
      console.error("Error checking 2FA status:", error)
    } finally {
      setIs2FALoading(false)
    }
  }

  const loadRecoveryData = async () => {
    if (!user) return

    try {
      setIsLoadingRecovery(true)
      const [questions, userQs, methods] = await Promise.all([
        getSecurityQuestions(),
        getUserSecurityQuestions(user.id),
        getUserRecoveryMethods(user.id),
      ])
      setSecurityQuestions(questions)
      setUserQuestions(userQs)
      setRecoveryMethods(methods)
    } catch (error) {
      console.error("Error loading recovery data:", error)
    } finally {
      setIsLoadingRecovery(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({ ...prev, [name]: value }))

    // Clear errors when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }

    // Clear confirm password error if passwords match
    if (name === "newPassword" || name === "confirmPassword") {
      if (name === "newPassword" && passwordData.confirmPassword && value !== passwordData.confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
      } else if (name === "confirmPassword" && value !== passwordData.newPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
      } else {
        setErrors((prev) => ({ ...prev, confirmPassword: "" }))
      }
    }
  }

  const validatePassword = (password) => {
    if (password.length < 8) {
      return "Password must be at least 8 characters"
    }
    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/[0-9]/.test(password)) {
      return "Password must contain at least one number"
    }
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    // Validate passwords
    const newPasswordError = validatePassword(passwordData.newPassword)
    if (newPasswordError) {
      setErrors((prev) => ({ ...prev, newPassword: newPasswordError }))
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }))
      return
    }

    setIsChangingPassword(true)
    try {
      const supabase = getSupabaseClient()
      // First verify the current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      })

      if (signInError) {
        setErrors((prev) => ({ ...prev, currentPassword: "Current password is incorrect" }))
        throw new Error("Current password verification failed")
      }

      // Update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) throw updateError

      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      })
    } catch (error) {
      console.error("Error changing password:", error)
      if (!errors.currentPassword) {
        toast({
          title: "Error",
          description: "Failed to change password. Please try again.",
          variant: "destructive",
        })
      }
    } finally {
      setIsChangingPassword(false)
    }
  }

  // 2FA Functions
  const startTwoFactorSetup = async () => {
    if (!user) return

    try {
      const secret = await generateTOTPSecret(user.id)
      const uri = generateTOTPUri(secret, user.email)

      setTotpSecret(secret)
      setTotpUri(uri)
      setSetupMode(true)
      setVerifyMode(true)
    } catch (error) {
      console.error("Error setting up 2FA:", error)
      toast({
        title: "Error",
        description: "Failed to set up two-factor authentication. Please try again.",
        variant: "destructive",
      })
    }
  }

  const verifyTwoFactorSetup = async () => {
    if (!user || !totpSecret || !verificationCode) return

    try {
      const isValid = verifyTOTP(verificationCode, totpSecret)

      if (!isValid) {
        toast({
          title: "Invalid Code",
          description: "The verification code is invalid or has expired. Please try again.",
          variant: "destructive",
        })
        return
      }

      await markTOTPAsVerified(user.id)

      // Generate backup codes
      const codes = await generateBackupCodes(user.id)
      setBackupCodes(codes)

      setIs2FAEnabled(true)
      setVerifyMode(false)
      setBackupCodesMode(true)

      toast({
        title: "Two-Factor Authentication Enabled",
        description: "Your account is now protected with two-factor authentication.",
      })
    } catch (error) {
      console.error("Error verifying 2FA:", error)
      toast({
        title: "Error",
        description: "Failed to verify two-factor authentication. Please try again.",
        variant: "destructive",
      })
    }
  }

  const startTwoFactorDisable = () => {
    setDisableMode(true)
  }

  const disableTwoFactor = async () => {
    if (!user || !disableCode) return

    try {
      const isValid = verifyTOTP(disableCode, totpSecret)

      if (!isValid) {
        toast({
          title: "Invalid Code",
          description: "The verification code is invalid or has expired. Please try again.",
          variant: "destructive",
        })
        return
      }

      await disableTOTP(user.id)

      setIs2FAEnabled(false)
      setDisableMode(false)
      setDisableCode("")

      toast({
        title: "Two-Factor Authentication Disabled",
        description: "Two-factor authentication has been disabled for your account.",
      })
    } catch (error) {
      console.error("Error disabling 2FA:", error)
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication. Please try again.",
        variant: "destructive",
      })
    }
  }

  const viewBackupCodes = async () => {
    if (!user) return

    try {
      const codes = await getBackupCodes(user.id)
      setBackupCodes(codes.map((c) => c.code))
      setBackupCodesMode(true)
    } catch (error) {
      console.error("Error getting backup codes:", error)
      toast({
        title: "Error",
        description: "Failed to retrieve backup codes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateNewBackupCodes = async () => {
    if (!user) return

    try {
      const codes = await generateBackupCodes(user.id)
      setBackupCodes(codes)

      toast({
        title: "Backup Codes Generated",
        description: "New backup codes have been generated. Please save them in a secure location.",
      })
    } catch (error) {
      console.error("Error generating backup codes:", error)
      toast({
        title: "Error",
        description: "Failed to generate new backup codes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"))
    toast({
      title: "Copied",
      description: "Backup codes copied to clipboard.",
    })
  }

  const closeBackupCodes = () => {
    setBackupCodesMode(false)
    setSetupMode(false)
  }

  // Recovery Functions
  const handleSecurityQuestionChange = (index: number, questionId: number) => {
    const newQuestions = [...selectedQuestions]
    newQuestions[index] = { ...newQuestions[index], id: questionId }
    setSelectedQuestions(newQuestions)
  }

  const handleAnswerChange = (index: number, answer: string) => {
    const newQuestions = [...selectedQuestions]
    newQuestions[index] = { ...newQuestions[index], answer }
    setSelectedQuestions(newQuestions)
  }

  const saveSecurityQuestions = async () => {
    if (!user) return
    if (selectedQuestions.some((q) => q.id === 0 || !q.answer)) {
      toast({
        title: "Incomplete Information",
        description: "Please select all questions and provide answers.",
        variant: "destructive",
      })
      return
    }

    try {
      await saveSecurityQuestionAnswers(
        user.id,
        selectedQuestions.map((q) => ({ questionId: q.id, answer: q.answer })),
      )

      // Refresh recovery methods
      await loadRecoveryData()

      setShowSecurityQuestionsDialog(false)
      setSelectedQuestions([
        { id: 0, answer: "" },
        { id: 0, answer: "" },
        { id: 0, answer: "" },
      ])

      toast({
        title: "Security Questions Saved",
        description: "Your security questions have been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving security questions:", error)
      toast({
        title: "Error",
        description: "Failed to save security questions. Please try again.",
        variant: "destructive",
      })
    }
  }

  const generateNewRecoveryCodes = async () => {
    if (!user) return

    try {
      const codes = await generateRecoveryCodes(user.id)
      setRecoveryCodes(codes)
      setShowRecoveryCodesDialog(true)

      // Refresh recovery methods
      await loadRecoveryData()
    } catch (error) {
      console.error("Error generating recovery codes:", error)
      toast({
        title: "Error",
        description: "Failed to generate recovery codes. Please try again.",
        variant: "destructive",
      })
    }
  }

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"))
    toast({
      title: "Copied",
      description: "Recovery codes copied to clipboard.",
    })
  }

  const addBackupEmail = async () => {
    if (!user || !backupEmail) return

    try {
      const supabase = getSupabaseClient()
      await addRecoveryMethod(user.id, "email", backupEmail, false)

      // Send verification email
      await supabase.auth.signInWithOtp({
        email: backupEmail,
        options: {
          shouldCreateUser: false,
        },
      })

      setVerificationSent(true)

      // Refresh recovery methods
      await loadRecoveryData()

      toast({
        title: "Verification Email Sent",
        description: "Please check your backup email and click the verification link.",
      })
    } catch (error) {
      console.error("Error adding backup email:", error)
      toast({
        title: "Error",
        description: "Failed to add backup email. Please try again.",
        variant: "destructive",
      })
    }
  }

  const addBackupPhone = async () => {
    if (!user || !backupPhone) return

    try {
      const supabase = getSupabaseClient()
      await addRecoveryMethod(user.id, "phone", backupPhone, false)

      // Send verification SMS
      await supabase.auth.signInWithOtp({
        phone: backupPhone,
        options: {
          shouldCreateUser: false,
        },
      })

      setVerificationSent(true)

      // Refresh recovery methods
      await loadRecoveryData()

      toast({
        title: "Verification SMS Sent",
        description: "Please check your phone for the verification code.",
      })
    } catch (error) {
      console.error("Error adding backup phone:", error)
      toast({
        title: "Error",
        description: "Failed to add backup phone. Please try again.",
        variant: "destructive",
      })
    }
  }

  const removeRecoveryMethodHandler = async (methodId: number) => {
    try {
      await removeRecoveryMethod(methodId)

      // Refresh recovery methods
      await loadRecoveryData()

      toast({
        title: "Recovery Method Removed",
        description: "The recovery method has been removed successfully.",
      })
    } catch (error) {
      console.error("Error removing recovery method:", error)
      toast({
        title: "Error",
        description: "Failed to remove recovery method. Please try again.",
        variant: "destructive",
      })
    }
  }

  const setPrimaryMethod = async (methodId: number) => {
    try {
      await setPrimaryRecoveryMethod(user?.id || "", methodId)

      // Refresh recovery methods
      await loadRecoveryData()

      toast({
        title: "Primary Method Updated",
        description: "Your primary recovery method has been updated.",
      })
    } catch (error) {
      console.error("Error setting primary method:", error)
      toast({
        title: "Error",
        description: "Failed to update primary recovery method. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getRecoveryMethodIcon = (methodType: string) => {
    switch (methodType) {
      case "email":
        return <Mail className="h-5 w-5 text-blue-400" />
      case "phone":
        return <Phone className="h-5 w-5 text-green-400" />
      case "security_questions":
        return <MessageSquare className="h-5 w-5 text-yellow-400" />
      case "recovery_codes":
        return <Key className="h-5 w-5 text-purple-400" />
      default:
        return null
    }
  }

  const getRecoveryMethodName = (methodType: string) => {
    switch (methodType) {
      case "email":
        return "Backup Email"
      case "phone":
        return "Backup Phone"
      case "security_questions":
        return "Security Questions"
      case "recovery_codes":
        return "Recovery Codes"
      default:
        return methodType
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Security Settings</h2>
        <p className="text-gray-300 mb-6">Manage your account security and password.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-[#001428]">
          <TabsTrigger value="password" className="data-[state=active]:bg-[#002a42]">
            Password
          </TabsTrigger>
          <TabsTrigger value="2fa" className="data-[state=active]:bg-[#002a42]">
            Two-Factor Authentication
          </TabsTrigger>
          <TabsTrigger value="recovery" className="data-[state=active]:bg-[#002a42]">
            Account Recovery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="mt-6">
          <div className="bg-[#001428] p-4 rounded-md border border-yellow-500/30 mb-6">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-white">Important Security Information</h3>
                <p className="text-xs text-gray-300 mt-1">
                  Use a strong, unique password that you don't use for other websites. We recommend using a password
                  manager to generate and store your passwords securely.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Current Password*
                </label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={handleChange}
                    required
                    className={`bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4] pr-10 ${
                      errors.currentPassword ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && <p className="text-red-500 text-xs mt-1">{errors.currentPassword}</p>}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  New Password*
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handleChange}
                    required
                    className={`bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4] pr-10 ${
                      errors.newPassword ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword ? (
                  <p className="text-red-500 text-xs mt-1">{errors.newPassword}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">
                    Must be at least 8 characters with uppercase, lowercase, and numbers.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
                  Confirm New Password*
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handleChange}
                    required
                    className={`bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4] pr-10 ${
                      errors.confirmPassword ? "border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-[#001428] border-t-transparent rounded-full" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" /> Change Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="2fa" className="mt-6">
          {is2FALoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-[#4ecdc4] border-t-transparent rounded-full"></div>
            </div>
          ) : setupMode ? (
            <div className="space-y-6">
              {verifyMode ? (
                <div className="bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Set Up Two-Factor Authentication</h3>

                  <div className="space-y-6">
                    <div>
                      <p className="text-gray-300 mb-4">
                        Scan this QR code with your authenticator app (like Google Authenticator, Authy, or Microsoft
                        Authenticator).
                      </p>

                      <div className="flex justify-center bg-white p-4 rounded-lg mb-4">
                        <QRCodeSVG value={totpUri} size={200} />
                      </div>

                      <p className="text-sm text-gray-400 mb-2">
                        Can't scan the QR code? Enter this code manually in your app:
                      </p>

                      <div className="bg-[#002a42] p-2 rounded font-mono text-center text-white mb-4 break-all">
                        {totpSecret}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-300 mb-2">
                        Enter the 6-digit code from your authenticator app
                      </label>
                      <Input
                        id="verificationCode"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
                        maxLength={6}
                        placeholder="000000"
                      />
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={verifyTwoFactorSetup}
                        className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
                        disabled={verificationCode.length !== 6}
                      >
                        <ShieldCheck className="mr-2 h-4 w-4" /> Verify and Enable
                      </Button>

                      <Button
                        onClick={() => {
                          setSetupMode(false)
                          setVerifyMode(false)
                        }}
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-[#002a42]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : backupCodesMode ? (
                <div className="bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Backup Codes</h3>

                  <div className="space-y-6">
                    <div className="bg-[#002a42] p-4 rounded-md border border-yellow-500/30 mb-4">
                      <div className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-medium text-white">Important</h3>
                          <p className="text-xs text-gray-300 mt-1">
                            Save these backup codes in a secure place. Each code can only be used once to sign in if you
                            lose access to your authenticator app.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#002a42] p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-2">
                        {backupCodes.map((code, index) => (
                          <div key={index} className="font-mono text-white text-sm p-2 bg-[#001428] rounded">
                            {code}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <Button
                        onClick={copyBackupCodes}
                        className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy Codes
                      </Button>

                      <Button
                        onClick={closeBackupCodes}
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-[#002a42]"
                      >
                        I've Saved These Codes
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20">
                <div className="flex items-start">
                  {is2FAEnabled ? (
                    <ShieldCheck className="h-10 w-10 text-green-500 mr-4" />
                  ) : (
                    <ShieldAlert className="h-10 w-10 text-yellow-500 mr-4" />
                  )}

                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {is2FAEnabled ? "Two-Factor Authentication is Enabled" : "Two-Factor Authentication is Disabled"}
                    </h3>

                    <p className="text-gray-300 mt-2">
                      {is2FAEnabled
                        ? "Your account is protected with an additional layer of security. You'll need to enter a code from your authenticator app when signing in."
                        : "Add an extra layer of security to your account by requiring a verification code in addition to your password when signing in."}
                    </p>

                    <div className="mt-6">
                      {is2FAEnabled ? (
                        <div className="space-y-4">
                          <Button
                            onClick={viewBackupCodes}
                            variant="outline"
                            className="border-gray-700 text-gray-300 hover:bg-[#002a42] mr-3"
                          >
                            View Backup Codes
                          </Button>

                          <Button onClick={startTwoFactorDisable} className="bg-red-600 hover:bg-red-700 text-white">
                            Disable Two-Factor Authentication
                          </Button>

                          {disableMode && (
                            <div className="mt-4 p-4 bg-[#002a42] rounded-lg border border-red-500/20">
                              <h4 className="text-white font-medium mb-3">Confirm Disable Two-Factor Authentication</h4>

                              <p className="text-gray-300 text-sm mb-4">
                                Enter a verification code from your authenticator app to confirm.
                              </p>

                              <div className="flex space-x-3 items-end">
                                <div className="flex-1">
                                  <Input
                                    value={disableCode}
                                    onChange={(e) => setDisableCode(e.target.value)}
                                    className="bg-[#001428] border-gray-700 text-white"
                                    maxLength={6}
                                    placeholder="000000"
                                  />
                                </div>

                                <Button
                                  onClick={disableTwoFactor}
                                  className="bg-red-600 hover:bg-red-700 text-white"
                                  disabled={disableCode.length !== 6}
                                >
                                  Disable
                                </Button>

                                <Button
                                  onClick={() => setDisableMode(false)}
                                  variant="outline"
                                  className="border-gray-700 text-gray-300 hover:bg-[#002a42]"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={startTwoFactorSetup}
                          className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
                        >
                          <Shield className="mr-2 h-4 w-4" /> Enable Two-Factor Authentication
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#001428] p-4 rounded-md border border-[#4ecdc4]/20">
                <h3 className="text-sm font-medium text-white mb-2">What is Two-Factor Authentication?</h3>
                <p className="text-xs text-gray-300">
                  Two-factor authentication adds an extra layer of security to your account. In addition to your
                  password, you'll need to enter a code from your authenticator app when signing in. This helps protect
                  your account even if your password is compromised.
                </p>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recovery" className="mt-6">
          {isLoadingRecovery ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-[#4ecdc4] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-[#001428] p-6 rounded-lg border border-[#4ecdc4]/20">
                <h3 className="text-lg font-semibold text-white mb-4">Account Recovery Methods</h3>
                <p className="text-gray-300 mb-6">
                  Set up multiple recovery methods to ensure you can always regain access to your account.
                </p>

                <div className="space-y-4">
                  {recoveryMethods.length > 0 ? (
                    recoveryMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between p-3 bg-[#002a42] rounded-md border border-[#4ecdc4]/10"
                      >
                        <div className="flex items-center space-x-3">
                          {getRecoveryMethodIcon(method.method_type)}
                          <div>
                            <div className="flex items-center">
                              <span className="font-medium">{getRecoveryMethodName(method.method_type)}</span>
                              {method.is_primary && <Badge className="ml-2 bg-[#4ecdc4] text-[#001428]">Primary</Badge>}
                              {!method.is_verified && (
                                <Badge variant="outline" className="ml-2 border-yellow-500 text-yellow-500">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                            {method.identifier && <span className="text-sm text-gray-400">{method.identifier}</span>}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          {method.is_verified && !method.is_primary && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 border-[#4ecdc4]/20 hover:bg-[#002a42]"
                              onClick={() => setPrimaryMethod(method.id)}
                            >
                              Set Primary
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-red-500/20 text-red-400 hover:bg-[#002a42] hover:text-red-300"
                            onClick={() => removeRecoveryMethodHandler(method.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 bg-[#002a42] rounded-md">
                      <p className="text-gray-300">No recovery methods set up yet.</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="border-[#4ecdc4]/20 hover:bg-[#002a42]"
                    onClick={() => setShowSecurityQuestionsDialog(true)}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" /> Set Security Questions
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#4ecdc4]/20 hover:bg-[#002a42]"
                    onClick={generateNewRecoveryCodes}
                  >
                    <Key className="mr-2 h-4 w-4" /> Generate Recovery Codes
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#4ecdc4]/20 hover:bg-[#002a42]"
                    onClick={() => setShowBackupEmailDialog(true)}
                  >
                    <Mail className="mr-2 h-4 w-4" /> Add Backup Email
                  </Button>
                  <Button
                    variant="outline"
                    className="border-[#4ecdc4]/20 hover:bg-[#002a42]"
                    onClick={() => setShowBackupPhoneDialog(true)}
                  >
                    <Phone className="mr-2 h-4 w-4" /> Add Backup Phone
                  </Button>
                </div>
              </div>

              <div className="bg-[#001428] p-4 rounded-md border border-[#4ecdc4]/20">
                <h3 className="text-sm font-medium text-white mb-2">Why Set Up Recovery Methods?</h3>
                <p className="text-xs text-gray-300">
                  If you lose access to your primary email or forget your password, recovery methods provide alternative
                  ways to verify your identity and regain access to your account. We recommend setting up at least two
                  different recovery methods.
                </p>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Security Questions Dialog */}
      <Dialog open={showSecurityQuestionsDialog} onOpenChange={setShowSecurityQuestionsDialog}>
        <DialogContent className="sm:max-w-[500px] bg-[#001428]">
          <DialogHeader>
            <DialogTitle>Set Security Questions</DialogTitle>
            <DialogDescription>
              Choose and answer three security questions to help verify your identity if you need to recover your
              account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-2">
                <Label htmlFor={`question-${index}`}>Question {index + 1}</Label>
                <Select
                  value={selectedQuestions[index].id.toString()}
                  onValueChange={(value) => handleSecurityQuestionChange(index, Number.parseInt(value))}
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
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSecurityQuestionsDialog(false)
                setSelectedQuestions([
                  { id: 0, answer: "" },
                  { id: 0, answer: "" },
                  { id: 0, answer: "" },
                ])
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
              onClick={saveSecurityQuestions}
              disabled={selectedQuestions.some((q) => q.id === 0 || !q.answer)}
            >
              Save Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recovery Codes Dialog */}
      <Dialog open={showRecoveryCodesDialog} onOpenChange={setShowRecoveryCodesDialog}>
        <DialogContent className="sm:max-w-[500px] bg-[#001428]">
          <DialogHeader>
            <DialogTitle>Recovery Codes</DialogTitle>
            <DialogDescription>
              Save these recovery codes in a secure place. Each code can only be used once to recover your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-[#002a42] p-4 rounded-md border border-yellow-500/30 mb-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-white">Important</h3>
                  <p className="text-xs text-gray-300 mt-1">
                    Keep these codes private and store them in a secure location. They can be used to recover your
                    account if you lose access to your other recovery methods.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#002a42] p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-2">
                {recoveryCodes.map((code, index) => (
                  <div key={index} className="font-mono text-white text-sm p-2 bg-[#001428] rounded">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={copyRecoveryCodes}>
              <Copy className="mr-2 h-4 w-4" /> Copy Codes
            </Button>
            <Button
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
              onClick={() => setShowRecoveryCodesDialog(false)}
            >
              I've Saved These Codes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Email Dialog */}
      <Dialog open={showBackupEmailDialog} onOpenChange={setShowBackupEmailDialog}>
        <DialogContent className="sm:max-w-[500px] bg-[#001428]">
          <DialogHeader>
            <DialogTitle>Add Backup Email</DialogTitle>
            <DialogDescription>
              Add a secondary email address that can be used to recover your account.
            </DialogDescription>
          </DialogHeader>
          {verificationSent ? (
            <div className="space-y-4 py-4">
              <div className="bg-[#002a42] p-4 rounded-md border border-[#4ecdc4]/30">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-white">Verification Email Sent</h3>
                    <p className="text-xs text-gray-300 mt-1">
                      We've sent a verification link to {backupEmail}. Please check your inbox and click the link to
                      verify your backup email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="backupEmail">Backup Email Address</Label>
                <Input
                  id="backupEmail"
                  type="email"
                  placeholder="backup@example.com"
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                  className="bg-[#001428] border-[#4ecdc4]/20"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBackupEmailDialog(false)
                setBackupEmail("")
                setVerificationSent(false)
              }}
            >
              Close
            </Button>
            {!verificationSent && (
              <Button
                className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
                onClick={addBackupEmail}
                disabled={!backupEmail || backupEmail === user?.email}
              >
                Add & Verify
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Phone Dialog */}
      <Dialog open={showBackupPhoneDialog} onOpenChange={setShowBackupPhoneDialog}>
        <DialogContent className="sm:max-w-[500px] bg-[#001428]">
          <DialogHeader>
            <DialogTitle>Add Backup Phone</DialogTitle>
            <DialogDescription>Add a phone number that can be used to recover your account via SMS.</DialogDescription>
          </DialogHeader>
          {verificationSent ? (
            <div className="space-y-4 py-4">
              <div className="bg-[#002a42] p-4 rounded-md border border-[#4ecdc4]/30">
                <div className="flex items-start">
                  <Check className="h-5 w-5 text-[#4ecdc4] mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-white">Verification SMS Sent</h3>
                    <p className="text-xs text-gray-300 mt-1">
                      We've sent a verification code to {backupPhone}. Please check your phone and enter the code to
                      verify your backup phone number.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="backupPhone">Backup Phone Number</Label>
                <Input
                  id="backupPhone"
                  type="tel"
                  placeholder="+61 4XX XXX XXX"
                  value={backupPhone}
                  onChange={(e) => setBackupPhone(e.target.value)}
                  className="bg-[#001428] border-[#4ecdc4]/20"
                />
                <p className="text-xs text-gray-400">
                  Enter your phone number in international format (e.g., +61 for Australia).
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowBackupPhoneDialog(false)
                setBackupPhone("")
                setVerificationSent(false)
              }}
            >
              Close
            </Button>
            {!verificationSent && (
              <Button
                className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
                onClick={addBackupPhone}
                disabled={!backupPhone}
              >
                Add & Verify
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
