'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DecisionSimulator from '@/components/cognitiveTwin/DecisionSimulator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function NewDecisionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDecisionCreated = async (decisionId: string) => {
    setIsSubmitting(true);

    toast({
      title: 'Decision Created',
      description: 'Your decision scenario has been saved and is being analyzed.',
    });

    // Redirect to the decision detail page
    router.push(`/founder/cognitive-twin/decisions/${decisionId}`);
  };

  const handleError = (error: string) => {
    toast({
      title: 'Error',
      description: error,
      variant: 'destructive',
    });
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/founder/cognitive-twin/decisions">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Decisions
        </Link>
      </Button>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Decision Scenario</h1>
        <p className="text-muted-foreground">
          Describe your decision scenario and get AI-powered analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Decision Simulator</CardTitle>
          <CardDescription>
            Provide details about your decision, the options you're considering, and any constraints.
            The AI will analyze each option and provide recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DecisionSimulator
            onDecisionCreated={handleDecisionCreated}
            onError={handleError}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">1. Describe Your Scenario</h4>
              <p className="text-sm text-muted-foreground">
                Explain the decision you need to make and provide context about your situation.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">2. List Your Options</h4>
              <p className="text-sm text-muted-foreground">
                Add each option you're considering. Be as specific as possible about what each option entails.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">3. Set Constraints</h4>
              <p className="text-sm text-muted-foreground">
                Define any limitations like budget, timeline, resources, or regulatory requirements.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">4. Get AI Analysis</h4>
              <p className="text-sm text-muted-foreground">
                The AI will analyze each option against your constraints and provide recommendations based on
                your business context and historical data.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">5. Make & Track Decision</h4>
              <p className="text-sm text-muted-foreground">
                Record your final decision and track the outcome over time to improve future predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
