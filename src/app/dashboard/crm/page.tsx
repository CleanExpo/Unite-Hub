import { useState, useEffect } from 'react';

interface PipelineStage {
  stage: string;
  count: number;
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
}

interface TaskItem {
  id: string;
  title: string;
  due_date: string;
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    dealsCount: number;
    tasksCount: number;
    activitiesCount: number;
    pipelineData: PipelineStage[];
    recentActivities: ActivityItem[];
    upcomingTasks: TaskItem[];
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/crm/dashboard');
        if (!response.ok) {
          throw new Error(`API response not OK: ${response.status}`);
        }
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!dashboardData) {
    return <div>Error: Dashboard data is missing</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">CRM Dashboard</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Deals</h2>
          <p className="text-2xl">{dashboardData.dealsCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Tasks</h2>
          <p className="text-2xl">{dashboardData.tasksCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2">Activities</h2>
          <p className="text-2xl">{dashboardData.activitiesCount}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Pipeline</h2>
        <div className="space-y-3">
          {dashboardData.pipelineData.map((stage) => (
            <div key={stage.stage} className="flex justify-between items-center">
              <span className="font-medium">{stage.stage}</span>
              <span className="text-lg">{stage.count} deals</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
        <ul className="list-disc pl-5 space-y-2">
          {dashboardData.recentActivities.slice(0, 5).map((activity) => (
            <li key={activity.id}>
              {activity.type}: {activity.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Upcoming Tasks</h2>
        <ul className="list-disc pl-5 space-y-2">
          {dashboardData.upcomingTasks.slice(0, 5).map((task) => (
            <li key={task.id}>
              {task.title} - {task.due_date}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
