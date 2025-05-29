"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabaseClient } from "@/lib/supabase/client";
import { Calendar, Clock, User, Briefcase, FileText, Loader2, PlusCircle, BarChart } from "lucide-react";

interface Consultation {
  id: string;
  client_name: string;
  client_email: string;
  service_type: string;
  preferred_date: string;
  preferred_time: string;
  status: string;
  payment_status: string;
  created_at: string;
  scheduled_at: string | null;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  client?: { id: string; email: string };
  status: string;
  start_date: string | null;
  target_completion_date: string | null;
  actual_completion_date: string | null;
  budget: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  assigned_to: string | null;
  priority: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      
      if (error) {
        console.error("Error checking session:", error);
        setError("Error checking authentication status");
        setLoading(false);
        return;
      }
      
      if (!session) {
        // Redirect to login if not authenticated
        router.push("/login");
        return;
      }
      
      setUser(session.user);
      
      // Check if user is admin
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
        
      setIsAdmin(profile?.role === 'admin');
      
      // Fetch consultations and projects
      fetchConsultations();
      fetchProjects();
    };
    
    checkUser();
  }, [router]);
  
  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/consultations");
      
      if (!response.ok) {
        throw new Error("Failed to fetch consultations");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setConsultations(data.data);
      } else {
        throw new Error(data.error || "Unknown error fetching consultations");
      }
    } catch (error) {
      console.error("Error fetching consultations:", error);
      setError(error instanceof Error ? error.message : "Failed to load your consultations");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      const response = await fetch("/api/projects");
      
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProjects(data.data);
      } else {
        throw new Error(data.error || "Unknown error fetching projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjectsError(error instanceof Error ? error.message : "Failed to load your projects");
    } finally {
      setProjectsLoading(false);
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-800">Pending</Badge>;
      case "scheduled":
        return <Badge className="bg-green-600/20 text-green-400 border-green-800">Scheduled</Badge>;
      case "completed":
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-800">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-600/20 text-red-400 border-red-800">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-600/20 text-slate-400 border-slate-800">{status}</Badge>;
    }
  };
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-600/20 text-green-400 border-green-800">Paid</Badge>;
      case "unpaid":
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-800">Unpaid</Badge>;
      case "refunded":
        return <Badge className="bg-purple-600/20 text-purple-400 border-purple-800">Refunded</Badge>;
      default:
        return <Badge className="bg-slate-600/20 text-slate-400 border-slate-800">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-white">
            <span className="text-teal-400">UG</span> UNITE Group
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="/features" className="text-slate-300 hover:text-white transition-colors">Services</Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link>
            <Link href="/about" className="text-slate-300 hover:text-white transition-colors">About</Link>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-slate-300">
                  {user.email}
                </span>
                <Button 
                  variant="ghost" 
                  className="text-slate-300 hover:text-white hover:bg-slate-700"
                  onClick={async () => {
                    await supabaseClient.auth.signOut();
                    router.push("/login");
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <Link href="/login" className="text-slate-300 hover:text-white px-4 py-2 rounded-md transition-colors">
                Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">My Dashboard</h1>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button asChild variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                <Link href="/dashboard/analytics">
                  <BarChart className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
            )}
            <Button asChild className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
              <Link href="/book-consultation">Book New Consultation</Link>
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="consultations" className="w-full">
          <TabsList className="bg-slate-800 border-slate-700 mb-8">
            <TabsTrigger value="consultations" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              My Consultations
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Projects
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Profile
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="consultations">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">My Consultation Bookings</CardTitle>
                <CardDescription className="text-slate-400">
                  View and manage your consultation bookings with UNITE Group.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
                    <span className="ml-3 text-slate-300">Loading your consultations...</span>
                  </div>
                ) : error ? (
                  <div className="bg-red-900/20 text-red-400 border border-red-800 rounded-md p-4">
                    <p className="font-medium">Error loading consultations</p>
                    <p className="text-sm">{error}</p>
                  </div>
                ) : consultations.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-300 mb-6">You haven't booked any consultations yet.</p>
                    <Button asChild className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                      <Link href="/book-consultation">Book Your First Consultation</Link>
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>A list of your recent consultations.</TableCaption>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-750">
                        <TableHead className="text-slate-300">Service</TableHead>
                        <TableHead className="text-slate-300">Date & Time</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Payment</TableHead>
                        <TableHead className="text-slate-300">Created</TableHead>
                        <TableHead className="text-right text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultations.map((consultation) => (
                        <TableRow key={consultation.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="font-medium text-white">
                            {consultation.service_type}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-teal-400" />
                              {formatDate(consultation.preferred_date)}
                            </div>
                            <div className="flex items-center mt-1 text-sm">
                              <Clock className="h-3 w-3 mr-2 text-teal-400" />
                              {consultation.preferred_time}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(consultation.status)}
                          </TableCell>
                          <TableCell>
                            {getPaymentStatusBadge(consultation.payment_status)}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {new Date(consultation.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="projects">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-white">Projects</CardTitle>
                  <CardDescription className="text-slate-400">
                    View and manage your projects with UNITE Group.
                  </CardDescription>
                </div>
                <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              </CardHeader>
              <CardContent>
                {projectsLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
                    <span className="ml-3 text-slate-300">Loading your projects...</span>
                  </div>
                ) : projectsError ? (
                  <div className="bg-red-900/20 text-red-400 border border-red-800 rounded-md p-4">
                    <p className="font-medium">Error loading projects</p>
                    <p className="text-sm">{projectsError}</p>
                  </div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-slate-300 mb-6">You don't have any active projects yet.</p>
                    <p className="text-slate-400 mb-6">Projects are created after your consultation is complete and a work plan is established.</p>
                  </div>
                ) : (
                  <Table>
                    <TableCaption>A list of your active projects.</TableCaption>
                    <TableHeader>
                      <TableRow className="border-slate-700 hover:bg-slate-750">
                        <TableHead className="text-slate-300">Project</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Timeline</TableHead>
                        <TableHead className="text-slate-300">Priority</TableHead>
                        <TableHead className="text-slate-300">Last Update</TableHead>
                        <TableHead className="text-right text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projects.map((project) => (
                        <TableRow key={project.id} className="border-slate-700 hover:bg-slate-700/50">
                          <TableCell className="font-medium text-white">
                            {project.title}
                            {project.description && (
                              <p className="text-xs text-slate-400 mt-1 truncate max-w-[250px]">
                                {project.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              switch (project.status.toLowerCase()) {
                                case 'planning':
                                  return <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">Planning</Badge>;
                                case 'in-progress':
                                  return <Badge className="bg-green-900/20 text-green-400 border-green-800">In Progress</Badge>;
                                case 'review':
                                  return <Badge className="bg-purple-900/20 text-purple-400 border-purple-800">Review</Badge>;
                                case 'completed':
                                  return <Badge className="bg-teal-900/20 text-teal-400 border-teal-800">Completed</Badge>;
                                case 'on-hold':
                                  return <Badge className="bg-yellow-900/20 text-yellow-400 border-yellow-800">On Hold</Badge>;
                                case 'cancelled':
                                  return <Badge className="bg-red-900/20 text-red-400 border-red-800">Cancelled</Badge>;
                                default:
                                  return <Badge className="bg-slate-900/20 text-slate-400 border-slate-800">{project.status}</Badge>;
                              }
                            })()}
                          </TableCell>
                          <TableCell className="text-slate-300">
                            {project.start_date && (
                              <div className="flex items-center text-xs">
                                <Calendar className="h-3 w-3 mr-1 text-teal-400" />
                                <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            {project.target_completion_date && (
                              <div className="flex items-center text-xs mt-1">
                                <Calendar className="h-3 w-3 mr-1 text-teal-400" />
                                <span>Target: {new Date(project.target_completion_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              switch (project.priority.toLowerCase()) {
                                case 'low':
                                  return <Badge className="bg-slate-700/20 text-slate-400 border-slate-600">Low</Badge>;
                                case 'medium':
                                  return <Badge className="bg-blue-900/20 text-blue-400 border-blue-800">Medium</Badge>;
                                case 'high':
                                  return <Badge className="bg-orange-900/20 text-orange-400 border-orange-800">High</Badge>;
                                case 'urgent':
                                  return <Badge className="bg-red-900/20 text-red-400 border-red-800">Urgent</Badge>;
                                default:
                                  return <Badge className="bg-slate-700/20 text-slate-400 border-slate-600">{project.priority}</Badge>;
                              }
                            })()}
                          </TableCell>
                          <TableCell className="text-slate-400 text-sm">
                            {new Date(project.updated_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="profile">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-xl text-white">My Profile</CardTitle>
                <CardDescription className="text-slate-400">
                  View and update your profile information.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
                    <span className="ml-3 text-slate-300">Loading your profile...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-750 p-4 rounded-md border border-slate-700">
                        <div className="flex items-center mb-3">
                          <User className="h-5 w-5 mr-2 text-teal-400" />
                          <h3 className="text-lg font-medium text-white">Account Information</h3>
                        </div>
                        <div className="space-y-2 text-slate-300">
                          <p>
                            <span className="text-slate-400 text-sm">Email:</span><br />
                            {user?.email}
                          </p>
                          <p>
                            <span className="text-slate-400 text-sm">Account Created:</span><br />
                            {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                          <p>
                            <span className="text-slate-400 text-sm">Last Sign In:</span><br />
                            {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-slate-750 p-4 rounded-md border border-slate-700">
                        <div className="flex items-center mb-3">
                          <Briefcase className="h-5 w-5 mr-2 text-teal-400" />
                          <h3 className="text-lg font-medium text-white">Consultation Summary</h3>
                        </div>
                        <div className="space-y-2 text-slate-300">
                          <p>
                            <span className="text-slate-400 text-sm">Total Consultations:</span><br />
                            {consultations.length}
                          </p>
                          <p>
                            <span className="text-slate-400 text-sm">Upcoming Consultations:</span><br />
                            {consultations.filter(c => c.status.toLowerCase() === 'scheduled').length}
                          </p>
                          <p>
                            <span className="text-slate-400 text-sm">Completed Consultations:</span><br />
                            {consultations.filter(c => c.status.toLowerCase() === 'completed').length}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4 mt-8">
                      <Button 
                        className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white"
                      >
                        Edit Profile
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                      >
                        Change Password
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-red-800 text-red-400 hover:bg-red-900/30 hover:text-red-300"
                      >
                        Delete Account
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
