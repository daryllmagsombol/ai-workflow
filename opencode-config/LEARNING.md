# AI Coding Workflow — Learning Log

> `AGENTS.md` contains active behavior rules. This file records lessons, reasoning, and experiments.
> Keep it compact and do not duplicate the global contract.

## Purpose

Capture recurring lessons, useful patterns, failure modes, and reasons for workflow changes.

Promote a lesson into `AGENTS.md` only when it is broadly reusable, repeatedly validated, actionable, and worth its global context cost.

## Workflow Model

```text
Understand → Inspect → Plan → Research if needed → Delegate → Implement → Review → Verify
```

Use the lightest path that preserves correctness.

Task classes:

- **Trivial** — isolated, clear, low risk.
- **Bounded** — clear scope and outcome.
- **Architectural** — major/high-risk design.
- **Spike** — feasibility/research.
- **Bug** — reproduce → root cause → fix → verify.
- **UI/design** — reference fidelity + rendered behavior.

## Reliability: Fluency Is Not Evidence

A recurring failure mode is confident fabrication: plausible APIs, commands, file paths, versions, config, or explanations that are not true for the current project.

Use this evidence order:

```text
Repository/code/config
→ observed tool/test output
→ official/current docs
→ trusted examples/issues
→ model knowledge
```

Model knowledge is useful for hypotheses, not silent assumptions.

Before a non-trivial change, verify the facts that drive it:

- target file/path
- relevant symbols/behavior
- installed dependency/version
- scripts/commands
- config schema
- API/database contract
- UI reference details

When evidence is unavailable:

```text
UNKNOWN → do not invent → conservative action or report blocker
```

Also remember:

- failed search is not proof of absence
- another project's setup is not proof of this project's setup
- current docs may not match the installed version
- a plausible explanation remains a hypothesis until verified

## Multi-Agent Lessons

Parallel agents help when work is genuinely independent.

The main safety rule is:

```text
one writer → one file/symbol ownership boundary
```

Good orchestration:

```text
exploration + research + visual analysis + isolated implementation
                         ↓
                    reconcile
                         ↓
                    integrate
                         ↓
                    verify
```

Avoid fake parallelism. Duplicate agents increase token use and reconciliation cost without adding evidence.

Specialists should return findings, evidence, recommendations, and uncertainty—not large file dumps.

## UI / Design Fidelity

The recurring UI problem is implementing the idea of a design rather than the actual reference.

Preferred workflow:

```text
Reference → Inspect → Map → Implement → Render → Compare → Correct
```

When references exist (eg. Figma, Stitch, screenshot, etc.), inspect:

- hierarchy/layout
- spacing
- typography
- colors/tokens
- borders/radius/elevation
- icons/images
- states
- responsive behavior
- theme variants

### Mobile-first

Start at the smallest supported viewport, then enhance upward.

Check wrapping, overflow, navigation, sticky/fixed regions, touch targets, viewport-height behavior, and keyboard/focus behavior when relevant.

### Token-first

Reuse semantic tokens and existing components first.

Create a new token only when it represents a real reusable design-system concept.

### Dark mode

Prefer the existing theme architecture. Do not invent a parallel system solely to add dark mode.

## Engineering Principles

These are heuristics, not laws.

**YAGNI** — don't build hypothetical requirements.

**KISS** — prefer code maintainers can understand quickly.

**DRY** — deduplicate stable concepts, not every repeated line.

**SOLID** — apply when it reduces real complexity; avoid ceremony.

**Composition** — prefer composable units when useful.

**Cohesion / coupling** — keep related behavior together and dependencies deliberate.

**Single source of truth** — avoid duplicated business rules/state.

**Least surprise** — follow established conventions.

**Optimize last** — optimize from evidence.

A few repeated lines can be better than a premature abstraction.

## Debugging Lessons

Use:

```text
Reproduce → Observe → Hypothesize → Test → Fix → Verify
```

The important lesson is to stop treating a failed hypothesis as fact.

After repeated failed attempts, reconsider the root assumption or escalate. More speculative patches usually consume tokens without increasing confidence.

## Verification Lessons

Different changes require different evidence:

| Change | Useful evidence |
|---|---|
| Types/business logic | type check + focused tests |
| API/data behavior | focused + integration tests |
| UI behavior | runtime/browser checks |
| UI visual fidelity | rendered comparison |
| Responsive behavior | multiple viewport checks |
| Infrastructure | validation/plan + targeted checks |
| Refactor | existing tests + type/build |

Always distinguish:

- caused by this change
- pre-existing
- environment/tooling
- unresolved

## Memory Lessons

Good durable knowledge:

- stable architecture decisions
- non-obvious conventions
- recurring integration quirks
- useful commands
- known gotchas
- accepted design decisions

Avoid:

- temporary task state
- transcripts
- source-code copies
- guesses
- stale workarounds
- obvious repository facts

Promotion heuristic:

```text
Repeated + reusable + non-obvious → keep
Otherwise → don't add memory
```

## Skills / Workflow Assets

Use the smallest reusable mechanism:

```text
Instruction
→ prompt/config
→ skill
→ custom agent
→ new system complexity
```

Create a skill when a workflow is repeatable, has stable inputs, and provides meaningful reliability/efficiency value.

Do not create a skill or agent for a one-off problem.

## OpenCode Lessons

OpenCode combines global and applicable project/directory `AGENTS.md` instructions, so global guidance should stay broad and project-specific details should stay local.

OpenCode supports reusable subagents as separate profiles; specialist-specific prompts and permissions belong in that configuration layer.

oh-my-opencode-slim supports per-agent prompt append files, skills, and MCP access. That is the right place for specialist-specific behavior rather than duplicating it globally.

Its current background-orchestration model is designed around planning, background specialist dispatch, monitoring, reconciliation, and verification.

## Promotion Rules

Promote a lesson into global `AGENTS.md` only when it is:

1. broadly useful across projects
2. repeatedly validated by real work
3. actionable as an agent behavior
4. worth the context cost of being loaded globally

Otherwise keep it here, in project-level `AGENTS.md`, in project memory, or in a skill.

## Applied Lessons

### 2026-09-24 — Hallucination hardening

Promoted these global rules:

- evidence before invention
- explicit verification of paths, symbols, versions, commands, config, contracts, and references
- unknown remains unknown
- no fabricated tests/tool use/research/root causes
- conflicting evidence must be resolved
- failed lookup is not proof of absence

### 2026-09-24 — Orchestration hardening

Promoted:

- delegation check before substantial work
- parallelize meaningful independent lanes
- explicit writer ownership
- avoid duplicate background work
- keep delegation proportional to coordination cost

### 2026-09-24 — UI fidelity hardening

Promoted:

```text
Reference → Inspect → Map → Implement → Render → Compare → Correct
```

with mobile-first, token-first, responsive, accessibility, and runtime verification expectations.

### 2026-09-24 — Separation of concerns

Kept active behavior in `AGENTS.md`; kept rationale and lessons here to reduce global instruction/context duplication.
