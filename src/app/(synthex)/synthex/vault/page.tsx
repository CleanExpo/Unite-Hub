/**
 * Synthex Digital Vault
 *
 * Secure storage for brand assets and credentials:
 * - File upload and management
 * - Brand asset organization
 * - Secure credential storage
 * - Access controls
 *
 * TODO[PHASE_B3]: Wire up file storage API
 * TODO[PHASE_B3]: Implement secure credential storage
 * TODO[PHASE_B4]: Add access controls
 *
 * Backlog: SYNTHEX-009
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Lock,
  Upload,
  File,
  Image,
  Key,
  Shield,
  FolderOpen,
  FileText,
  Plus,
} from 'lucide-react';

export default function SynthexVaultPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Digital Vault</h1>
          <p className="text-gray-400 mt-2">
            Secure storage for your brand assets and credentials
          </p>
        </div>
        {/* TODO[PHASE_B3]: Wire up file upload */}
        <Button disabled className="gap-2">
          <Upload className="h-4 w-4" />
          Upload Files
        </Button>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <File className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">0</p>
                <p className="text-sm text-gray-400">Total Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Image className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">0</p>
                <p className="text-sm text-gray-400">Brand Assets</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Key className="h-8 w-8 text-amber-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">0</p>
                <p className="text-sm text-gray-400">Credentials</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">0 MB</p>
                <p className="text-sm text-gray-400">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vault Tabs */}
      <Tabs defaultValue="assets" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="assets" className="data-[state=active]:bg-gray-700">
            <Image className="h-4 w-4 mr-2" />
            Brand Assets
          </TabsTrigger>
          <TabsTrigger value="files" className="data-[state=active]:bg-gray-700">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="credentials" className="data-[state=active]:bg-gray-700">
            <Key className="h-4 w-4 mr-2" />
            Credentials
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Brand Assets</CardTitle>
              <CardDescription className="text-gray-400">
                Logos, images, and brand materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO[PHASE_B3]: Implement asset grid */}
              <div className="text-center py-16">
                <Image className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No Assets Yet
                </h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Upload your brand logos, images, and other visual assets.
                  They&apos;ll be available for use in your content.
                </p>
                <Button disabled className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload Brand Assets
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Documents</CardTitle>
              <CardDescription className="text-gray-400">
                PDFs, presentations, and other files
              </CardDescription>
            </CardHeader>
            <CardContent className="py-16 text-center">
              {/* TODO[PHASE_B3]: Implement document list */}
              <FileText className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">No documents uploaded</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Secure Credentials
              </CardTitle>
              <CardDescription className="text-gray-400">
                API keys, passwords, and access tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="py-16 text-center">
              {/* TODO[PHASE_B3]: Implement credential vault */}
              <Lock className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No credentials stored</p>
              <Badge variant="secondary">Secure storage coming in Phase B3</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Security Info */}
      <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-800/50">
        <CardHeader>
          <CardTitle className="text-gray-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            Security
          </CardTitle>
          <CardDescription className="text-gray-400">
            Your data is protected with enterprise-grade security
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <Lock className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-gray-300">Encrypted Storage</p>
                <p className="text-xs text-gray-500">AES-256 encryption</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <Shield className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-gray-300">Access Control</p>
                <p className="text-xs text-gray-500">Role-based permissions</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <Key className="h-5 w-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-gray-300">Secure Sharing</p>
                <p className="text-xs text-gray-500">Time-limited access</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
