"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getUserProfile, updateUserProfile } from "@/lib/db"
import { toast } from "@/components/ui/use-toast"
import { Upload, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"

export function ProfileInfo() {
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: "",
    job_title: "",
    company: "",
    bio: "",
    avatar_url: "",
  })

  useEffect(() => {
    async function loadProfile() {
      if (!user) return

      setIsLoading(true)
      try {
        const profile = await getUserProfile(user.id)
        if (profile) {
          setFormData({
            full_name: profile.full_name || user.user_metadata?.full_name || "",
            job_title: profile.job_title || "",
            company: profile.company || "",
            bio: profile.bio || "",
            avatar_url: profile.avatar_url || user.user_metadata?.avatar_url || "",
          })
        } else {
          // Initialize with user metadata if available
          setFormData({
            full_name: user.user_metadata?.full_name || "",
            job_title: "",
            company: "",
            bio: "",
            avatar_url: user.user_metadata?.avatar_url || "",
          })
        }
      } catch (error) {
        console.error("Error loading profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [user])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)
    try {
      await updateUserProfile(user.id, {
        full_name: formData.full_name,
        job_title: formData.job_title,
        company: formData.company,
        bio: formData.bio,
        avatar_url: formData.avatar_url,
      })

      // Also update user metadata
      await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          avatar_url: formData.avatar_url,
        },
      })

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      })
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile information",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    try {
      // Create a unique file path
      const fileExt = file.name.split(".").pop()
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("profiles").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: publicURL } = supabase.storage.from("profiles").getPublicUrl(filePath)

      if (publicURL) {
        // Update the form data with the new avatar URL
        setFormData((prev) => ({ ...prev, avatar_url: publicURL.publicUrl }))

        toast({
          title: "Avatar Uploaded",
          description: "Your profile picture has been uploaded successfully.",
        })
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
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
        <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
        <p className="text-gray-300 mb-6">Update your personal information and how it appears on your profile.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center sm:items-start sm:flex-row gap-6">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 rounded-full bg-[#001428] border-2 border-[#4ecdc4]/30 overflow-hidden mb-3">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url || "/placeholder.svg"}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#4ecdc4]">
                  <Upload className="h-10 w-10" />
                </div>
              )}
              {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer px-3 py-1.5 text-sm bg-[#4ecdc4]/20 hover:bg-[#4ecdc4]/30 text-[#4ecdc4] rounded-md transition-colors"
              >
                Change Photo
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploading}
              />
              <p className="text-xs text-gray-400 mt-2">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>

          <div className="flex-1 w-full">
            <div className="space-y-4">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-300 mb-1">
                  Full Name*
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  required
                  className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
                />
              </div>

              <div>
                <label htmlFor="job_title" className="block text-sm font-medium text-gray-300 mb-1">
                  Job Title
                </label>
                <Input
                  id="job_title"
                  name="job_title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
                />
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
                  Company
                </label>
                <Input
                  id="company"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-1">
            Bio
          </label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            rows={4}
            className="bg-[#001428] border-gray-700 text-white focus:ring-[#4ecdc4] focus:border-[#4ecdc4]"
            placeholder="Tell us a bit about yourself..."
          />
          <p className="text-xs text-gray-400 mt-1">Brief description for your profile.</p>
        </div>

        <div className="pt-4">
          <Button
            type="submit"
            className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-[#001428] border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
