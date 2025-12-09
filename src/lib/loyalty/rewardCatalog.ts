/**
 * Reward Catalog Engine
 * Manages founder-controlled reward catalog and user redemption requests
 * Part of v1_1_05: Loyalty & Referral Pivot Engine
 */

export interface Reward {
  id: string;
  name: string;
  description: string;
  category: string;
  creditCost: bigint;
  isActive: boolean;
  dailyLimit?: bigint;
  dailyRedeemed: bigint;
  totalRedeemed: bigint;
  metadata: Record<string, any>;
}

export interface RedemptionRequest {
  id: string;
  userId: string;
  rewardId: string;
  creditAmount: bigint;
  status: string; // 'pending', 'approved', 'redeemed', 'rejected', 'cancelled'
  founderNotes?: string;
  transparencyMessage?: string;
  createdAt: string;
  processedAt?: string;
}

/**
 * Get available rewards for a workspace
 */
export async function getAvailableRewards(
  supabaseAdmin: any,
  workspaceId: string,
  userCredits?: bigint
): Promise<Reward[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'get_available_rewards',
      {
        p_workspace_id: workspaceId,
        p_user_credits: userCredits ? Number(userCredits) : null,
      }
    );

    if (error) {
      console.error('[rewardCatalog] Get rewards failed:', error);
      return [];
    }

    return (data || []).map((reward: any) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      category: reward.category,
      creditCost: BigInt(reward.credit_cost),
      isActive: true,
      dailyLimit: reward.daily_limit ? BigInt(reward.daily_limit) : undefined,
      dailyRedeemed: BigInt(reward.daily_remaining),
      totalRedeemed: 0n,
      metadata: reward.metadata || {},
    }));
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return [];
  }
}

/**
 * Get all rewards for a workspace (founder only)
 */
export async function getAllRewards(
  supabaseAdmin: any,
  workspaceId: string
): Promise<Reward[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reward_catalog')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[rewardCatalog] Get all rewards failed:', error);
      return [];
    }

    return (data || []).map((reward: any) => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      category: reward.category,
      creditCost: BigInt(reward.credit_cost),
      isActive: reward.is_active,
      dailyLimit: reward.daily_redemption_limit
        ? BigInt(reward.daily_redemption_limit)
        : undefined,
      dailyRedeemed: BigInt(reward.daily_redeemed_count),
      totalRedeemed: BigInt(reward.total_redeemed_count),
      metadata: reward.metadata || {},
    }));
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return [];
  }
}

/**
 * Create a new reward (founder only)
 */
export async function createReward(
  supabaseAdmin: any,
  workspaceId: string,
  reward: {
    name: string;
    description: string;
    category: string;
    creditCost: bigint;
    dailyLimit?: bigint;
    metadata?: Record<string, any>;
  }
): Promise<{ success: boolean; rewardId?: string; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reward_catalog')
      .insert({
        workspace_id: workspaceId,
        name: reward.name,
        description: reward.description,
        category: reward.category,
        credit_cost: Number(reward.creditCost),
        daily_redemption_limit: reward.dailyLimit ? Number(reward.dailyLimit) : null,
        metadata: reward.metadata || {},
      })
      .select('id')
      .single();

    if (error) {
      console.error('[rewardCatalog] Create reward failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      rewardId: data.id,
      message: `Reward "${reward.name}" created successfully`,
    };
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a reward (founder only)
 */
export async function updateReward(
  supabaseAdmin: any,
  workspaceId: string,
  rewardId: string,
  updates: Partial<{
    name: string;
    description: string;
    isActive: boolean;
    creditCost: bigint;
    dailyLimit?: bigint;
    metadata: Record<string, any>;
  }>
): Promise<{ success: boolean; message?: string }> {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name) {
updateData.name = updates.name;
}
    if (updates.description) {
updateData.description = updates.description;
}
    if (updates.isActive !== undefined) {
updateData.is_active = updates.isActive;
}
    if (updates.creditCost) {
updateData.credit_cost = Number(updates.creditCost);
}
    if (updates.dailyLimit !== undefined) {
      updateData.daily_redemption_limit = updates.dailyLimit
        ? Number(updates.dailyLimit)
        : null;
    }
    if (updates.metadata) {
updateData.metadata = updates.metadata;
}

    const { error } = await supabaseAdmin
      .from('reward_catalog')
      .update(updateData)
      .eq('workspace_id', workspaceId)
      .eq('id', rewardId);

    if (error) {
      console.error('[rewardCatalog] Update reward failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: true,
      message: 'Reward updated successfully',
    };
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit a redemption request
 */
export async function submitRedemptionRequest(
  supabaseAdmin: any,
  workspaceId: string,
  userId: string,
  rewardId: string
): Promise<{
  success: boolean;
  requestId?: string;
  status?: string;
  message?: string;
}> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'submit_redemption_request',
      {
        p_workspace_id: workspaceId,
        p_user_id: userId,
        p_reward_id: rewardId,
      }
    );

    if (error) {
      console.error('[rewardCatalog] Submit request failed:', error);
      return {
        success: false,
        message: data?.message || error.message,
      };
    }

    return {
      success: data.success,
      requestId: data.request_id,
      status: data.status,
      message: data.message,
    };
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get user's redemption requests
 */
export async function getUserRedemptionRequests(
  supabaseAdmin: any,
  workspaceId: string,
  userId: string,
  status?: string
): Promise<RedemptionRequest[]> {
  try {
    let query = supabaseAdmin
      .from('reward_redemption_requests')
      .select(
        `*,
        reward_catalog (name, description, category, credit_cost)`
      )
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('[rewardCatalog] Get requests failed:', error);
      return [];
    }

    return (data || []).map((request: any) => ({
      id: request.id,
      userId: request.user_id,
      rewardId: request.reward_id,
      creditAmount: BigInt(request.credit_amount_requested),
      status: request.status,
      founderNotes: request.founder_notes,
      transparencyMessage: request.transparency_message,
      createdAt: request.created_at,
      processedAt: request.founder_action_at,
    }));
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return [];
  }
}

/**
 * Get all pending redemption requests for a workspace (founder only)
 */
export async function getPendingRedemptionRequests(
  supabaseAdmin: any,
  workspaceId: string
): Promise<RedemptionRequest[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reward_redemption_requests')
      .select(
        `*,
        reward_catalog (name, description, category, credit_cost),
        user_profiles (full_name, email)`
      )
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[rewardCatalog] Get pending requests failed:', error);
      return [];
    }

    return (data || []).map((request: any) => ({
      id: request.id,
      userId: request.user_id,
      rewardId: request.reward_id,
      creditAmount: BigInt(request.credit_amount_requested),
      status: request.status,
      founderNotes: request.founder_notes,
      transparencyMessage: request.transparency_message,
      createdAt: request.created_at,
    }));
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return [];
  }
}

/**
 * Approve or reject a redemption request (founder only)
 */
export async function handleRedemptionRequest(
  supabaseAdmin: any,
  workspaceId: string,
  requestId: string,
  approved: boolean,
  founderNotes?: string,
  transparencyMessage?: string
): Promise<{ success: boolean; status?: string; message?: string }> {
  try {
    const { data, error } = await supabaseAdmin.rpc(
      'handle_redemption_request',
      {
        p_request_id: requestId,
        p_workspace_id: workspaceId,
        p_approved: approved,
        p_founder_notes: founderNotes || null,
        p_transparency_message: transparencyMessage || null,
      }
    );

    if (error) {
      console.error('[rewardCatalog] Handle request failed:', error);
      return {
        success: false,
        message: error.message,
      };
    }

    return {
      success: data.success,
      status: data.status,
      message: data.message,
    };
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get reward redemption stats for a workspace (founder only)
 */
export async function getRedemptionStats(
  supabaseAdmin: any,
  workspaceId: string
): Promise<{
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalCreditsRedeemed: bigint;
  topRewards: Array<{ name: string; redeemed: number }>;
}> {
  try {
    const { data: requests, error } = await supabaseAdmin
      .from('reward_redemption_requests')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('[rewardCatalog] Get stats failed:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        totalCreditsRedeemed: 0n,
        topRewards: [],
      };
    }

    const allRequests = requests || [];
    const pending = allRequests.filter((r: any) => r.status === 'pending').length;
    const approved = allRequests.filter((r: any) => r.status === 'approved').length;
    const rejected = allRequests.filter((r: any) => r.status === 'rejected').length;
    const totalCredits = allRequests
      .filter((r: any) => r.status === 'redeemed')
      .reduce((sum: bigint, r: any) => sum + BigInt(r.credit_amount_requested), 0n);

    // Get top rewards
    const { data: rewardStats, error: rewardError } = await supabaseAdmin
      .from('reward_catalog')
      .select('name, total_redeemed_count')
      .eq('workspace_id', workspaceId)
      .order('total_redeemed_count', { ascending: false })
      .limit(10);

    const topRewards = (rewardStats || []).map((r: any) => ({
      name: r.name,
      redeemed: r.total_redeemed_count,
    }));

    return {
      totalRequests: allRequests.length,
      pendingRequests: pending,
      approvedRequests: approved,
      rejectedRequests: rejected,
      totalCreditsRedeemed: totalCredits,
      topRewards,
    };
  } catch (error) {
    console.error('[rewardCatalog] Unexpected error:', error);
    return {
      totalRequests: 0,
      pendingRequests: 0,
      approvedRequests: 0,
      rejectedRequests: 0,
      totalCreditsRedeemed: 0n,
      topRewards: [],
    };
  }
}
