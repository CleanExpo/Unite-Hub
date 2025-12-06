/**
 * Synthex Projects
 *
 * Project/client management:
 * - Project list with status
 * - Create/edit project forms
 * - Project-scoped content and campaigns
 * - Team member assignment
 *
 * TODO[PHASE_B3]: Wire up project APIs
 * TODO[PHASE_B3]: Implement project creation
 * TODO[PHASE_B4]: Add team collaboration features
 *
 * Backlog: SYNTHEX-007
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle,
  Users,
  FileText,
  MoreVertical,
} from 'lucide-react';

export default function SynthexProjectsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Projects</h1>
          <p className="text-gray-400 mt-2">
            Organize your marketing work by project or client
          </p>
        </div>
        {/* TODO[PHASE_B3]: Wire up project creation */}
        <Button disabled className="gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FolderKanban className="h-8 w-8 text-blue-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">0</p>
                <p className="text-sm text-gray-400">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-purple-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">0</p>
                <p className="text-sm text-gray-400">Content Pieces</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-gray-100">0</p>
                <p className="text-sm text-gray-400">Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects List */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-gray-100">Your Projects</CardTitle>
          <CardDescription className="text-gray-400">
            Manage all your marketing projects in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* TODO[PHASE_B3]: Implement project list */}
          <div className="text-center py-16">
            <FolderKanban className="h-16 w-16 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              No Projects Yet
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-6">
              Create projects to organize your marketing efforts.
              Each project can have its own content, campaigns, and team members.
            </p>
            <Button disabled className="gap-2">
              <Plus className="h-4 w-4" />
              Create Your First Project
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Project Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-2">
              <FolderKanban className="h-5 w-5 text-blue-400" />
            </div>
            <CardTitle className="text-gray-100 text-lg">Organization</CardTitle>
            <CardDescription className="text-gray-400">
              Keep content and campaigns organized by project or client
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-purple-400" />
            </div>
            <CardTitle className="text-gray-100 text-lg">Collaboration</CardTitle>
            <CardDescription className="text-gray-400">
              Invite team members and collaborate on projects
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
            </div>
            <CardTitle className="text-gray-100 text-lg">Tracking</CardTitle>
            <CardDescription className="text-gray-400">
              Track progress and performance per project
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="text-center">
        <Badge variant="secondary">Project management coming in Phase B3</Badge>
      </div>
    </div>
  );
}
