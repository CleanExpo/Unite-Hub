/**
 * Linear Integration Dashboard Page
 *
 * Displays Linear projects and allows management of issues.
 */

import { LinearProjectList } from '@/components/integrations/linear/LinearProjectList';

export default function LinearDashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Linear Projects</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Linear.app projects and issues from Unite-Hub
        </p>
      </div>

      <LinearProjectList />
    </div>
  );
}
