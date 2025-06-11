'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CrossSellOpportunity, 
  UnifiedCustomer,
  BUNDLE_OFFERINGS 
} from '@/lib/types/crm-integration';
import { 
  Sparkles, TrendingUp, Target, DollarSign, 
  BookOpen, Package, ChevronRight, AlertCircle,
  CheckCircle, Clock, Users, Award
} from 'lucide-react';
import Link from 'next/link';

interface CrossSellOpportunitiesProps {
  customerId: string;
  onOpportunitySelect?: (opportunity: CrossSellOpportunity) => void;
}

export function CrossSellOpportunities({ customerId, onOpportunitySelect }: CrossSellOpportunitiesProps) {
  const [opportunities, setOpportunities] = useState<CrossSellOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<CrossSellOpportunity | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, [customerId]);

  const fetchOpportunities = async () => {
    try {
      // In production, this would be a dedicated endpoint
      const response = await fetch('/api/crm/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, syncType: 'partial' })
      });

      if (response.ok) {
        const data = await response.json();
        setOpportunities(data.customer?.engagementAnalytics?.crossSellOpportunities || []);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getOpportunityIcon = (type: string) => {
    return type === 'unite-to-carsi' ? <BookOpen className="h-5 w-5" /> : <Package className="h-5 w-5" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      case 'medium': return 'text-orange-600 bg-orange-50 dark:bg-orange-900/20';
      case 'low': return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  const handleSelectOpportunity = (opportunity: CrossSellOpportunity) => {
    setSelectedOpportunity(opportunity);
    onOpportunitySelect?.(opportunity);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  const highPriorityOpportunities = opportunities.filter(o => o.priority === 'high');
  const totalPotentialValue = opportunities.reduce((sum, o) => sum + o.potentialValue, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {opportunities.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Identified cross-sell options
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Potential Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalPotentialValue)}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Combined opportunity value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              High Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {highPriorityOpportunities.length}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Immediate action needed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {Math.round(opportunities.reduce((sum, o) => sum + o.confidence, 0) / opportunities.length)}%
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Recommendation accuracy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-600" />
              <CardTitle>Cross-Sell Opportunities</CardTitle>
            </div>
            <Badge className="bg-teal-600 text-white">
              AI-Powered Recommendations
            </Badge>
          </div>
          <CardDescription>
            Personalized recommendations based on customer profile and behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Opportunities</TabsTrigger>
              <TabsTrigger value="unite-to-carsi">Training Recommendations</TabsTrigger>
              <TabsTrigger value="carsi-to-unite">Service Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {opportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onSelect={() => handleSelectOpportunity(opportunity)}
                  isSelected={selectedOpportunity?.id === opportunity.id}
                />
              ))}
            </TabsContent>

            <TabsContent value="unite-to-carsi" className="space-y-4">
              {opportunities
                .filter(o => o.type === 'unite-to-carsi')
                .map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onSelect={() => handleSelectOpportunity(opportunity)}
                    isSelected={selectedOpportunity?.id === opportunity.id}
                  />
                ))}
            </TabsContent>

            <TabsContent value="carsi-to-unite" className="space-y-4">
              {opportunities
                .filter(o => o.type === 'carsi-to-unite')
                .map((opportunity) => (
                  <OpportunityCard
                    key={opportunity.id}
                    opportunity={opportunity}
                    onSelect={() => handleSelectOpportunity(opportunity)}
                    isSelected={selectedOpportunity?.id === opportunity.id}
                  />
                ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Selected Opportunity Details */}
      {selectedOpportunity && (
        <Card className="border-teal-600">
          <CardHeader>
            <CardTitle>Opportunity Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">{selectedOpportunity.recommendation}</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedOpportunity.reason}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h5 className="font-medium">Key Benefits</h5>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Complementary to existing services</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">High customer success rate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span className="text-sm">Immediate implementation available</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h5 className="font-medium">Next Steps</h5>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-sm font-medium">1.</span>
                      <span className="text-sm">Schedule consultation call</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sm font-medium">2.</span>
                      <span className="text-sm">Review bundle options</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sm font-medium">3.</span>
                      <span className="text-sm">Create implementation plan</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Potential Value</span>
                  <div className="text-2xl font-bold">{formatCurrency(selectedOpportunity.potentialValue)}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Schedule Call</Button>
                  <Button className="bg-teal-600 hover:bg-teal-700">
                    View Details
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Opportunity Card Component
function OpportunityCard({ 
  opportunity, 
  onSelect, 
  isSelected 
}: { 
  opportunity: CrossSellOpportunity;
  onSelect: () => void;
  isSelected: boolean;
}) {
  const getOpportunityIcon = (type: string) => {
    return type === 'unite-to-carsi' ? <BookOpen className="h-5 w-5" /> : <Package className="h-5 w-5" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/40';
      case 'medium': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/40';
      case 'low': return 'bg-gray-100 text-gray-800 dark:bg-gray-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20' : 'hover:border-gray-400'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          {getOpportunityIcon(opportunity.type)}
        </div>
        <div className="flex-grow">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {opportunity.recommendation}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {opportunity.reason}
              </p>
            </div>
            <Badge className={getPriorityColor(opportunity.priority)}>
              {opportunity.priority}
            </Badge>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-sm">
              <Target className="h-3 w-3 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">
                {opportunity.confidence}% confidence
              </span>
            </div>
            <div className="flex items-center gap-1 text-sm">
              <DollarSign className="h-3 w-3 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-white">
                {formatCurrency(opportunity.potentialValue)}
              </span>
            </div>
            <Progress value={opportunity.confidence} className="w-20 h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
