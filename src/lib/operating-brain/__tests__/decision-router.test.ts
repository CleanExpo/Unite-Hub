import {
  buildMargotDecisionBrief,
  classifyMargotAction,
  type MargotDecisionInput,
} from '../decision-router'

describe('classifyMargotAction', () => {
  it('auto-executes safe local docs and memory updates', () => {
    const result = classifyMargotAction({
      source: 'second_brain',
      intent: 'Update Operating Brain docs',
      summary: 'Record a no-secret repo doc update',
      isDocsOnly: true,
    })

    expect(result.actionClass).toBe('auto_execute')
    expect(result.requiresBoardApproval).toBe(false)
    expect(result.allowedOutputs).toContain('2nd Brain update')
  })

  it('delegates verified code changes with scoped execution', () => {
    const result = classifyMargotAction({
      source: 'github',
      intent: 'Add Margot routing tests',
      summary: 'Local code and tests only',
      requiresCodeChange: true,
      hasVerificationPath: true,
    })

    expect(result.actionClass).toBe('delegate')
    expect(result.requiresBoardApproval).toBe(false)
    expect(result.allowedOutputs).toContain('Scoped agent task')
  })

  it('asks the Board before Vercel env or deploy side effects', () => {
    const result = classifyMargotAction({
      source: 'vercel',
      intent: 'Fix sandbox environment',
      summary: 'Mutate Vercel env vars and redeploy',
      environmentMutation: true,
      deploymentAction: true,
    })

    expect(result.actionClass).toBe('ask_board')
    expect(result.requiresBoardApproval).toBe(true)
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        'Environment variable changes require approval and secret handling.',
        'Deployments require approval because they can change the live operating surface.',
      ]),
    )
  })

  it('blocks unresolved identity instead of guessing CRM records', () => {
    const result = classifyMargotAction({
      source: 'voice',
      intent: 'Merge this client',
      summary: 'The target client is unclear',
      identityUnresolved: true,
    })

    expect(result.actionClass).toBe('block')
    expect(result.allowedOutputs).toContain('Identity resolution task')
  })

  it('never allows secret exposure even when the source is trusted', () => {
    const input: MargotDecisionInput = {
      source: 'pi_dev_ops',
      intent: 'Print production keys',
      summary: 'Expose secret values for debugging',
      secretExposure: true,
    }

    const result = classifyMargotAction(input)
    const brief = buildMargotDecisionBrief(input, result)

    expect(result.actionClass).toBe('never_do')
    expect(result.requiresBoardApproval).toBe(false)
    expect(brief.plannedChanges).toContain('Refuse unsafe action')
  })
})
