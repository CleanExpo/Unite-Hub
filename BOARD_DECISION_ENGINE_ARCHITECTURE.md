# Board Decision Engine Architecture

Reviewer: Phill McGurk
Decision: `build_board_decision_mathematics_engine`

## Scope

A local deterministic Board Decision Engine inside Unite-Group Nexus Mission Control. It scores candidate moves and returns a safe decision state. It does not call external services, execute jobs, deploy, mutate production, or use LLM judgement as the sole gate.

## Move candidate model

Required fields:

- `moveId`
- `objective`
- `projectId`
- `pSuccess`
- `valueScore`
- `failureCost`
- `reversibility`
- `hardGate`
- `verificationAvailable`
- `retryCount`
- `calibratedConfidence`
- `coverageDelta`
- `evidenceRequired`

Implementation: `src/lib/operator-gateway/board-decision.ts` exports `BoardMoveCandidate`.

## Probability model

The engine clamps probabilities to `[0, 1]`, calculates chain reliability with `p^n`, calculates retry-adjusted reliability with `1 - (1 - p)^attempts`, and tracks `calibratedConfidence` separately from raw `pSuccess`.

## Value/cost model

Expected value:

`EV = pSuccess * valueScore - (1 - pSuccess) * failureCost`

Positive EV is required for autonomous reversible action. Negative EV returns `reject_negative_ev`.

## Hard-gate model

`HardGateClassification` includes:

- `none`
- `deploy`
- `payment`
- `email`
- `publish`
- `production_db`
- `delete`
- `claims_orders`
- `blocked_op`
- `external_execution`
- `secrets`
- `browser_or_computer_use`

Any non-`none` hard gate or irreversible move returns `blocked_by_hard_gate`, sets `humanApprovalRequired=true`, and keeps `hardGateBypassed=false`.

## Verification/retry model

`VerificationPlan` records whether verification is required, retry count, retry-adjusted probability, independent catch rate, evidence required, and notes.

Medium confidence reversible moves return `verify_first`.

## Independent-review model

`combinedCatchRate([c1, c2, ...])` implements independent reviewer math. The initial deterministic status uses tests + independent review as the reference pair.

## Calibration model

`CalibrationRecord` stores `{ predicted, outcome }` and `brierScore(records)` calculates calibration quality. Low calibrated confidence returns `needs_calibration` before action.

## Coverage objective model

`calculateCoverageRelation` tracks verified requirements, total requirements, target coverage, whether the 0.98 target is met, and remaining unverified requirements.

## Output decision states

- `act_now`: positive EV, high calibrated success, reversible, verifier available
- `verify_first`: positive EV, medium confidence, reversible, verifier available
- `escalate_to_board`: no verifier or authority needed
- `blocked_by_hard_gate`: irreversible/high-blast move; human approval required
- `reject_negative_ev`: EV <= 0
- `needs_research`: low probability but verifiable
- `needs_calibration`: confidence below calibrated threshold

## Mission Control surface

The founder-only Command Centre operator gateway now exposes `boardDecisionPanel.engine` with:

- next candidate move
- EV score
- `p_success`
- verification requirement
- hard gate status
- recommended action
- coverage impact
- calibration status
- human approval requirement
- hard gates detected/bypassed
- market launch disabled

## Safety invariants

- no external execution
- no live runner
- no production DB
- no deployment
- no secrets/OP/1Password
- no browser automation or Computer Use
- EV cannot authorize irreversible actions
