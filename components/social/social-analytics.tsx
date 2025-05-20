"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Facebook, Linkedin, Twitter, Youtube, TrendingUp, Users, MessageSquare, Share2, Eye } from "lucide-react"

export function SocialAnalytics() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <h2 className="text-xl font-semibold">Performance Overview</h2>
        <div className="flex gap-2">
          <Select defaultValue="7days">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">Last year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#001428]/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Followers</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              12,458
              <span className="text-sm font-normal text-green-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +5.2%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Across all platforms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#001428]/50">
          <CardHeader className="pb-2">
            <CardDescription>Engagement Rate</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              4.7%
              <span className="text-sm font-normal text-green-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.8%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                <span>Avg. across platforms</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#001428]/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Impressions</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              87,245
              <span className="text-sm font-normal text-green-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.3%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span>Last 30 days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#001428]/50">
          <CardHeader className="pb-2">
            <CardDescription>Total Shares</CardDescription>
            <CardTitle className="text-2xl flex items-center gap-2">
              1,892
              <span className="text-sm font-normal text-green-500 flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" />
                +7.5%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Share2 className="h-4 w-4" />
                <span>Last 30 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="facebook">Facebook</TabsTrigger>
          <TabsTrigger value="twitter">Twitter</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="youtube">YouTube</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#001428]/50">
              <CardHeader>
                <CardTitle className="text-lg">Followers by Platform</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Facebook className="h-5 w-5 text-[#1877F2]" />
                      <span>Facebook</span>
                    </div>
                    <span>5,245</span>
                    <div className="w-1/3 bg-gray-700 rounded-full h-2">
                      <div className="bg-[#1877F2] h-2 rounded-full" style={{ width: "65%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                      <span>Twitter</span>
                    </div>
                    <span>3,128</span>
                    <div className="w-1/3 bg-gray-700 rounded-full h-2">
                      <div className="bg-[#1DA1F2] h-2 rounded-full" style={{ width: "40%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                      <span>LinkedIn</span>
                    </div>
                    <span>2,845</span>
                    <div className="w-1/3 bg-gray-700 rounded-full h-2">
                      <div className="bg-[#0A66C2] h-2 rounded-full" style={{ width: "35%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Youtube className="h-5 w-5 text-[#FF0000]" />
                      <span>YouTube</span>
                    </div>
                    <span>1,240</span>
                    <div className="w-1/3 bg-gray-700 rounded-full h-2">
                      <div className="bg-[#FF0000] h-2 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#001428]/50">
              <CardHeader>
                <CardTitle className="text-lg">Engagement by Platform</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Facebook className="h-5 w-5 text-[#1877F2]" />
                      <span>Facebook</span>
                    </div>
                    <span>4.2%</span>
                    <div className="w-1/3 bg-gray-700 rounded-full h-2">
                      <div className="bg-[#1877F2] h-2 rounded-full" style={{ width: "55%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Twitter className="h-5 w-5 text-[#1DA1F2]" />
                      <span>Twitter</span>
                    </div>
                    <span>3.8%</span>
                    <div className="w-1/3 bg-gray-700 rounded-full h-2">
                      <div className="bg-[#1DA1F2] h-2 rounded-full" style={{ width: "45%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                      <span>LinkedIn</span>
                    </div>
                    <span>5.7%</span>
                    <div className="w-1/3 bg-gray-700 rounded-full h-2">
                      <div className="bg-[#0A66C2] h-2 rounded-full" style={{ width: "70%" }}></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Youtube className="h-5 w-5 text-[#FF0000]" />
                      <span>YouTube</span>
                    </div>
                    <span>6.2%</span>
                    <div className="w-1/3 bg-gray-700 rounded-full h-2">
                      <div className="bg-[#FF0000] h-2 rounded-full" style={{ width: "80%" }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#001428]/50">
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-[#002a42] rounded-md">
                  <Facebook className="h-5 w-5 text-[#1877F2] mt-1" />
                  <div className="flex-1">
                    <p className="line-clamp-2 mb-2">
                      Check out our latest course on water damage restoration techniques! Enrol now for IICRC credits.
                    </p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        2,458
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        124
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        78
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#002a42] rounded-md">
                  <Linkedin className="h-5 w-5 text-[#0A66C2] mt-1" />
                  <div className="flex-1">
                    <p className="line-clamp-2 mb-2">
                      UNITE Group is proud to announce our new partnership with leading restoration equipment providers.
                    </p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        1,872
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        86
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        45
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-[#002a42] rounded-md">
                  <Youtube className="h-5 w-5 text-[#FF0000] mt-1" />
                  <div className="flex-1">
                    <p className="line-clamp-2 mb-2">
                      New video: Advanced techniques for fire damage assessment and restoration planning.
                    </p>
                    <div className="flex gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        3,245
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        156
                      </span>
                      <span className="flex items-center gap-1">
                        <Share2 className="h-3 w-3" />
                        92
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {["facebook", "twitter", "linkedin", "youtube"].map((platform) => (
          <TabsContent key={platform} value={platform} className="space-y-6">
            <Card className="bg-[#001428]/50">
              <CardHeader>
                <CardTitle className="text-lg capitalize">{platform} Analytics</CardTitle>
                <CardDescription>Detailed metrics for your {platform} account</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Platform-specific analytics would be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
