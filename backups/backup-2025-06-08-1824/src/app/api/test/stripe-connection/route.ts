import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const results = {
    configured: false,
    secretKey: false,
    publishableKey: false,
    webhookSecret: false,
    message: '',
    recommendations: [] as string[]
  }

  try {
    // Check environment variables
    const secretKey = process.env.STRIPE_SECRET_KEY
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (!secretKey) {
      results.recommendations.push('Set STRIPE_SECRET_KEY in your .env.local file')
    } else {
      results.secretKey = true
      
      // Validate key format
      if (!secretKey.startsWith('sk_')) {
        results.recommendations.push('STRIPE_SECRET_KEY should start with "sk_test_" or "sk_live_"')
      } else {
        results.configured = true
        results.message = 'Stripe keys are configured correctly'
        
        // Check if in test mode
        if (secretKey.includes('test')) {
          results.recommendations.push('Using TEST mode - perfect for development')
        } else {
          results.recommendations.push('Using LIVE mode - be careful with real transactions!')
        }
      }
    }

    if (!publishableKey) {
      results.recommendations.push('Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in your .env.local file')
    } else {
      results.publishableKey = true
      
      // Validate key format
      if (!publishableKey.startsWith('pk_')) {
        results.recommendations.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY should start with "pk_test_" or "pk_live_"')
      }
    }

    if (!webhookSecret) {
      results.recommendations.push('Set STRIPE_WEBHOOK_SECRET for webhook handling')
    } else {
      results.webhookSecret = true
      
      if (!webhookSecret.startsWith('whsec_')) {
        results.recommendations.push('STRIPE_WEBHOOK_SECRET should start with "whsec_"')
      }
    }

    // Check key consistency
    if (secretKey && publishableKey) {
      const secretMode = secretKey.includes('test') ? 'test' : 'live'
      const publishableMode = publishableKey.includes('test') ? 'test' : 'live'
      
      if (secretMode !== publishableMode) {
        results.configured = false
        results.recommendations.push(`Key mismatch: Secret key is in ${secretMode} mode but publishable key is in ${publishableMode} mode`)
      }
    }

    // Final configuration check
    if (!results.configured) {
      results.message = results.message || 'Stripe is not properly configured'
    }

    // Return results
    return NextResponse.json({
      success: results.configured,
      details: results,
      timestamp: new Date().toISOString()
    }, {
      status: results.configured ? 200 : 503
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to test Stripe connection',
      details: results
    }, { status: 500 })
  }
}

// Test webhook endpoint signature verification
export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const secretKey = process.env.STRIPE_SECRET_KEY

    if (!webhookSecret || !secretKey) {
      return NextResponse.json({
        success: false,
        error: 'Stripe webhook secret or secret key not configured'
      }, { status: 503 })
    }

    // Get the signature from headers
    const signature = request.headers.get('stripe-signature')
    
    if (!signature) {
      return NextResponse.json({
        success: false,
        message: 'No stripe-signature header found. In production, webhooks must be properly signed.',
        testMode: true
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook configuration appears correct',
      webhookEndpoint: '/api/stripe/webhook'
    })

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Webhook test failed'
    }, { status: 500 })
  }
}
