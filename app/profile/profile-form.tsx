"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"

export default function ProfileForm({ user, profile }: { user: any; profile: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    bio: profile?.bio || "",
    role: profile?.role || "Member",
    avatar_url: profile?.avatar_url || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabaseClient.from("profiles").upsert({
        id: user.id,
        ...formData,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile information has been updated successfully.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const file = e.target.files[0]
    const fileExt = file.name.split(".").pop()
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `avatars/${fileName}`

    setUploadingAvatar(true)

    try {
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabaseClient.storage.from("profiles").upload(filePath, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabaseClient.storage.from("profiles").getPublicUrl(filePath)

      // Update the avatar_url in the form data
      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }))

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error uploading avatar",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-1/2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter your first name"
            />
          </div>
          <div className="w-full sm:w-1/2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            placeholder="Your role (e.g., Developer, Designer, Manager)"
          />
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us a bit about yourself"
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="avatar">Profile Picture</Label>
          <div className="mt-1 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url || "/placeholder.svg"}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xl font-bold text-gray-400">
                  {formData.first_name?.[0] || user.email?.[0]?.toUpperCase() || "?"}
                </div>
              )}
            </div>

            <div>
              <Button type="button" variant="outline" size="sm" className="relative" disabled={uploadingAvatar}>
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Image
                  </>
                )}
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={uploadingAvatar}
                />
              </Button>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 2MB.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}
