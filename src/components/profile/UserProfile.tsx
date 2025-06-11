'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  Camera,
  Shield,
  Bell,
  CreditCard,
  Key,
  LogOut,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/apiClient'
import { toast } from '@/components/ui/use-toast'

interface UserProfileData {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  department?: string
  location?: string
  timezone?: string
  bio?: string
  website?: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  twoFactor: boolean
}

export function UserProfile() {
  const [user, setUser] = useState<UserProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  Camera,
  Shield,
  Bell,
  CreditCard,
  Key,
  LogOut,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/apiClient'
import { toast } from '@/components/ui/use-toast'

interface UserProfileData {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  department?: string
  location?: string
  timezone?: string
  bio?: string
  website?: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  twoFactor: boolean
}

export function UserProfile() {
  const [user, setUser] = useState<UserProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch real user profile from API
  const fetchUserProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get('users/profile')
      setUser(data.data)
      setEditedUser(data.data)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      setError('Failed to load user profile. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleSave = async () => {
    if (!editedUser) return
    
    setSaving(true)
    try {
      const response = await apiClient.put('users/profile', editedUser)
      setUser(response.data)
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedUser(user)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Failed to load user profile'}</p>
              <Button onClick={fetchUserProfile}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div>
                {isEditing ? (
                  <Input
                    value={editedUser?.name || ''}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, name: e.target.value })}
                    className="text-2xl font-bold mb-2"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                )}
                <p className="text-muted-foreground">{user.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{user.department}</Badge>
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {user.location}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? editedUser?.email || '' : user.email}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={isEditing ? editedUser?.phone || '' : user.phone || ''}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    <Briefcase className="h-4 w-4 inline mr-2" />
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={isEditing ? editedUser.role : user.role}
                    onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Timezone
                  </Label>
                  <Select
                    value={isEditing ? editedUser.timezone : user.timezone}
                    onValueChange={(value) => setEditedUser({ ...editedUser, timezone: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={isEditing ? editedUser.bio : user.bio}
                  onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={isEditing ? editedUser.website : user.website}
                  onChange={(e) => setEditedUser({ ...editedUser, website: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={user.twoFactor}
                  onCheckedChange={(checked) => setUser({ ...user, twoFactor: checked })}
                />
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  View Login History
                </Button>
                
                <Button variant="outline" className="w-full justify-start text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out of All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={user.notifications.email}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, email: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                  </p>
                </div>
                <Switch
                  checked={user.notifications.push}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, push: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive text messages for important updates
                  </p>
                </div>
                <Switch
                  checked={user.notifications.sms}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, sms: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Growth Plan</p>
                    <p className="text-sm text-muted-foreground">$299/month</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Next billing date: April 1, 2024
                </div>
                <Button variant="outline" size="sm">
                  Change Plan
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Payment Methods</h3>
                <div className="rounded-lg border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/24</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Default</Badge>
                </div>
                
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  Download Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
.Value -replace "'", "'" <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4"> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  Camera,
  Shield,
  Bell,
  CreditCard,
  Key,
  LogOut,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/apiClient'
import { toast } from '@/components/ui/use-toast'

interface UserProfileData {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  department?: string
  location?: string
  timezone?: string
  bio?: string
  website?: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  twoFactor: boolean
}

export function UserProfile() {
  const [user, setUser] = useState<UserProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch real user profile from API
  const fetchUserProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get('users/profile')
      setUser(data.data)
      setEditedUser(data.data)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      setError('Failed to load user profile. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleSave = async () => {
    if (!editedUser) return
    
    setSaving(true)
    try {
      const response = await apiClient.put('users/profile', editedUser)
      setUser(response.data)
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedUser(user)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Failed to load user profile'}</p>
              <Button onClick={fetchUserProfile}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div>
                {isEditing ? (
                  <Input
                    value={editedUser?.name || ''}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, name: e.target.value })}
                    className="text-2xl font-bold mb-2"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                )}
                <p className="text-muted-foreground">{user.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{user.department}</Badge>
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {user.location}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? editedUser?.email || '' : user.email}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={isEditing ? editedUser?.phone || '' : user.phone || ''}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    <Briefcase className="h-4 w-4 inline mr-2" />
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={isEditing ? editedUser.role : user.role}
                    onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Timezone
                  </Label>
                  <Select
                    value={isEditing ? editedUser.timezone : user.timezone}
                    onValueChange={(value) => setEditedUser({ ...editedUser, timezone: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={isEditing ? editedUser.bio : user.bio}
                  onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={isEditing ? editedUser.website : user.website}
                  onChange={(e) => setEditedUser({ ...editedUser, website: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={user.twoFactor}
                  onCheckedChange={(checked) => setUser({ ...user, twoFactor: checked })}
                />
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  View Login History
                </Button>
                
                <Button variant="outline" className="w-full justify-start text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out of All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={user.notifications.email}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, email: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                  </p>
                </div>
                <Switch
                  checked={user.notifications.push}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, push: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive text messages for important updates
                  </p>
                </div>
                <Switch
                  checked={user.notifications.sms}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, sms: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Growth Plan</p>
                    <p className="text-sm text-muted-foreground">$299/month</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Next billing date: April 1, 2024
                </div>
                <Button variant="outline" size="sm">
                  Change Plan
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Payment Methods</h3>
                <div className="rounded-lg border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/24</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Default</Badge>
                </div>
                
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  Download Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
.Value -replace "'", "'" </p>
              <Button onClick={fetchUserProfile}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  Globe, 
  Camera,
  Shield,
  Bell,
  CreditCard,
  Key,
  LogOut,
  Save,
  X,
  Loader2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { apiClient } from '@/lib/apiClient'
import { toast } from '@/components/ui/use-toast'

interface UserProfileData {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  role: string
  department?: string
  location?: string
  timezone?: string
  bio?: string
  website?: string
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  twoFactor: boolean
}

export function UserProfile() {
  const [user, setUser] = useState<UserProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<UserProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch real user profile from API
  const fetchUserProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await apiClient.get('users/profile')
      setUser(data.data)
      setEditedUser(data.data)
    } catch (err) {
      console.error('Failed to fetch user profile:', err)
      setError('Failed to load user profile. Please try again.')
      toast({
        title: 'Error',
        description: 'Failed to load user profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleSave = async () => {
    if (!editedUser) return
    
    setSaving(true)
    try {
      const response = await apiClient.put('users/profile', editedUser)
      setUser(response.data)
      setIsEditing(false)
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })
    } catch (err) {
      console.error('Failed to update profile:', err)
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedUser(user)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error || 'Failed to load user profile'}</p>
              <Button onClick={fetchUserProfile}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div>
                {isEditing ? (
                  <Input
                    value={editedUser?.name || ''}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, name: e.target.value })}
                    className="text-2xl font-bold mb-2"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                )}
                <p className="text-muted-foreground">{user.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{user.department}</Badge>
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {user.location}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? editedUser?.email || '' : user.email}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={isEditing ? editedUser?.phone || '' : user.phone || ''}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    <Briefcase className="h-4 w-4 inline mr-2" />
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={isEditing ? editedUser.role : user.role}
                    onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Timezone
                  </Label>
                  <Select
                    value={isEditing ? editedUser.timezone : user.timezone}
                    onValueChange={(value) => setEditedUser({ ...editedUser, timezone: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={isEditing ? editedUser.bio : user.bio}
                  onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={isEditing ? editedUser.website : user.website}
                  onChange={(e) => setEditedUser({ ...editedUser, website: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={user.twoFactor}
                  onCheckedChange={(checked) => setUser({ ...user, twoFactor: checked })}
                />
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  View Login History
                </Button>
                
                <Button variant="outline" className="w-full justify-start text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out of All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={user.notifications.email}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, email: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                  </p>
                </div>
                <Switch
                  checked={user.notifications.push}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, push: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive text messages for important updates
                  </p>
                </div>
                <Switch
                  checked={user.notifications.sms}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, sms: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Growth Plan</p>
                    <p className="text-sm text-muted-foreground">$299/month</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Next billing date: April 1, 2024
                </div>
                <Button variant="outline" size="sm">
                  Change Plan
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Payment Methods</h3>
                <div className="rounded-lg border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/24</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Default</Badge>
                </div>
                
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  Download Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
.Value -replace "'", "'" <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full p-0"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div>
                {isEditing ? (
                  <Input
                    value={editedUser?.name || ''}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, name: e.target.value })}
                    className="text-2xl font-bold mb-2"
                  />
                ) : (
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                )}
                <p className="text-muted-foreground">{user.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary">{user.department}</Badge>
                  <Badge variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    {user.location}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="personal" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="personal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="h-4 w-4 inline mr-2" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={isEditing ? editedUser?.email || '' : user.email}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, email: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="h-4 w-4 inline mr-2" />
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={isEditing ? editedUser?.phone || '' : user.phone || ''}
                    onChange={(e) => editedUser && setEditedUser({ ...editedUser, phone: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    <Briefcase className="h-4 w-4 inline mr-2" />
                    Role
                  </Label>
                  <Input
                    id="role"
                    value={isEditing ? editedUser.role : user.role}
                    onChange={(e) => setEditedUser({ ...editedUser, role: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Timezone
                  </Label>
                  <Select
                    value={isEditing ? editedUser.timezone : user.timezone}
                    onValueChange={(value) => setEditedUser({ ...editedUser, timezone: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger id="timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={isEditing ? editedUser.bio : user.bio}
                  onChange={(e) => setEditedUser({ ...editedUser, bio: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">
                  <Globe className="h-4 w-4 inline mr-2" />
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  value={isEditing ? editedUser.website : user.website}
                  onChange={(e) => setEditedUser({ ...editedUser, website: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  checked={user.twoFactor}
                  onCheckedChange={(checked) => setUser({ ...user, twoFactor: checked })}
                />
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Key className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  View Login History
                </Button>
                
                <Button variant="outline" className="w-full justify-start text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out of All Devices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates via email
                  </p>
                </div>
                <Switch
                  checked={user.notifications.email}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, email: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive push notifications on your devices
                  </p>
                </div>
                <Switch
                  checked={user.notifications.push}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, push: checked }
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive text messages for important updates
                  </p>
                </div>
                <Switch
                  checked={user.notifications.sms}
                  onCheckedChange={(checked) => 
                    setUser({ 
                      ...user, 
                      notifications: { ...user.notifications, sms: checked }
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Growth Plan</p>
                    <p className="text-sm text-muted-foreground">$299/month</p>
                  </div>
                  <Badge>Active</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Next billing date: April 1, 2024
                </div>
                <Button variant="outline" size="sm">
                  Change Plan
                </Button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Payment Methods</h3>
                <div className="rounded-lg border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-5 w-5" />
                    <div>
                      <p className="font-medium">•••• •••• •••• 4242</p>
                      <p className="text-sm text-muted-foreground">Expires 12/24</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Default</Badge>
                </div>
                
                <Button variant="outline" className="w-full">
                  Add Payment Method
                </Button>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full">
                  Download Invoices
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}
