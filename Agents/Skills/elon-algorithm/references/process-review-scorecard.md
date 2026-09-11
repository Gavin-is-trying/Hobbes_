# Process Review Scorecard

Score each item `0`, `1`, or `2`:

- `0` — absent or contradicted
- `1` — partial, assumed, or weakly evidenced
- `2` — explicit and defensible

## Gates

| Category | Review question | Score |
|---|---|---:|
| Outcome | Are the customer, outcome, trigger, terminal state, and owner explicit? |  |
| Requirements | Does every retained requirement have a named accountable role, source, rationale, and smallest valid form? |  |
| Deletion | Is there evidence that deletion was attempted before optimization? |  |
| Safety | Are sensitive obligations retained or marked for expert verification rather than silently removed? |  |
| Simplicity | Are roles, handoffs, tools, fields, approvals, and variants minimized? |  |
| Flow | Are touch time, wait time, rework, and bottlenecks addressed? |  |
| Automation | Is automation limited to necessary, stable, simplified work with fallback and monitoring? |  |
| Execution | Are actions imperative, decisions explicit, and failure modes actionable? |  |
| Measurement | Do metrics have definitions, owners, baselines or clearly labeled estimates, targets, and review cadence? |  |
| History | Does the decision log preserve deletions, retentions, restorations, and rationale? |  |

## Interpretation

- **18–20:** Ready for controlled implementation.
- **14–17:** Draft is usable but address weak gates before scaling or automating.
- **10–13:** Re-run requirement challenge and deletion.
- **0–9:** The process has been documented prematurely; return to current-state discovery.

## Hard Stops

Regardless of score, do not call the process ready if:

- Optimization or automation occurred before requirement challenge and deletion.
- A retained requirement has no accountable owner.
- A potentially binding or safety-critical obligation was removed without verification.
- Success cannot be measured.
- Failure handling is absent for a consequential process.
