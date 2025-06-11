'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  progress: number;
  client: string;
  teamMembers: string[];
  tags: string[];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    // Mock data loading
    const loadProjects = async () => {
      try {
        setLoading(true);
        
        // Mock projects data
        const mockProjects: Project[] = [
          {
            id: '1',
            name: 'E-commerce Platform Redesign',
            description: 'Complete redesign of the e-commerce platform with modern UI/UX',
            status: 'in-progress',
            priority: 'high',
            startDate: '2024-01-15',
            endDate: '2024-04-15',
            budget: 50000,
            spent: 32000,
            progress: 65,
            client: 'TechCorp Inc.',
            teamMembers: ['John Doe', 'Jane Smith', 'Mike Johnson'],
            tags: ['UI/UX', 'E-commerce', 'React']
          },
          {
            id: '2',
            name: 'Mobile App Development',
            description: 'Native mobile application for iOS and Android',
            status: 'planning',
            priority: 'medium',
            startDate: '2024-03-01',
            endDate: '2024-08-01',
            budget: 75000,
            spent: 5000,
            progress: 10,
            client: 'StartupXYZ',
            teamMembers: ['Sarah Wilson', 'Tom Brown'],
            tags: ['Mobile', 'iOS', 'Android', 'React Native']
          },
          {
            id: '3',
            name: 'Data Analytics Dashboard',
            description: 'Business intelligence dashboard with real-time analytics',
            status: 'completed',
            priority: 'medium',
            startDate: '2023-10-01',
            endDate: '2024-01-01',
            budget: 30000,
            spent: 28500,
            progress: 100,
            client: 'DataCorp',
            teamMembers: ['Alex Chen', 'Lisa Park'],
            tags: ['Analytics', 'Dashboard', 'D3.js']
          },
          {
            id: '4',
            name: 'API Integration Project',
            description: 'Integration with third-party APIs and microservices architecture',
            status: 'on-hold',
            priority: 'low',
            startDate: '2024-02-01',
            endDate: '2024-06-01',
            budget: 25000,
            spent: 8000,
            progress: 25,
            client: 'Enterprise Solutions',
            teamMembers: ['David Lee', 'Emma Davis'],
            tags: ['API', 'Microservices', 'Node.js']
          }
        ];

        setProjects(mockProjects);
      } catch (error) {
        console.error('Failed to load projects:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planning':
        return <Badge className="bg-blue-100 text-blue-800">Planning</Badge>;
      case 'in-progress':
        return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'on-hold':
        return <Badge className="bg-gray-100 text-gray-800">On Hold</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'on-hold':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getProjectStats = () => {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const inProgress = projects.filter(p => p.status === 'in-progress').length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
    
    return { total, completed, inProgress, totalBudget, totalSpent };
  };

  const stats = getProjectStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projects</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage and track your projects</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${stats.totalSpent.toLocaleString()} spent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-3 py-1 text-sm w-64"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Status:</span>
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Status</option>
                <option value="planning">Planning</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Priority:</span>
              <select 
                value={priorityFilter} 
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="grid gap-6">
        {filteredProjects.map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(project.status)}
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                  </div>
                  <CardDescription>{project.description}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  {getStatusBadge(project.status)}
                  {getPriorityBadge(project.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Timeline</p>
                    <p className="text-xs text-gray-500">
                      {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Budget</p>
                    <p className="text-xs text-gray-500">
                      ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Team</p>
                    <p className="text-xs text-gray-500">{project.teamMembers.length} members</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium">Progress</p>
                    <p className="text-xs text-gray-500">{project.progress}% complete</p>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Client and Team */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm font-medium">Client: {project.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Team Members:</p>
                  <p className="text-xs text-gray-500">{project.teamMembers.join(', ')}</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredProjects.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No projects found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
