// Unite Group + CARSI SSO Authentication Bridge

import { createClient } from '@/lib/supabase/server';
import { UnifiedCustomer } from '@/lib/types/crm-integration';
import { cookies } from 'next/headers';

export interface SSOToken {
  uniteToken: string;
  carsiToken?: string;
  expiresAt: Date;
  customerId: string;
}

export interface SSOSession {
  user: {
    id: string;
    email: string;
    customerId: string;
  };
  uniteAccess: boolean;
  carsiAccess: boolean;
  permissions: string[];
}

// SSO Configuration
const SSO_CONFIG = {
  tokenExpiry: 24 * 60 * 60 * 1000, // 24 hours
  refreshThreshold: 60 * 60 * 1000, // 1 hour before expiry
  carsiApiUrl: process.env.CARSI_API_URL || 'https://api.carsi.au',
  carsiApiKey: process.env.CARSI_API_KEY,
};

/**
 * Create a unified SSO session for both platforms
 */
export async function createSSOSession(email: string, password: string): Promise<SSOSession | null> {
  try {
    const supabase = await createClient();
    
    // Authenticate with Unite Group (Supabase)
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Unite auth failed:', authError);
      return null;
    }

    // Get customer data
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    const customerId = customer?.id || `UG-${authData.user.id.substring(0, 8)}`;

    // Attempt CARSI authentication (if customer has CARSI account)
    let carsiToken: string | undefined = undefined;
    let carsiAccess = false;
    
    if (SSO_CONFIG.carsiApiKey) {
      try {
        const carsiResponse = await fetch(`${SSO_CONFIG.carsiApiUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': SSO_CONFIG.carsiApiKey,
          },
          body: JSON.stringify({ email, password }),
        });

        if (carsiResponse.ok) {
          const carsiData = await carsiResponse.json();
          carsiToken = carsiData.token;
          carsiAccess = true;
        }
      } catch (carsiError) {
        console.warn('CARSI auth failed, continuing with Unite-only access:', carsiError);
      }
    }

    // Create SSO token
    const ssoToken: SSOToken = {
      uniteToken: authData.session.access_token,
      carsiToken,
      expiresAt: new Date(Date.now() + SSO_CONFIG.tokenExpiry),
      customerId,
    };

    // Store SSO token in secure cookie
    const cookieStore = await cookies();
    cookieStore.set('sso_token', JSON.stringify(ssoToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SSO_CONFIG.tokenExpiry / 1000,
    });

    // Create session object
    const session: SSOSession = {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        customerId,
      },
      uniteAccess: true,
      carsiAccess,
      permissions: customer?.permissions || ['basic'],
    };

    return session;
  } catch (error) {
    console.error('SSO session creation failed:', error);
    return null;
  }
}

/**
 * Validate and refresh SSO token if needed
 */
export async function validateSSOToken(): Promise<SSOSession | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('sso_token');
    
    if (!tokenCookie) {
      return null;
    }

    const ssoToken: SSOToken = JSON.parse(tokenCookie.value);
    
    // Check if token is expired
    if (new Date(ssoToken.expiresAt) < new Date()) {
      return null;
    }

    // Check if token needs refresh
    const timeUntilExpiry = new Date(ssoToken.expiresAt).getTime() - Date.now();
    if (timeUntilExpiry < SSO_CONFIG.refreshThreshold) {
      // Refresh tokens
      await refreshSSOTokens(ssoToken);
    }

    // Get current user from Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    // Return valid session
    return {
      user: {
        id: user.id,
        email: user.email!,
        customerId: ssoToken.customerId,
      },
      uniteAccess: true,
      carsiAccess: !!ssoToken.carsiToken,
      permissions: ['basic'], // Would fetch from database
    };
  } catch (error) {
    console.error('SSO token validation failed:', error);
    return null;
  }
}

/**
 * Refresh SSO tokens for both platforms
 */
async function refreshSSOTokens(ssoToken: SSOToken): Promise<void> {
  try {
    const supabase = await createClient();
    
    // Refresh Unite token
    const { data: refreshData, error } = await supabase.auth.refreshSession();
    
    if (error || !refreshData.session) {
      throw new Error('Failed to refresh Unite token');
    }

    // Update token
    ssoToken.uniteToken = refreshData.session.access_token;
    ssoToken.expiresAt = new Date(Date.now() + SSO_CONFIG.tokenExpiry);

    // Refresh CARSI token if available
    if (ssoToken.carsiToken && SSO_CONFIG.carsiApiKey) {
      try {
        const carsiResponse = await fetch(`${SSO_CONFIG.carsiApiUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${ssoToken.carsiToken}`,
            'X-API-Key': SSO_CONFIG.carsiApiKey,
          },
        });

        if (carsiResponse.ok) {
          const carsiData = await carsiResponse.json();
          ssoToken.carsiToken = carsiData.token;
        }
      } catch (carsiError) {
        console.warn('CARSI token refresh failed:', carsiError);
      }
    }

    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set('sso_token', JSON.stringify(ssoToken), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SSO_CONFIG.tokenExpiry / 1000,
    });
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}

/**
 * Logout from both platforms
 */
export async function logoutSSO(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('sso_token');
    
    if (tokenCookie) {
      const ssoToken: SSOToken = JSON.parse(tokenCookie.value);
      
      // Logout from CARSI if token exists
      if (ssoToken.carsiToken && SSO_CONFIG.carsiApiKey) {
        try {
          await fetch(`${SSO_CONFIG.carsiApiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${ssoToken.carsiToken}`,
              'X-API-Key': SSO_CONFIG.carsiApiKey,
            },
          });
        } catch (carsiError) {
          console.warn('CARSI logout failed:', carsiError);
        }
      }
    }

    // Logout from Unite (Supabase)
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Clear SSO cookie
    cookieStore.delete('sso_token');
  } catch (error) {
    console.error('SSO logout failed:', error);
  }
}

/**
 * Get CARSI access token for API calls
 */
export async function getCARSIToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('sso_token');
    
    if (!tokenCookie) {
      return null;
    }

    const ssoToken: SSOToken = JSON.parse(tokenCookie.value);
    return ssoToken.carsiToken || null;
  } catch (error) {
    console.error('Failed to get CARSI token:', error);
    return null;
  }
}

/**
 * Check if user has access to a specific platform
 */
export async function checkPlatformAccess(platform: 'unite' | 'carsi'): Promise<boolean> {
  const session = await validateSSOToken();
  
  if (!session) {
    return false;
  }

  return platform === 'unite' ? session.uniteAccess : session.carsiAccess;
}
