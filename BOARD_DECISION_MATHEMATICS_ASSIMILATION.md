# Board Decision Mathematics Assimilation

Reviewer: Phill McGurk
Reviewer role: Founder / Board / Unite-Group Nexus product owner
Decision: `build_board_decision_mathematics_engine`
Date: 2026-06-07

## Purpose

Build a deterministic local decision layer for Unite-Group Nexus Mission Control so the Senior PM and Board can select the next move by expected value, verification/retry math, confidence calibration, and measured project coverage while preserving hard human gates for irreversible actions.

The engine is not a smarter model and does not create raw capability. It turns unreliable steps into verified-correct local work by requiring evidence, bounded retry, independent review, and hard-gate escalation.

## Equation 1 — compounding law

`success = p^n`

Operational meaning: long autonomous chains fail because each step compounds failure probability. A 15-step chain at 90% per step succeeds only about 20.6% end-to-end.

Senior PM mapping: avoid large unattended work packets. Decompose into independently verified steps.

Board mapping: do not approve "just let it run everything" as the default operating model.

False-autonomy prevention: the system exposes why unverified long runs collapse instead of claiming the whole project is done.

## Equation 2 — verification + retry

`effective_p = 1 - (1 - p)^attempts`

Operational meaning: if a true verifier catches failure, bounded retries raise effective per-step reliability. A 90% step with 3 attempts becomes 99.9% effective.

Senior PM mapping: every local action should have an executable check before it is marked complete.

Board mapping: approve work that includes probes/tests/evidence; reject work that only has model confidence.

False-autonomy prevention: the system can only retry failures it can detect.

## Equation 3 — independent reviewer catch rate

`combined_catch = 1 - (1 - c1)(1 - c2)`

Operational meaning: independent checks stack. Two 80% catch-rate verifiers produce 96% combined catch.

Senior PM mapping: pair tests/static checks with clean-context review where possible.

Board mapping: require independent verification for high-value or ambiguous work.

False-autonomy prevention: avoids self-review loops where the same agent validates its own assumption.

## Equation 4 — expected value

`EV = P(success) * Value - P(failure) * Cost`

Operational meaning: among reversible moves, pick the highest positive expected value toward the finish line.

Senior PM mapping: rank safe local backlog candidates by EV and coverage impact.

Board mapping: make sequencing transparent instead of relying on vibes.

False-autonomy prevention: negative-EV moves are rejected or replanned.

## Equation 5 — hard gates override EV

Irreversible/high-blast-radius moves escalate regardless of EV.

Operational meaning: deploy, production DB, payment, publish, email, claims/orders, secrets, OP/1Password, blocked lanes, browser/Computer Use, and external execution cannot be authorized by EV.

Senior PM mapping: local work can continue; irreversible moves become Board gates.

Board mapping: the Board remains the go/no-go authority for irreversible actions.

False-autonomy prevention: the engine cannot mathematically rationalize deploys, charges, or production mutation.

## Equation 6 — calibration

`Brier = mean((p_predicted - outcome)^2)`

Operational meaning: confidence must be measured against outcomes. Uncalibrated confidence should trigger verification/research rather than action.

Senior PM mapping: log predicted success and actual outcomes; adjust thresholds over time.

Board mapping: review calibration drift before expanding autonomy.

False-autonomy prevention: false positives become measurable instead of hidden.

## Equation 7 — completeness metric

`C = verified_requirements / total_requirements`

Operational meaning: progress means executable probes have passed. The target is 0.98 verified coverage, with UNKNOWN excluded from numerator.

Senior PM mapping: choose moves that increase verified coverage and close DoD gaps.

Board mapping: define the finish line through verifiable requirements, not subjective status.

False-autonomy prevention: "done" requires proof.

## What math can do

- sequence reversible local work by expected value
- require verification before action when confidence is medium
- reject negative-EV work
- escalate irreversible work
- make false positives measurable through calibration
- drive coverage toward 0.98 verified completeness

## What math cannot do

- create capability the model does not have
- replace executable probes
- approve irreversible real-world actions
- turn unverified model confidence into truth
- override Board/operator safety policy

## Anti-circle rule

If the system cannot verify a move, it must not claim the move is done. It must either create a verifier, research, or escalate.
