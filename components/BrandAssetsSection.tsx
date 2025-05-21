"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Upload, Globe, Search, Check, AlertCircle } from "lucide-react"
import Image from "next/image"

interface BrandAssetsProps {
  onComplete: (assets: any) => void
}

export function BrandAssetsSection({ onComplete }: BrandAssetsProps) {
  const [website, setWebsite] = useState("")
  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [brandAssets, setBrandAssets] = useState<any>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 5,
    maxSize: 5 * 1024 * 1024, // 5MB
  })

  const handleScan = async () => {
    if (!website) {
      setScanError("Please enter a website URL")
      return
    }

    setScanning(true)
    setScanError(null)

    try {
      const response = await fetch("/api/brand/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ website }),
      })

      if (!response.ok) {
        throw new Error(`Scanning failed: ${response.statusText}`)
      }

      const data = await response.json()
      setBrandAssets(data)
      onComplete(data)
    } catch (error) {
      console.error("Scan error:", error)
      setScanError(error instanceof Error ? error.message : "Failed to scan website")
    } finally {
      setScanning(false)
    }
  }

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      setUploadError("Please select files to upload")
      return
    }

    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10
          if (newProgress >= 100) {
            clearInterval(interval)
            return 100
          }
          return newProgress
        })
      }, 300)

      // In a real application, you would upload the files to your server or cloud storage
      // For now, we'll just simulate the upload and create asset objects
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const assets = {
        uploadedFiles: uploadedFiles.map((file) => ({
          name: file.name,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
        })),
      }

      setBrandAssets(assets)
      onComplete(assets)
      clearInterval(interval)
      setUploadProgress(100)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "Failed to upload files")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand Assets</CardTitle>
        <CardDescription>Scan your website or upload brand assets</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="scan" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scan">
              <Globe className="h-4 w-4 mr-2" />
              Website Scan
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Manual Upload
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="space-y-4 pt-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="website">Website URL</Label>
              <div className="flex space-x-2">
                <Input
                  id="website"
                  placeholder="e.g., example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  disabled={scanning}
                />
                <Button onClick={handleScan} disabled={scanning}>
                  {scanning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Scan
                    </>
                  )}
                </Button>
              </div>
            </div>

            {scanError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{scanError}</AlertDescription>
              </Alert>
            )}

            {brandAssets && !scanError && (
              <div className="space-y-4 mt-4">
                <Alert>
                  <Check className="h-4 w-4" />
                  <AlertDescription>Website scanned successfully!</AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {brandAssets.logoUrl && (
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <div className="border rounded-md p-4 flex items-center justify-center bg-gray-50 h-32">
                        <div className="relative h-full w-full">
                          <Image
                            src={brandAssets.logoUrl || "/placeholder.svg"}
                            alt="Logo"
                            fill
                            style={{ objectFit: "contain" }}
                            onError={(e) => {
                              // Handle image load error
                              e.currentTarget.src = "/abstract-logo.png"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {brandAssets.colors && (
                    <div className="space-y-2">
                      <Label>Brand Colors</Label>
                      <div className="flex space-x-2">
                        <div
                          className="h-10 w-10 rounded-md border"
                          style={{ backgroundColor: brandAssets.colors.primaryColor }}
                          title={brandAssets.colors.primaryColor}
                        />
                        <div
                          className="h-10 w-10 rounded-md border"
                          style={{ backgroundColor: brandAssets.colors.secondaryColor }}
                          title={brandAssets.colors.secondaryColor}
                        />
                        <div
                          className="h-10 w-10 rounded-md border"
                          style={{ backgroundColor: brandAssets.colors.accentColor }}
                          title={brandAssets.colors.accentColor}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {brandAssets.socials && Object.keys(brandAssets.socials).length > 0 && (
                  <div className="space-y-2">
                    <Label>Social Media</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(brandAssets.socials).map(([platform, url]) => (
                        <Button key={platform} variant="outline" size="sm" asChild>
                          <a href={url as string} target="_blank" rel="noopener noreferrer">
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {brandAssets.services && brandAssets.services.length > 0 && (
                  <div className="space-y-2">
                    <Label>Detected Services</Label>
                    <div className="flex flex-wrap gap-2">
                      {brandAssets.services.map((service: string, index: number) => (
                        <div key={index} className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                          {service}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4 pt-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-primary/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Drag & drop brand assets here, or click to select files
                <br />
                <span className="text-xs text-gray-500">
                  Supports: PNG, JPG, GIF, SVG, PDF (max 5MB per file, up to 5 files)
                </span>
              </p>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Files</Label>
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="text-sm flex justify-between items-center p-2 border rounded-md">
                      <span className="truncate max-w-[250px]">{file.name}</span>
                      <span className="text-gray-500">{formatFileSize(file.size)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {uploadError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <Button onClick={handleUpload} disabled={uploadedFiles.length === 0 || uploading} className="w-full">
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        {brandAssets ? (
          <div className="text-sm text-green-600 flex items-center">
            <Check className="h-4 w-4 mr-1" />
            Brand assets captured successfully
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            Capture your brand assets to ensure consistent styling in your architecture blueprint
          </div>
        )}
      </CardFooter>
    </Card>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}
