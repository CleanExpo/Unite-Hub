import { NextRequest, NextResponse } from 'next/server';
import { BUNDLE_OFFERINGS, BundleOffering } from '@/lib/types/crm-integration';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetAudience = searchParams.get('targetAudience');
    const minSavings = searchParams.get('minSavings');

    let bundles = [...BUNDLE_OFFERINGS];

    // Filter by target audience if specified
    if (targetAudience) {
      bundles = bundles.filter(bundle => 
        bundle.targetAudience.includes(targetAudience)
      );
    }

    // Filter by minimum savings if specified
    if (minSavings) {
      const minSavingsNum = parseInt(minSavings);
      bundles = bundles.filter(bundle => bundle.savings >= minSavingsNum);
    }

    return NextResponse.json({
      bundles,
      total: bundles.length
    });
  } catch (error) {
    console.error('Bundle fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bundle offerings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, bundleId } = body;

    if (!customerId || !bundleId) {
      return NextResponse.json(
        { error: 'Customer ID and Bundle ID required' },
        { status: 400 }
      );
    }

    const bundle = BUNDLE_OFFERINGS.find(b => b.id === bundleId);
    if (!bundle) {
      return NextResponse.json(
        { error: 'Bundle not found' },
        { status: 404 }
      );
    }

    // Mock implementation - in production, this would create an order
    const order = {
      id: `ORDER-${Date.now()}`,
      customerId,
      bundleId,
      bundle,
      status: 'pending',
      createdAt: new Date(),
      totalPrice: bundle.totalPrice,
      savings: bundle.savings,
      estimatedStartDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week from now
    };

    return NextResponse.json({
      success: true,
      order,
      message: 'Bundle order created successfully'
    });
  } catch (error) {
    console.error('Bundle order error:', error);
    return NextResponse.json(
      { error: 'Failed to create bundle order' },
      { status: 500 }
    );
  }
}
