"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Facebook, Linkedin, Twitter, Youtube, Link2, Check, AlertCircle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface SocialAccount {
  id: string
  platform: "facebook" | "twitter" | "linkedin" | "youtube"
  name: string
  handle?: string
  connected: boolean
  lastSync?: string
  status: "active" | "expired" | "pending"
}

export function SocialAccounts() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([
    {
      id: "fb1",
      platform: "facebook",
      name: "UNITE Group",
      connected: true,
      lastSync: "2 hours ago",
      status: "active",
    },
    {
      id: "tw1",
      platform: "twitter",
      name: "UNITE Group",
      handle: "@unitegroup",
      connected: true,
      lastSync: "1 day ago",
      status: "active",
    },
    {
      id: "li1",
      platform: "linkedin",
      name: "UNITE Group",
      connected: true,
      lastSync: "3 hours ago",
      status: "active",
    },
    {
      id: "yt1",
      platform: "youtube",
      name: "UNITE Group",
      connected: false,
      status: "expired",
    },
  ])

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "facebook":
        return <Facebook className="h-5 w-5 text-[#1877F2]" />
      case "linkedin":
        return <Linkedin className="h-5 w-5 text-[#0A66C2]" />
      case "twitter":
        return <Twitter className="h-5 w-5 text-[#1DA1F2]" />
      case "youtube":
        return <Youtube className="h-5 w-5 text-[#FF0000]" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>
      case "expired":
        return <Badge variant="destructive">Expired</Badge>
      case "pending":
        return (
          <Badge variant="outline" className="text-yellow-500 border-yellow-500">
            Pending
          </Badge>
        )
      default:
        return null
    }
  }

  const handleConnect = (id: string) => {
    setAccounts(
      accounts.map((account) =>
        account.id === id
          ? {
              ...account,
              connected: true,
              status: "active",
              lastSync: "Just now",
            }
          : account,
      ),
    )
  }

  const handleDisconnect = (id: string) => {
    setAccounts(
      accounts.map((account) =>
        account.id === id
          ? {
              ...account,
              connected: false,
              status: "expired",
              lastSync: undefined,
            }
          : account,
      ),
    )
  }

  const handleRefresh = (id: string) => {
    setAccounts(
      accounts.map((account) =>
        account.id === id
          ? {
              ...account,
              lastSync: "Just now",
            }
          : account,
      ),
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className="bg-[#001428]/50">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {getPlatformIcon(account.platform)}
                  <div>
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    {account.handle && <CardDescription>{account.handle}</CardDescription>}
                  </div>
                </div>
                {getStatusBadge(account.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm">
                {account.connected ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Connected</span>
                    {account.lastSync && <span className="text-gray-400 ml-auto">Last sync: {account.lastSync}</span>}
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span>Disconnected</span>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {account.connected ? (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleRefresh(account.id)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDisconnect(account.id)}>
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
                  size="sm"
                  onClick={() => handleConnect(account.id)}
                >
                  Connect
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="bg-[#001428]/50">
        <CardHeader>
          <CardTitle>Add New Account</CardTitle>
          <CardDescription>Connect a new social media account to manage from this dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="platform">Platform</Label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Facebook className="h-5 w-5 text-[#1877F2]" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                </Button>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Youtube className="h-5 w-5 text-[#FF0000]" />
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="account-url">Account URL</Label>
              <div className="flex gap-2 mt-2">
                <Input id="account-url" placeholder="https://..." className="bg-[#001428]" />
                <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
                  <Link2 className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
