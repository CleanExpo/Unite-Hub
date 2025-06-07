'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  UnifiedCustomer, 
  CrossSellOpportunity,
  BUNDLE_OFFERINGS 
} from '@/lib/types/crm-integration';
import { 
  User, Building, MapPin, DollarSign, BookOpen, Award, 
  TrendingUp, Calendar, AlertCircle, Sparkles, Package,
  ChevronRight, Clock, Target, Users
} from 'lucide-react';
import Link from 'next/link';

interface UnifiedCustomerDashboardProps {
  customerId: string;
}

export function UnifiedCustomerDashboard({ customerId }: UnifiedCustomerDashboardProps) {
  const [customer, setCustomer] = useState<UnifiedCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  const fetchCustomerData = async () => {
    try {
      const response = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerId, 
          syncType: 'full',
          includeServices: true,
          includeEducation: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data.customer);
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Customer data not found</p>
      </div>
    );
  }

  const getOpportunityIcon = (opportunity: CrossSellOpportunity) => {
    return opportunity.type === 'unite-to-carsi' ? <BookOpen className="h-5 w-5" /> : <Package className="h-5 w-5" />;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Customer Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {customer.basicInfo.firstName} {customer.basicInfo.lastName}
            </h1>
            <div className="space-y-2 text-teal-100">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{customer.basicInfo.email}</span>
              </div>
              {customer.basicInfo.company && (
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>{customer.basicInfo.company.name} ({customer.basicInfo.company.size})</span>
                </div>
              )}
              {customer.basicInfo.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{customer.basicInfo.location.city}, {customer.basicInfo.location.state}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-teal-100">Customer ID</div>
            <div className="font-mono text-lg">{customer.customerId}</div>
            <Badge className="mt-2 bg-white/20 text-white border-white/40">
              Engagement Score: {customer.engagementAnalytics.engagementScore}%
            </Badge>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Lifetime Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(customer.engagementAnalytics.combinedLTV)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Across both platforms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {customer.uniteServices.activeProjects.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Unite Group services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Course Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {customer.carsiEducation.coursesEnrolled.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Active enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Certifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {customer.carsiEducation.certificationsEarned.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Earned to date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cross-sell Opportunities */}
      {customer.engagementAnalytics.crossSellOpportunities.length > 0 && (
        <Card className="border-teal-600">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              Growth Opportunities
            </CardTitle>
            <CardDescription>
              Recommended services based on customer profile and activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {customer.engagementAnalytics.crossSellOpportunities.map((opportunity) => (
                <div 
                  key={opportunity.id} 
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex-shrink-0 mt-1">
                    {getOpportunityIcon(opportunity)}
                  </div>
                  <div className="flex-grow">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {opportunity.recommendation}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {opportunity.reason}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <Badge 
                          variant={opportunity.priority === 'high' ? 'destructive' : 'secondary'}
                          className="mb-1"
                        >
                          {opportunity.priority}
                        </Badge>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(opportunity.potentialValue)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <Target className="h-3 w-3" />
                        <span>{opportunity.confidence}% confidence</span>
                      </div>
                      <Button size="sm" variant="outline" className="ml-auto">
                        View Details
                        <ChevronRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Unite Services</TabsTrigger>
          <TabsTrigger value="education">CARSI Education</TabsTrigger>
          <TabsTrigger value="bundles">Bundle Offers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>Last activity: {new Date(customer.engagementAnalytics.lastActivity).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span>Member since: {new Date(customer.metadata.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Communication Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Communication Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(customer.engagementAnalytics.communicationPreferences).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <Badge variant={value ? 'default' : 'secondary'}>
                      {value ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          {/* Active Projects */}
          {customer.uniteServices.activeProjects.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.uniteServices.activeProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold">{project.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {project.type} • Started {new Date(project.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge>{project.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Budget</span>
                          <span className="font-medium">{formatCurrency(project.budget)}</span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{Math.round((project.spent / project.budget) * 100)}%</span>
                          </div>
                          <Progress value={(project.spent / project.budget) * 100} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Consultation History */}
          <Card>
            <CardHeader>
              <CardTitle>Consultation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customer.uniteServices.consultationHistory.map((consultation) => (
                  <div key={consultation.id} className="flex items-start gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="font-medium">
                        {consultation.type.charAt(0).toUpperCase() + consultation.type.slice(1)} Consultation
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {new Date(consultation.date).toLocaleDateString()} • {consultation.duration} min
                      </div>
                      {consultation.outcome && (
                        <div className="mt-1 text-gray-600 dark:text-gray-400">
                          {consultation.outcome}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="education" className="space-y-4">
          {/* CARSI Membership */}
          <Card>
            <CardHeader>
              <CardTitle>CARSI Membership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge className={customer.carsiEducation.membershipStatus === 'active' ? 'bg-green-600' : ''}>
                    {customer.carsiEducation.membershipStatus}
                  </Badge>
                </div>
                {customer.carsiEducation.membershipType && (
                  <div className="flex items-center justify-between">
                    <span>Type</span>
                    <span className="font-medium">{customer.carsiEducation.membershipType}</span>
                  </div>
                )}
                {customer.carsiEducation.membershipExpiry && (
                  <div className="flex items-center justify-between">
                    <span>Expires</span>
                    <span className="font-medium">
                      {new Date(customer.carsiEducation.membershipExpiry).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Courses */}
          {customer.carsiEducation.coursesEnrolled.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.carsiEducation.coursesEnrolled.map((course) => (
                    <div key={course.courseId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{course.courseName}</h4>
                        <Badge variant="outline">{course.status}</Badge>
                      </div>
                      <Progress value={course.progress} />
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {course.progress}% complete • Enrolled {new Date(course.enrollmentDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {customer.carsiEducation.certificationsEarned.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Certifications Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customer.carsiEducation.certificationsEarned.map((cert) => (
                    <div key={cert.id} className="flex items-start gap-3">
                      <Award className="h-5 w-5 text-teal-600 mt-0.5" />
                      <div className="flex-grow">
                        <h4 className="font-medium">{cert.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {cert.type} • Issued {new Date(cert.issueDate).toLocaleDateString()}
                        </p>
                        {cert.expiryDate && (
                          <p className="text-sm text-orange-600 dark:text-orange-400">
                            Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="bundles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Bundles</CardTitle>
              <CardDescription>
                Special packages combining Unite Group services with CARSI training
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {BUNDLE_OFFERINGS.filter(bundle => 
                  bundle.targetAudience.includes(customer.basicInfo.company?.size || 'medium')
                ).map((bundle) => (
                  <div key={bundle.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{bundle.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {bundle.description}
                        </p>
                      </div>
                      <Badge className="bg-green-600 text-white">
                        Save {formatCurrency(bundle.savings)}
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <h5 className="text-sm font-medium mb-1">Unite Services</h5>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {bundle.uniteServices.map((service) => (
                            <li key={service}>• {service}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium mb-1">CARSI Courses</h5>
                        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          {bundle.carsiCourses.map((course) => (
                            <li key={course}>• {course}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-2xl font-bold">{formatCurrency(bundle.totalPrice)}</span>
                        {bundle.duration && (
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                            {bundle.duration}
                          </span>
                        )}
                      </div>
                      <Button>
                        Learn More
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
