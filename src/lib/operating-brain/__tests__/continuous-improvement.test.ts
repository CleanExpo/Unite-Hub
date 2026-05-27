import {
  chooseNextOnePercentImprovement,
  type OperatingBrainHealthSnapshot,
} from '../continuous-improvement'

function healthySnapshot(overrides: Partial<OperatingBrainHealthSnapshot> = {}): OperatingBrainHealthSnapshot {
  return {
    deployState: 'READY',
    sandboxEnvReady: true,
    localGates: {
      lint: 'pass',
      typeCheck: 'pass',
      test: 'pass',
    },
    staleTaskCount: 0,
    integrationHealth: 'pass',
    secondBrainSyncReady: true,
    roadmapItems: [],
    ...overrides,
  }
}

describe('chooseNextOnePercentImprovement', () => {
  it('prioritizes deploy stability before feature work', () => {
    const result = chooseNextOnePercentImprovement(
      healthySnapshot({
        deployState: 'ERROR',
      }),
    )

    expect(result.priority).toBe('P0')
    expect(result.owner).toBe('Pi-Dev-Ops')
    expect(result.actionClass).toBe('ask_board')
    expect(result.requiresApproval).toBe(true)
  })

  it('repairs failing local gates after deploy is ready', () => {
    const result = chooseNextOnePercentImprovement(
      healthySnapshot({
        localGates: {
          lint: 'pass',
          typeCheck: 'fail',
          test: 'pass',
        },
      }),
    )

    expect(result.priority).toBe('P0')
    expect(result.actionClass).toBe('delegate')
    expect(result.nextAction).toContain('typeCheck')
    expect(result.evidenceRequired).toContain('pnpm run type-check')
  })

  it('requires Operating Brain context on active roadmap items', () => {
    const result = chooseNextOnePercentImprovement(
      healthySnapshot({
        roadmapItems: [
          {
            id: 'UNI-2056',
            title: 'CRM command center',
            priority: 'P1',
            status: 'in_progress',
            hasOwner: true,
            hasNextAction: false,
            hasEvidence: true,
          },
        ],
      }),
    )

    expect(result.priority).toBe('P1')
    expect(result.owner).toBe('Senior PM')
    expect(result.nextAction).toContain('UNI-2056')
    expect(result.evidenceRequired).toContain('Operating Brain context')
  })

  it('repairs the 2nd Brain sync path before routine ticks', () => {
    const result = chooseNextOnePercentImprovement(
      healthySnapshot({
        secondBrainSyncReady: false,
      }),
    )

    expect(result.priority).toBe('P1')
    expect(result.owner).toBe('Margot')
    expect(result.actionClass).toBe('auto_execute')
  })

  it('falls back to the routine Hermes evidence tick when gates are healthy', () => {
    const result = chooseNextOnePercentImprovement(healthySnapshot())

    expect(result.priority).toBe('P3')
    expect(result.owner).toBe('Hermes')
    expect(result.evidenceRequired).toEqual([
      'Decision',
      'Evidence',
      'Tests',
      'Files touched',
      'Remaining risk',
      'Next 1%',
    ])
  })
})
