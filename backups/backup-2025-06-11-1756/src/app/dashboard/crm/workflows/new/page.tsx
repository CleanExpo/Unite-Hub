export const dynamic = 'force-dynamic'

import WorkflowBuilder from '@/components/crm/WorkflowBuilder';

export default function NewWorkflowPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create Workflow</h1>
        <p className="text-muted-foreground">
          Build automated workflows to streamline your CRM processes
        </p>
      </div>
      
      <WorkflowBuilder />
    </div>
  );
}
