"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { FcGoogle } from "react-icons/fc"
import { FaFacebook, FaTwitter, FaGithub } from "react-icons/fa"
import { Link2, Unlink, AlertTriangle } from "lucide-react"

export function ConnectedAccounts() {
  const { user, refreshSession } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [connectedProviders, setConnectedProviders] = useState<string[]>([])
  const [isLinking, setIsLinking] = useState<string | null>(null)
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null)

  useEffect(() => {
    async function loadConnectedAccounts() {
      if (!user) return

      setIsLoading(true)
      try {
        // Get the user's identities
        const { data: identities, error } = await supabase.auth.admin.getUserIdentities(user.id)

        if (error) throw error

        // Extract the providers from the identities
        const providers = identities?.identities?.map((identity) => identity.provider) || []
        setConnectedProviders(providers)
      } catch (error) {
        console.error("Error loading connected accounts:", error)
        toast({
          title: "Error",
          description: "Failed to load connected accounts",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadConnectedAccounts()
  }, [user])

  const handleLink = async (provider: string) => {
    setIsLinking(provider)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/profile`,
        },
      })

      if (error) throw error

      // The user will be redirected to the provider's OAuth page
    } catch (error) {
      console.error(`Error linking ${provider} account:`, error)
      toast({
        title: "Error",
        description: `Failed to link ${provider} account`,
        variant: "destructive",
      })
      setIsLinking(null)
    }
  }

  const handleUnlink = async (provider: string) => {
    if (connectedProviders.length <= 1) {
      toast({
        title: "Cannot Unlink",
        description: "You must have at least one login method connected to your account.",
        variant: "destructive",
      })
      return
    }

    setIsUnlinking(provider)
    try {
      // This is a placeholder - Supabase doesn't have a direct method to unlink providers
      // In a real implementation, you would need to use a custom API or server function

      toast({
        title: "Feature Not Available",
        description: "Unlinking accounts is not currently supported. Please contact support for assistance.",
        variant: "destructive",
      })
    } catch (error) {
      console.error(`Error unlinking ${provider} account:`, error)
      toast({
        title: "Error",
        description: `Failed to unlink ${provider} account`,
        variant: "destructive",
      })
    } finally {
      setIsUnlinking(null)
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "google":
        return <FcGoogle className="h-5 w-5" />
      case "facebook":
        return <FaFacebook className="h-5 w-5 text-blue-500" />
      case "twitter":
        return <FaTwitter className="h-5 w-5 text-blue-400" />
      case "github":
        return <FaGithub className="h-5 w-5 text-gray-300" />
      default:
        return <Link2 className="h-5 w-5 text-gray-300" />
    }
  }

  const getProviderName = (provider: string) => {
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#4ecdc4]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Connected Accounts</h2>
        <p className="text-gray-300 mb-6">Manage your connected social accounts and login methods.</p>
      </div>

      {connectedProviders.length <= 1 && (
        <div className="bg-[#001428] p-4 rounded-md border border-yellow-500/30 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-white">Security Recommendation</h3>
              <p className="text-xs text-gray-300 mt-1">
                We recommend connecting multiple login methods to your account for better security and account recovery
                options.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Google */}
        <div className="flex items-center justify-between p-4 bg-[#001428] rounded-md border border-gray-700">
          <div className="flex items-center">
            <FcGoogle className="h-6 w-6 mr-4" />
            <div>
              <h3 className="text-white font-medium">Google</h3>
              <p className="text-sm text-gray-400">Sign in with your Google account</p>
            </div>
          </div>
          {connectedProviders.includes("google") ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => handleUnlink("google")}
              disabled={isUnlinking === "google" || connectedProviders.length <= 1}
            >
              {isUnlinking === "google" ? (
                <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Unlink className="mr-2 h-4 w-4" /> Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-[#4ecdc4]/30 text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
              onClick={() => handleLink("google")}
              disabled={isLinking === "google"}
            >
              {isLinking === "google" ? (
                <div className="animate-spin h-4 w-4 border-2 border-[#4ecdc4] border-t-transparent rounded-full" />
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" /> Connect
                </>
              )}
            </Button>
          )}
        </div>

        {/* Facebook */}
        <div className="flex items-center justify-between p-4 bg-[#001428] rounded-md border border-gray-700">
          <div className="flex items-center">
            <FaFacebook className="h-6 w-6 text-blue-500 mr-4" />
            <div>
              <h3 className="text-white font-medium">Facebook</h3>
              <p className="text-sm text-gray-400">Sign in with your Facebook account</p>
            </div>
          </div>
          {connectedProviders.includes("facebook") ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => handleUnlink("facebook")}
              disabled={isUnlinking === "facebook" || connectedProviders.length <= 1}
            >
              {isUnlinking === "facebook" ? (
                <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Unlink className="mr-2 h-4 w-4" /> Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-[#4ecdc4]/30 text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
              onClick={() => handleLink("facebook")}
              disabled={isLinking === "facebook"}
            >
              {isLinking === "facebook" ? (
                <div className="animate-spin h-4 w-4 border-2 border-[#4ecdc4] border-t-transparent rounded-full" />
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" /> Connect
                </>
              )}
            </Button>
          )}
        </div>

        {/* Twitter */}
        <div className="flex items-center justify-between p-4 bg-[#001428] rounded-md border border-gray-700">
          <div className="flex items-center">
            <FaTwitter className="h-6 w-6 text-blue-400 mr-4" />
            <div>
              <h3 className="text-white font-medium">Twitter</h3>
              <p className="text-sm text-gray-400">Sign in with your Twitter account</p>
            </div>
          </div>
          {connectedProviders.includes("twitter") ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => handleUnlink("twitter")}
              disabled={isUnlinking === "twitter" || connectedProviders.length <= 1}
            >
              {isUnlinking === "twitter" ? (
                <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Unlink className="mr-2 h-4 w-4" /> Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-[#4ecdc4]/30 text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
              onClick={() => handleLink("twitter")}
              disabled={isLinking === "twitter"}
            >
              {isLinking === "twitter" ? (
                <div className="animate-spin h-4 w-4 border-2 border-[#4ecdc4] border-t-transparent rounded-full" />
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" /> Connect
                </>
              )}
            </Button>
          )}
        </div>

        {/* GitHub */}
        <div className="flex items-center justify-between p-4 bg-[#001428] rounded-md border border-gray-700">
          <div className="flex items-center">
            <FaGithub className="h-6 w-6 text-gray-300 mr-4" />
            <div>
              <h3 className="text-white font-medium">GitHub</h3>
              <p className="text-sm text-gray-400">Sign in with your GitHub account</p>
            </div>
          </div>
          {connectedProviders.includes("github") ? (
            <Button
              variant="outline"
              size="sm"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => handleUnlink("github")}
              disabled={isUnlinking === "github" || connectedProviders.length <= 1}
            >
              {isUnlinking === "github" ? (
                <div className="animate-spin h-4 w-4 border-2 border-red-400 border-t-transparent rounded-full" />
              ) : (
                <>
                  <Unlink className="mr-2 h-4 w-4" /> Disconnect
                </>
              )}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="border-[#4ecdc4]/30 text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
              onClick={() => handleLink("github")}
              disabled={isLinking === "github"}
            >
              {isLinking === "github" ? (
                <div className="animate-spin h-4 w-4 border-2 border-[#4ecdc4] border-t-transparent rounded-full" />
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" /> Connect
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
