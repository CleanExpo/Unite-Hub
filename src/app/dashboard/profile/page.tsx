"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Edit2, Save, X, Upload, Trash2, Loader2 } from "lucide-react";

const TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Pacific/Auckland", label: "Auckland" },
];

interface ProfileFormData {
  username: string;
  full_name: string;
  business_name: string;
  phone: string;
  bio: string;
  website: string;
  timezone: string;
  notification_preferences: {
    email_notifications: boolean;
    marketing_emails: boolean;
    product_updates: boolean;
    weekly_digest: boolean;
  };
}

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProfileFormData>({
    username: "",
    full_name: "",
    business_name: "",
    phone: "",
    bio: "",
    website: "",
    timezone: "UTC",
    notification_preferences: {
      email_notifications: true,
      marketing_emails: true,
      product_updates: true,
      weekly_digest: false,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user !== undefined) {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        business_name: profile.business_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        website: profile.website || "",
        timezone: profile.timezone || "UTC",
        notification_preferences: profile.notification_preferences || {
          email_notifications: true,
          marketing_emails: true,
          product_updates: true,
          weekly_digest: false,
        },
      });
    }
  }, [profile]);

  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleInputChange = (
    field: keyof ProfileFormData,
    value: string | boolean | object
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      notification_preferences: {
        ...prev.notification_preferences,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrors({});

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors);
          toast({
            title: "Validation Error",
            description: "Please fix the errors and try again",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: data.error || "Failed to update profile",
            variant: "destructive",
          });
        }
        return;
      }

      // Refresh profile from AuthContext
      await refreshProfile();

      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current profile data
    if (profile) {
      setFormData({
        username: profile.username || "",
        full_name: profile.full_name || "",
        business_name: profile.business_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
        website: profile.website || "",
        timezone: profile.timezone || "UTC",
        notification_preferences: profile.notification_preferences || {
          email_notifications: true,
          marketing_emails: true,
          product_updates: true,
          weekly_digest: false,
        },
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Avatar must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG, PNG, WebP, and GIF are allowed",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Upload failed",
          description: data.error || "Failed to upload avatar",
          variant: "destructive",
        });
        return;
      }

      // Refresh profile to get new avatar URL
      await refreshProfile();

      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteAvatar = async () => {
    if (!confirm("Are you sure you want to delete your avatar?")) return;

    setIsUploadingAvatar(true);

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Delete failed",
          description: data.error || "Failed to delete avatar",
          variant: "destructive",
        });
        return;
      }

      // Refresh profile
      await refreshProfile();

      toast({
        title: "Success",
        description: "Avatar deleted successfully",
      });
    } catch (error) {
      console.error("Avatar delete error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Profile" }]} />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-slate-400">Manage your account settings and preferences</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} className="gap-2">
            <Edit2 className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              onClick={handleCancel}
              variant="outline"
              disabled={isSaving}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {profile?.avatar_url && (
                  <AvatarImage src={profile.avatar_url} alt={formData.full_name} />
                )}
                <AvatarFallback className="text-2xl bg-slate-700">
                  {getInitials(formData.full_name)}
                </AvatarFallback>
              </Avatar>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Upload Avatar
              </Button>
              {profile?.avatar_url && (
                <Button
                  onClick={handleDeleteAvatar}
                  disabled={isUploadingAvatar}
                  variant="outline"
                  size="sm"
                  className="gap-2 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove Avatar
                </Button>
              )}
              <p className="text-xs text-slate-400">
                JPG, PNG, WebP or GIF. Max 2MB.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <Label htmlFor="username" className="text-slate-300">
                Username
              </Label>
              {isEditing ? (
                <div>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange("username", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white mt-2"
                    placeholder="johndoe"
                  />
                  {errors.username && (
                    <p className="text-xs text-red-400 mt-1">{errors.username}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    3-30 characters, letters, numbers, - and _ only
                  </p>
                </div>
              ) : (
                <div className="text-white mt-2">{formData.username || "Not set"}</div>
              )}
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="full_name" className="text-slate-300">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange("full_name", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white mt-2"
                  placeholder="John Doe"
                />
              ) : (
                <div className="text-white mt-2">{formData.full_name || "Not set"}</div>
              )}
            </div>

            {/* Business Name */}
            <div>
              <Label htmlFor="business_name" className="text-slate-300">
                Business Name
              </Label>
              {isEditing ? (
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => handleInputChange("business_name", e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white mt-2"
                  placeholder="Acme Corp"
                />
              ) : (
                <div className="text-white mt-2">{formData.business_name || "Not set"}</div>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <Label htmlFor="email" className="text-slate-300">
                Email Address
              </Label>
              <div className="text-white mt-2 flex items-center gap-2">
                {user.email}
                <span className="text-xs text-green-400 bg-green-950 px-2 py-0.5 rounded">
                  Verified
                </span>
              </div>
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone" className="text-slate-300">
                Phone Number
              </Label>
              {isEditing ? (
                <div>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white mt-2"
                    placeholder="+1 (555) 123-4567"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-400 mt-1">{errors.phone}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    International format (e.g., +14155552671)
                  </p>
                </div>
              ) : (
                <div className="text-white mt-2">{formData.phone || "Not set"}</div>
              )}
            </div>

            {/* Website */}
            <div>
              <Label htmlFor="website" className="text-slate-300">
                Website
              </Label>
              {isEditing ? (
                <div>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white mt-2"
                    placeholder="https://example.com"
                  />
                  {errors.website && (
                    <p className="text-xs text-red-400 mt-1">{errors.website}</p>
                  )}
                </div>
              ) : (
                <div className="text-white mt-2">
                  {formData.website ? (
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:underline"
                    >
                      {formData.website}
                    </a>
                  ) : (
                    "Not set"
                  )}
                </div>
              )}
            </div>

            {/* Timezone */}
            <div className="md:col-span-2">
              <Label htmlFor="timezone" className="text-slate-300">
                Timezone
              </Label>
              {isEditing ? (
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => handleInputChange("timezone", value)}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-white mt-2">
                  {TIMEZONES.find((tz) => tz.value === formData.timezone)?.label ||
                    formData.timezone}
                </div>
              )}
            </div>

            {/* Bio */}
            <div className="md:col-span-2">
              <Label htmlFor="bio" className="text-slate-300">
                Bio
              </Label>
              {isEditing ? (
                <div>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white mt-2 min-h-[100px]"
                    placeholder="Tell us about yourself..."
                    maxLength={500}
                  />
                  {errors.bio && (
                    <p className="text-xs text-red-400 mt-1">{errors.bio}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    {formData.bio.length}/500 characters
                  </p>
                </div>
              ) : (
                <div className="text-white mt-2">{formData.bio || "Not set"}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email_notifications" className="text-white">
                Email Notifications
              </Label>
              <p className="text-sm text-slate-400">
                Receive email notifications about your account activity
              </p>
            </div>
            <Switch
              id="email_notifications"
              checked={formData.notification_preferences.email_notifications}
              onCheckedChange={(checked) =>
                handleNotificationChange("email_notifications", checked)
              }
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing_emails" className="text-white">
                Marketing Emails
              </Label>
              <p className="text-sm text-slate-400">
                Receive emails about new features and updates
              </p>
            </div>
            <Switch
              id="marketing_emails"
              checked={formData.notification_preferences.marketing_emails}
              onCheckedChange={(checked) =>
                handleNotificationChange("marketing_emails", checked)
              }
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="product_updates" className="text-white">
                Product Updates
              </Label>
              <p className="text-sm text-slate-400">
                Get notified about product improvements and changes
              </p>
            </div>
            <Switch
              id="product_updates"
              checked={formData.notification_preferences.product_updates}
              onCheckedChange={(checked) =>
                handleNotificationChange("product_updates", checked)
              }
              disabled={!isEditing}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weekly_digest" className="text-white">
                Weekly Digest
              </Label>
              <p className="text-sm text-slate-400">
                Receive a weekly summary of your account activity
              </p>
            </div>
            <Switch
              id="weekly_digest"
              checked={formData.notification_preferences.weekly_digest}
              onCheckedChange={(checked) =>
                handleNotificationChange("weekly_digest", checked)
              }
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Account Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-900 rounded-lg">
              <div className="text-2xl font-bold text-white">Active</div>
              <div className="text-sm text-slate-400">Account Status</div>
            </div>
            <div className="text-center p-4 bg-slate-900 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {Math.floor(
                  (Date.now() - new Date(user.created_at).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              </div>
              <div className="text-sm text-slate-400">Days Since Join</div>
            </div>
            <div className="text-center p-4 bg-slate-900 rounded-lg">
              <div className="text-2xl font-bold text-white">
                {new Date(
                  user.last_sign_in_at || user.created_at
                ).toLocaleDateString()}
              </div>
              <div className="text-sm text-slate-400">Last Sign In</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
