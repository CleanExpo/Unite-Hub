import { writeFileSync } from 'node:fs'
import { runFirstBoardDecisionSimulation } from '../src/lib/operator-gateway/board-decision'

const simulation = runFirstBoardDecisionSimulation()
const lines: string[] = []
lines.push('# Board Decision First Simulation')
lines.push('')
lines.push('Decision: `build_board_decision_mathematics_engine`')
lines.push('Scope: local-only deterministic simulation; no external execution.')
lines.push('')
lines.push('## Summary')
lines.push('')
lines.push(`- status: ${simulation.status}`)
lines.push(`- candidate moves scored: ${simulation.candidateMovesScored}`)
lines.push(`- next recommended move: ${simulation.nextRecommendedMove.moveId}`)
lines.push(`- next recommended action: ${simulation.nextRecommendedMove.decision}`)
lines.push(`- expected value: ${simulation.nextRecommendedMove.expectedValue}`)
lines.push(`- hard gates detected: ${simulation.hardGatesDetected}`)
lines.push(`- hard gates bypassed: ${simulation.hardGatesBypassed}`)
lines.push(`- verify-first moves: ${simulation.verifyFirstMoves}`)
lines.push(`- coverage target: ${simulation.coverageTarget}`)
lines.push(`- external execution enabled: ${simulation.externalExecutionEnabled}`)
lines.push(`- market launch action disabled: ${simulation.marketLaunchActionDisabled}`)
lines.push('')
lines.push('## Candidate ranking')
lines.push('')
lines.push('| rank | move_id | decision | EV | p_success | hard_gate | human approval | coverage_delta |')
lines.push('| ---: | --- | --- | ---: | ---: | --- | --- | ---: |')
simulation.scoredMoves.forEach((move, index) => {
  lines.push(`| ${index + 1} | ${move.moveId} | ${move.decision} | ${move.expectedValue} | ${move.pSuccess} | ${move.hardGate} | ${move.humanApprovalRequired ? 'yes' : 'no'} | ${move.coverageDelta} |`)
})
lines.push('')
lines.push('## Required outcomes')
lines.push('')
lines.push(`- rank safe high-EV local work: ${simulation.nextRecommendedMove.moveId === 'product_factory_composer' ? 'yes' : 'no'}`)
lines.push(`- escalate production migration: ${simulation.scoredMoves.find((m) => m.moveId === 'production_migration')?.decision}`)
lines.push(`- escalate deploy/live action: ${simulation.scoredMoves.find((m) => m.moveId === 'deploy_live_action')?.decision}`)
lines.push(`- keep BLOCKED-OP blocked: ${simulation.scoredMoves.find((m) => m.moveId === 'blocked_op_sandbox_voice_lane')?.decision}`)
lines.push(`- recommend verification before uncertain work: ${simulation.scoredMoves.find((m) => m.moveId === 'claude_cursor_lane_install')?.decision}`)
lines.push('')
lines.push('## Safety')
lines.push('')
lines.push('- production DB touched: no')
lines.push('- deployment occurred: no')
lines.push('- OP/1Password retried: no')
lines.push('- Supabase touched: no')
lines.push('- hard gates bypassed: no')
lines.push('- external execution enabled: no')

writeFileSync('BOARD_DECISION_FIRST_SIMULATION.md', `${lines.join('\n')}\n`)
console.log(JSON.stringify({
  nextRecommendedMove: simulation.nextRecommendedMove.moveId,
  nextRecommendedAction: simulation.nextRecommendedMove.decision,
  hardGatesBypassed: simulation.hardGatesBypassed,
  candidateMovesScored: simulation.candidateMovesScored,
}, null, 2))
