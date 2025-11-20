/**
 * EnterpriseReadinessChecks
 * Phase 12 Week 9: Validate RLS integrity, permission inheritance, billing compliance
 */

import { getSupabaseServer } from '@/lib/supabase';

// Types
export interface ReadinessReport {
  org_id: string;
  checked_at: string;
  overall_status: 'ready' | 'warning' | 'not_ready';
  score: number;
  checks: ReadinessCheck[];
  recommendations: string[];
}

export interface ReadinessCheck {
  category: string;
  name: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  details?: any;
}

export class EnterpriseReadinessChecks {
  /**
   * Run all readiness checks
   */
  async runAllChecks(orgId: string): Promise<ReadinessReport> {
    const checks: ReadinessCheck[] = [];

    // Run all checks in parallel
    const [
      rlsChecks,
      permissionChecks,
      billingChecks,
      dataIntegrityChecks,
      configurationChecks,
    ] = await Promise.all([
      this.checkRLSIntegrity(orgId),
      this.checkPermissionInheritance(orgId),
      this.checkBillingCompliance(orgId),
      this.checkDataIntegrity(orgId),
      this.checkConfiguration(orgId),
    ]);

    checks.push(...rlsChecks, ...permissionChecks, ...billingChecks, ...dataIntegrityChecks, ...configurationChecks);

    // Calculate score and status
    const passCount = checks.filter((c) => c.status === 'pass').length;
    const warningCount = checks.filter((c) => c.status === 'warning').length;
    const failCount = checks.filter((c) => c.status === 'fail').length;

    const score = Math.round((passCount / checks.length) * 100);

    let overallStatus: 'ready' | 'warning' | 'not_ready' = 'ready';
    if (failCount > 0) {
      overallStatus = 'not_ready';
    } else if (warningCount > 0) {
      overallStatus = 'warning';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(checks);

    return {
      org_id: orgId,
      checked_at: new Date().toISOString(),
      overall_status: overallStatus,
      score,
      checks,
      recommendations,
    };
  }

  /**
   * Check RLS integrity
   */
  private async checkRLSIntegrity(orgId: string): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];
    const supabase = await getSupabaseServer();

    // Check workspace isolation
    const { data: workspaces } = await supabase
      .from('workspaces')
      .select('id')
      .eq('org_id', orgId);

    if (workspaces && workspaces.length > 0) {
      // Verify contacts are properly isolated
      const { count: contactsWithoutWorkspace } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .is('workspace_id', null);

      checks.push({
        category: 'RLS',
        name: 'Workspace isolation',
        status: contactsWithoutWorkspace === 0 ? 'pass' : 'warning',
        message: contactsWithoutWorkspace === 0
          ? 'All contacts have workspace assignments'
          : `${contactsWithoutWorkspace} contacts missing workspace assignment`,
      });
    } else {
      checks.push({
        category: 'RLS',
        name: 'Workspace isolation',
        status: 'warning',
        message: 'No workspaces configured',
      });
    }

    // Check user-organization relationships
    const { count: usersWithOrg } = await supabase
      .from('user_organizations')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    checks.push({
      category: 'RLS',
      name: 'User-organization binding',
      status: usersWithOrg && usersWithOrg > 0 ? 'pass' : 'fail',
      message: usersWithOrg && usersWithOrg > 0
        ? `${usersWithOrg} users bound to organization`
        : 'No users bound to organization',
    });

    // Check for orphaned records
    const { count: orphanedEmails } = await supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .is('org_id', null);

    checks.push({
      category: 'RLS',
      name: 'Orphaned records',
      status: orphanedEmails === 0 ? 'pass' : 'warning',
      message: orphanedEmails === 0
        ? 'No orphaned records detected'
        : `${orphanedEmails} orphaned email records found`,
    });

    return checks;
  }

  /**
   * Check permission inheritance
   */
  private async checkPermissionInheritance(orgId: string): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];
    const supabase = await getSupabaseServer();

    // Check for owner
    const { data: owner } = await supabase
      .from('user_organizations')
      .select('user_id')
      .eq('org_id', orgId)
      .eq('role', 'owner')
      .single();

    checks.push({
      category: 'Permissions',
      name: 'Organization owner',
      status: owner ? 'pass' : 'fail',
      message: owner ? 'Organization has an owner' : 'No organization owner defined',
    });

    // Check role distribution
    const { data: roles } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('org_id', orgId);

    const roleCount: { [key: string]: number } = {};
    (roles || []).forEach((r: any) => {
      roleCount[r.role] = (roleCount[r.role] || 0) + 1;
    });

    const hasAdmins = (roleCount['admin'] || 0) + (roleCount['owner'] || 0) > 0;

    checks.push({
      category: 'Permissions',
      name: 'Admin coverage',
      status: hasAdmins ? 'pass' : 'warning',
      message: hasAdmins
        ? 'Organization has administrative users'
        : 'No administrative users configured',
      details: roleCount,
    });

    // Check team permissions
    const { data: teams } = await supabase
      .from('teams')
      .select('id, name')
      .eq('org_id', orgId);

    if (teams && teams.length > 0) {
      let teamsWithMembers = 0;
      for (const team of teams) {
        const { count } = await supabase
          .from('team_members')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', team.id);

        if (count && count > 0) teamsWithMembers++;
      }

      checks.push({
        category: 'Permissions',
        name: 'Team membership',
        status: teamsWithMembers === teams.length ? 'pass' : 'warning',
        message: `${teamsWithMembers}/${teams.length} teams have members`,
      });
    }

    return checks;
  }

  /**
   * Check billing compliance
   */
  private async checkBillingCompliance(orgId: string): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];
    const supabase = await getSupabaseServer();

    // Check subscription status
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('status, current_period_end')
      .eq('org_id', orgId)
      .single();

    if (subscription) {
      checks.push({
        category: 'Billing',
        name: 'Active subscription',
        status: subscription.status === 'active' ? 'pass' : 'fail',
        message: subscription.status === 'active'
          ? 'Subscription is active'
          : `Subscription status: ${subscription.status}`,
      });

      // Check expiration
      const daysUntilExpiry = Math.ceil(
        (new Date(subscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      checks.push({
        category: 'Billing',
        name: 'Subscription expiry',
        status: daysUntilExpiry > 7 ? 'pass' : daysUntilExpiry > 0 ? 'warning' : 'fail',
        message: daysUntilExpiry > 0
          ? `Subscription expires in ${daysUntilExpiry} days`
          : 'Subscription has expired',
      });
    } else {
      checks.push({
        category: 'Billing',
        name: 'Active subscription',
        status: 'warning',
        message: 'No subscription found - using free tier',
      });
    }

    // Check usage limits
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: usageCount } = await supabase
      .from('usage_events')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    const usageLimit = 10000; // Default limit
    const usagePercentage = ((usageCount || 0) / usageLimit) * 100;

    checks.push({
      category: 'Billing',
      name: 'Usage within limits',
      status: usagePercentage < 80 ? 'pass' : usagePercentage < 100 ? 'warning' : 'fail',
      message: `Current usage: ${usagePercentage.toFixed(1)}% of limit`,
    });

    return checks;
  }

  /**
   * Check data integrity
   */
  private async checkDataIntegrity(orgId: string): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];
    const supabase = await getSupabaseServer();

    // Check contacts have required fields
    const { count: contactsWithEmail } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .not('email', 'is', null);

    const { count: totalContacts } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    const emailPercentage = totalContacts ? ((contactsWithEmail || 0) / totalContacts) * 100 : 100;

    checks.push({
      category: 'Data Integrity',
      name: 'Contact email coverage',
      status: emailPercentage === 100 ? 'pass' : emailPercentage >= 90 ? 'warning' : 'fail',
      message: `${emailPercentage.toFixed(1)}% of contacts have email addresses`,
    });

    // Check campaign integrity
    const { data: campaigns } = await supabase
      .from('drip_campaigns')
      .select('id, name')
      .eq('org_id', orgId);

    if (campaigns && campaigns.length > 0) {
      let campaignsWithSteps = 0;
      for (const campaign of campaigns) {
        const { count } = await supabase
          .from('campaign_steps')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);

        if (count && count > 0) campaignsWithSteps++;
      }

      checks.push({
        category: 'Data Integrity',
        name: 'Campaign configuration',
        status: campaignsWithSteps === campaigns.length ? 'pass' : 'warning',
        message: `${campaignsWithSteps}/${campaigns.length} campaigns have steps configured`,
      });
    }

    return checks;
  }

  /**
   * Check system configuration
   */
  private async checkConfiguration(orgId: string): Promise<ReadinessCheck[]> {
    const checks: ReadinessCheck[] = [];
    const supabase = await getSupabaseServer();

    // Check integrations
    const { data: integrations } = await supabase
      .from('integrations')
      .select('provider, status')
      .eq('org_id', orgId);

    const activeIntegrations = (integrations || []).filter(
      (i: any) => i.status === 'active'
    ).length;

    checks.push({
      category: 'Configuration',
      name: 'Active integrations',
      status: activeIntegrations > 0 ? 'pass' : 'warning',
      message: activeIntegrations > 0
        ? `${activeIntegrations} active integrations configured`
        : 'No integrations configured',
    });

    // Check workspaces
    const { count: workspaceCount } = await supabase
      .from('workspaces')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId);

    checks.push({
      category: 'Configuration',
      name: 'Workspace setup',
      status: workspaceCount && workspaceCount > 0 ? 'pass' : 'fail',
      message: workspaceCount && workspaceCount > 0
        ? `${workspaceCount} workspaces configured`
        : 'No workspaces configured',
    });

    return checks;
  }

  /**
   * Generate recommendations based on check results
   */
  private generateRecommendations(checks: ReadinessCheck[]): string[] {
    const recommendations: string[] = [];

    const failedChecks = checks.filter((c) => c.status === 'fail');
    const warningChecks = checks.filter((c) => c.status === 'warning');

    for (const check of failedChecks) {
      switch (check.name) {
        case 'Organization owner':
          recommendations.push('Assign an organization owner to enable full administrative access');
          break;
        case 'Active subscription':
          recommendations.push('Activate a subscription to access enterprise features');
          break;
        case 'Workspace setup':
          recommendations.push('Create at least one workspace to organize your data');
          break;
        case 'User-organization binding':
          recommendations.push('Add users to the organization to enable team collaboration');
          break;
      }
    }

    for (const check of warningChecks) {
      switch (check.name) {
        case 'Usage within limits':
          recommendations.push('Consider upgrading your plan to avoid usage overages');
          break;
        case 'Active integrations':
          recommendations.push('Connect integrations like Gmail to enable email automation');
          break;
        case 'Subscription expiry':
          recommendations.push('Renew your subscription before it expires');
          break;
      }
    }

    return recommendations;
  }
}

// Export singleton
export const enterpriseReadinessChecks = new EnterpriseReadinessChecks();
