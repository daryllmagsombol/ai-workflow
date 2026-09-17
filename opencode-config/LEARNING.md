# AI Coding Workflow — Learning Log

> `AGENTS.md` contains active rules. This file records lessons, reasoning, and experiments behind the workflow.
> Keep it compact and factual. Do not turn it into a second instruction file.

## Purpose

Capture:

- recurring workflow lessons
- patterns that improve output quality
- failures worth avoiding
- reasons behind important process changes

When a lesson becomes a stable, broadly reusable rule, promote it to `AGENTS.md` and record the promotion here.

## Workflow Model

A useful default is:

```text
Understand → Inspect → Plan → Research if needed → Delegate → Implement → Review → Verify
```

This is adaptive, not mandatory. A trivial change may need only inspect → implement → verify.

### Task classes

- **Bounded** — clear scope; proceed after enough inspection.
- **Architectural** — major or high-risk design; spend more time on tradeoffs before implementation.
- **Spike** — feasibility/research without automatic implementation.
- **Bug** — establish failure, find root cause, fix, verify.
- **UI/design** — reference fidelity and runtime behavior are part of acceptance.

## Multi-Agent Lessons

Parallel specialists are useful when work is genuinely independent.

The key constraint is write ownership:

```text
Agent A → files A/B
Agent B → files C/D
Agent C → research/read-only
```

Never let two agents edit the same file concurrently.

Delegation has overhead. Use it when the expected information or implementation value is greater than the coordination cost.

Good specialist outputs contain:

- important findings
- evidence
- recommendation
- blockers or uncertainty

Avoid returning entire files or repeating unchanged context.

## Evidence Before Assumptions

AI-assisted development fails when plausible guesses are treated as facts.

Prefer:

```text
Repository evidence
    ↓
Project docs/config
    ↓
Official/current documentation
    ↓
Real-world examples/issues
    ↓
Model knowledge
```

For version-sensitive behavior, verify it.

When the repository already demonstrates a pattern, prefer that pattern unless there is a reason to change it.

## UI / Design Fidelity

A recurring UI failure mode is implementing the idea of a reference rather than the reference itself.

When a Figma, Stitch design, screenshot, or mockup exists, inspect:

- hierarchy and layout
- spacing rhythm
- typography and line-height
- colors and semantic tokens
- borders, radii, elevation
- icons and imagery
- interactive states
- responsive behavior
- theme variants

Then render the UI and compare it with the reference when practical.

### Mobile-first

Start at the smallest supported viewport, then enhance upward.

Check:

- wrapping
- horizontal overflow
- sticky/fixed regions
- navigation
- touch targets
- viewport-height behavior
- focus/keyboard behavior where relevant

### Token-first

Reuse existing semantic tokens and components before introducing arbitrary values.

A new token should solve a real design-system need, not hide a one-off value.

### Dark mode

Prefer the project's existing theme architecture. Do not invent a second design system just to claim dark mode support.

## Engineering Principles

These are heuristics, not laws.

### YAGNI

Do not build hypothetical future requirements.

### KISS

Prefer code a maintainer can understand quickly.

### DRY

Remove meaningful duplication when there is a stable shared concept. Do not abstract coincidental similarity.

### SOLID

Use when boundaries and responsibilities genuinely reduce complexity. Avoid interfaces, factories, or layers created only to satisfy a principle.

### Composition

Prefer small composable units when they improve reuse and changeability.

### Cohesion and coupling

Keep related behavior together. Make dependencies explicit and intentional.

### Single source of truth

Do not duplicate business rules or state.

### Optimize last

Correctness and clarity first; performance work should be driven by evidence.

## Debugging Lessons

Use:

```text
Reproduce
→ Observe
→ Hypothesize
→ Test
→ Fix
→ Verify
```

Avoid:

```text
Error
→ guess
→ patch
→ new error
→ guess again
```

After repeated failed fixes, reconsider the hypothesis and escalate rather than consuming tokens on increasingly speculative changes.

## Verification Lessons

"Build passes" is not equivalent to "the feature works."

Match verification to failure modes:

| Change | Useful evidence |
|---|---|
| Business logic/types | type check + focused tests |
| API/data behavior | focused + integration checks |
| UI behavior | runtime/browser checks |
| UI visual fidelity | rendered comparison |
| Responsive layout | multiple viewport checks |
| Infrastructure | validation/plan + targeted checks |
| Refactor | existing tests + type/build checks |

Always distinguish:

- caused by the change
- pre-existing
- environment/tooling
- unresolved

## Memory Lessons

Good durable knowledge:

- stable architecture decisions
- non-obvious project conventions
- recurring integration quirks
- useful commands
- known gotchas
- accepted design decisions

Avoid storing:

- temporary task state
- verbose transcripts
- file contents
- guesses
- stale workarounds
- information obvious from the repository

Promotion heuristic:

```text
Repeated + reusable + non-obvious → keep
Otherwise → don't add memory
```

## Skills and Workflow Assets

Use the smallest reusable mechanism that solves a recurring problem:

```text
Existing instruction
    ↓
Prompt/config adjustment
    ↓
Skill
    ↓
Custom agent
    ↓
New system complexity
```

Create a skill when a workflow has stable inputs, repeatable steps, and enough frequency or reliability value to justify maintenance.

Do not create a skill or agent for a one-off task.

## Prompt Lessons

Useful prompts make the objective observable:

```text
Goal
Context
Constraints
Acceptance criteria
```

Acceptance criteria are usually more valuable than role-play.

Example:

> Match the provided mobile reference, reuse existing design tokens/components, verify at the target viewport, and correct meaningful spacing, typography, and overflow differences.

## OpenCode Lessons

Current OpenCode V2 loads the global `AGENTS.md` plus applicable project/directory `AGENTS.md` files and combines them; it does not automatically resolve conflicting instructions. Keep broad rules global and scoped project rules local.

OpenCode subagents run in child sessions with fresh context, so focused delegation is useful, but clear handoffs and ownership remain important.

oh-my-opencode-slim exposes dedicated configuration and prompt files for its built-in agents, so agent-specific model routing and specialist prompt tuning belong there rather than being duplicated in this learning file.

## Promotion Rules

Promote a lesson into global `AGENTS.md` only when it is:

1. broadly useful across projects
2. repeatedly validated by real work
3. actionable as an agent behavior
4. worth the context cost of being loaded globally

Otherwise keep it here, in project-level `AGENTS.md`, in project memory, or in a skill.

## Applied Lessons

### 2026-09-01 — Global workflow cleanup

Rebuilt the learning document from scratch and separated active rules from historical/reference material.

Removed from the learning file:

- repeated agent roster/configuration
- repeated MCP rules
- generic prompt-template catalog
- repeated quick-reference tables
- session-by-session narrative
- context-window metaphors
- mandatory approval behavior that should depend on task risk

Promoted into global `AGENTS.md`:

- evidence before invention
- adaptive workflow
- concurrent-agent file ownership
- mobile-first UI
- reference-driven UI verification
- token-first design
- pragmatic YAGNI/KISS/DRY/SOLID
- root-cause debugging and early escalation
- risk-based verification
- memory hygiene
- Git safety
- clear completion reporting

### 2026-09-01 — UI fidelity focus

The recurring frontend problem is not merely producing functional UI; it is preserving fidelity to Figma, Stitch, screenshots, and the project's design system.

The global contract therefore treats:

```text
Reference → Inspect → Map to tokens/components → Implement → Render → Compare → Correct
```

as the preferred UI workflow when a reference exists.
