export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'AI Dashboard | Unite Group',
  description: 'AI-powered insights and analytics'
};

export default function AIDashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">AI Dashboard</h1>
        <p className="text-muted-foreground">Leverage AI-powered insights for your business</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AI Analytics</CardTitle>
            <CardDescription>Real-time AI-powered analytics</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Advanced analytics powered by machine learning algorithms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Predictive Insights</CardTitle>
            <CardDescription>Forecast trends and patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI-driven predictions to help you make informed decisions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation</CardTitle>
            <CardDescription>Intelligent process automation</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Automate repetitive tasks with AI-powered workflows
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
