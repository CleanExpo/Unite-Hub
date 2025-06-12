import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { UnifiedCustomerDashboard } from '@/components/crm/UnifiedCustomerDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Shield, Users, BookOpen, Package } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Customer Portal | Unite Group + CARSI',
  description: 'Access your unified dashboard for Unite Group services and CARSI education programs',
};

export default async function CustomerPortalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // In a real implementation, we would fetch the customer ID from the database
  // based on the authenticated user. For now, we'll use a mock customer ID
  const customerId = 'UG-12345';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Customer Portal</h1>
              <p className="text-teal-100">
                Your unified dashboard for Unite Group services and CARSI education
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-white/20 text-white border-white/40">
                <Shield className="h-4 w-4 mr-1" />
                Secure Portal
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/projects">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Package className="h-8 w-8 text-blue-600" />
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-1">Active Projects</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View and manage your Unite Group projects
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="https://carsi.au/dashboard" target="_blank" rel="noopener noreferrer">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <BookOpen className="h-8 w-8 text-teal-600" />
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-1">My Courses</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Access your CARSI training and certifications
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/dashboard/billing">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Users className="h-8 w-8 text-purple-600" />
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-1">Billing & Invoices</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage payments across both platforms
                </p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/support">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Shield className="h-8 w-8 text-green-600" />
                  <ArrowRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold mb-1">Support Center</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get help with any service or course
                </p>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Main Dashboard */}
        <UnifiedCustomerDashboard customerId={customerId} />
      </div>
    </div>
  );
}
