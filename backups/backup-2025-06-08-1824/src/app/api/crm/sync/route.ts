import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  CRMSyncRequest, 
  CRMSyncResponse, 
  UnifiedCustomer 
} from '@/lib/types/crm-integration';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CRMSyncRequest = await request.json();
    
    // Mock implementation - in production, this would sync with actual CRM systems
    const mockCustomer: UnifiedCustomer = {
      customerId: body.customerId,
      basicInfo: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+61 400 000 000',
        company: {
          name: 'Example Corp',
          size: 'medium',
          industry: 'Technology',
          website: 'https://example.com'
        },
        location: {
          country: 'Australia',
          state: 'QLD',
          city: 'Brisbane',
          timezone: 'Australia/Brisbane'
        }
      },
      uniteServices: {
        consultationHistory: [
          {
            id: 'CONS-001',
            date: new Date('2025-01-15'),
            type: 'initial',
            duration: 60,
            attendees: ['John Doe', 'Unite Consultant'],
            outcome: 'Identified need for software development and SEO services'
          }
        ],
        activeProjects: [
          {
            id: 'PROJ-001',
            name: 'Website Redesign',
            type: 'software',
            status: 'active',
            startDate: new Date('2025-02-01'),
            budget: 50000,
            spent: 15000,
            milestones: [],
            teamMembers: ['Developer 1', 'Designer 1']
          }
        ],
        servicePackages: [],
        billingHistory: [],
        totalSpent: 15000
      },
      carsiEducation: {
        membershipStatus: 'active',
        membershipType: 'Professional',
        membershipExpiry: new Date('2026-01-01'),
        coursesEnrolled: [
          {
            courseId: 'WRT-001',
            courseName: 'Water Damage Restoration',
            enrollmentDate: new Date('2025-01-20'),
            progress: 75,
            status: 'active'
          }
        ],
        coursesCompleted: [],
        certificationsEarned: [],
        cecCredits: {
          total: 0,
          expiring: 0
        },
        learningProgress: []
      },
      engagementAnalytics: {
        combinedLTV: 65000,
        crossSellOpportunities: [
          {
            id: 'OPP-001',
            type: 'unite-to-carsi',
            confidence: 85,
            recommendation: 'Digital Marketing Certification',
            reason: 'Client is investing in SEO services',
            potentialValue: 2500,
            priority: 'high'
          }
        ],
        engagementScore: 78,
        lastActivity: new Date(),
        preferredContactMethod: 'email',
        communicationPreferences: {
          marketingEmails: true,
          courseNotifications: true,
          projectUpdates: true,
          newsletter: true
        }
      },
      metadata: {
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date(),
        source: 'merged',
        tags: ['vip', 'growth-potential']
      }
    };

    const response: CRMSyncResponse = {
      success: true,
      customer: mockCustomer,
      syncedAt: new Date(),
      nextSyncRecommended: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('CRM sync error:', error);
    return NextResponse.json(
      { 
        success: false,
        errors: ['Failed to sync customer data'],
        syncedAt: new Date()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const customerId = searchParams.get('customerId');

  if (!customerId) {
    return NextResponse.json(
      { error: 'Customer ID required' },
      { status: 400 }
    );
  }

  // For now, redirect to POST endpoint functionality
  return NextResponse.json(
    { message: 'Use POST method for CRM sync' },
    { status: 405 }
  );
}
