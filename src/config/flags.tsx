import React from 'react'

export interface FeatureFlag {
  name: string
  description: string
  enabled: boolean
  rolloutPercentage?: number
  enabledForUsers?: string[]
}

class FeatureFlagManager {
  private flags: Map<string, FeatureFlag>

  constructor() {
    this.flags = new Map()
    this.initializeFlags()
  }

  private initializeFlags() {
    this.register({
      name: 'new_ui',
      description: 'New UI design system',
      enabled: process.env.NEXT_PUBLIC_FEATURE_NEW_UI === 'true',
    })

    this.register({
      name: 'beta_features',
      description: 'Beta features for early adopters',
      enabled: process.env.NEXT_PUBLIC_FEATURE_BETA_FEATURES === 'true',
    })

    this.register({
      name: 'analytics',
      description: 'Analytics tracking',
      enabled: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true',
    })

    this.register({
      name: 'aiOrchestrator',
      description: 'AI Orchestrator service integration',
      enabled: process.env.NEXT_PUBLIC_FEATURE_AI_ORCHESTRATOR === 'true',
    })
  }

  register(flag: FeatureFlag) {
    this.flags.set(flag.name, flag)
  }

  isEnabled(flagName: string, userId?: string): boolean {
    const flag = this.flags.get(flagName)
    
    if (!flag) {
      console.warn(`Feature flag "${flagName}" not found`)
      return false
    }

    if (!flag.enabled) {
      return false
    }

    if (userId && flag.enabledForUsers) {
      return flag.enabledForUsers.includes(userId)
    }

    if (flag.rolloutPercentage !== undefined) {
      const hash = this.hashString(userId || 'anonymous')
      const percentage = (hash % 100) + 1
      return percentage <= flag.rolloutPercentage
    }

    return true
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash)
  }

  enable(flagName: string) {
    const flag = this.flags.get(flagName)
    if (flag) {
      flag.enabled = true
    }
  }

  disable(flagName: string) {
    const flag = this.flags.get(flagName)
    if (flag) {
      flag.enabled = false
    }
  }

  setRolloutPercentage(flagName: string, percentage: number) {
    const flag = this.flags.get(flagName)
    if (flag) {
      flag.rolloutPercentage = Math.min(100, Math.max(0, percentage))
    }
  }

  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  withFlag<T>(
    flagName: string,
    enabledCallback: () => T,
    disabledCallback: () => T,
    userId?: string
  ): T {
    return this.isEnabled(flagName, userId)
      ? enabledCallback()
      : disabledCallback()
  }
}

export const featureFlags = new FeatureFlagManager()

export function useFeatureFlag(flagName: string, userId?: string): boolean {
  return featureFlags.isEnabled(flagName, userId)
}

export function FeatureFlag({
  flag,
  userId,
  children,
  fallback = null,
}: {
  flag: string
  userId?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const isEnabled = useFeatureFlag(flag, userId)
  return <>{isEnabled ? children : fallback}</>
}