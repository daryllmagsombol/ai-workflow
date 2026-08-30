# AI-Assisted Coding Workflow: Learning & Reference

> A living document that captures what I've learned about agentic coding with OpenCode.
> Built through hands-on reconfiguration of my agent setup.

---

## Session 0: Foundation — How OpenCode Works

### What is an AI Coding Agent?

An **agent** is a specialized AI persona with:
- A **role** (what it does)
- **Permissions** (what tools it can use)
- A **system prompt** (how it behaves)
- Optional **model override** (which AI model to use)

Think of it like a team member with a job description. You don't ask the QA engineer to design UI, and you don't ask the PM to write code.

### Primary vs Subagent

| | Primary | Subagent |
|---|---|---|
| **Entry** | Loaded by default when you start a session | Called explicitly via `@name` or by the primary agent |
| **Role** | Main driver of the conversation | Specialist for a specific domain |
| **Switching** | Tab key cycles between primary agents | `@mention` in any message |
| **Example** | `team-leader.md` | `qa.md`, `security-engineer.md` |

### Skills

**Skills** are pre-written instruction files that inject domain expertise. They're like plugins for the agent — loaded on demand when a task matches their domain.

- Skills live in `~/.agents/skills/` or in the superpowers package
- The AI automatically loads a skill when the task description matches
- You can also invoke them manually: "Use the brainstorming skill for this"

### Request Flow

```
You type a request
       ↓
Team Leader (primary agent) reads it
       ↓
TL decides: "Can I handle this or should I delegate?"
       ↓
   ┌────┴────┐
   ↓         ↓
Handle     Delegate to subagent (via task tool)
                   ↓
            Subagent executes with fresh context
                   ↓
            Returns results to TL
                   ↓
            TL synthesizes and reports back to you
```

### Tools

Agents don't just talk — they act. Each agent has access to tools:

| Tool | What it does |
|------|-------------|
| `read` | Read file contents |
| `write` | Create or overwrite files |
| `edit` | Targeted search-and-replace edits |
| `bash` | Execute shell commands |
| `grep` | Search file contents |
| `glob` | Find files by name patterns |
| `task` | Dispatch work to subagents |
| `todowrite` | Track task checklists |
| `webfetch` | Fetch web pages |
| `websearch` | Search the internet |

Permissions control which tools an agent can use (`allow`, `ask`, `deny`).

---

## Session 1: System Prompt Engineering

### What is a System Prompt?

The system prompt is the instruction file loaded **before you type anything**. It's the first thing the AI reads in a session. It sets:
- Who the AI is
- Who you are
- How to communicate
- What process to follow
- What to avoid

**It is the single highest-leverage edit you can make.** A good system prompt prevents 80% of the problems users hit (inconsistent output, wrong approach, missing context).

### Before and After

**My old AGENTS.md:**
```markdown
# Claude-Mem Memory Context
<claude-mem-context>
# Memory Context from Past Sessions
*No context yet. Complete your first session and context will appear here.*
</claude-mem-context>
```

This told the AI almost nothing about me or how I want to work.

**My new AGENTS.md:**
```markdown
# AI-Assisted Coding Workflow

## About the Developer
- JS/TS developer (rusty but code-literate)
- Uses OpenCode with custom multi-agent setup
- Prefers practical examples over theory

## Default Behavior
- Be direct and concise — no fluff
- Before coding non-trivial tasks, explain approach first
- Default agent: Team Leader
- Subagents: @qa, @security-engineer, @project-manager, @ui-ux-designer

## Workflow Defaults
- Feature work: understand → plan → route → verify → summarize
- Prefer small, focused files over large ones
- Use TypeScript strict mode for examples
- Don't add dependencies unless asked
- Tests required for feature work
```

### The Anatomy of a Good System Prompt

1. **Who the developer is** — "JS/TS developer" tells the AI the language and context
2. **Communication style** — "direct and concise, no fluff" removes emoji-filled responses
3. **Workflow process** — "explain approach first" prevents the AI from jumping straight to code
4. **Constraints** — "don't add dependencies" prevents unnecessary npm installs
5. **Anti-patterns** — implicit: the AI now knows what *not* to do

### Key Insight

> Every time you find yourself correcting the AI's behavior in conversation, ask: **"Should this be in my AGENTS.md?"**
>
> If you've told the AI "don't use emojis" three times, put it in AGENTS.md. That way it's always loaded, never forgotten.

---

## Session 2: Agent Definitions & Orchestration

### How Agent Files Work

Each agent is a `.md` file with YAML frontmatter:

```markdown
---
description: "One line shown in the agent picker UI"
mode: primary        # or "subagent"
color: primary       # UI tag color
permission:
  edit: allow        # allow | ask | deny
  bash: allow
  glob: allow
  grep: allow
---

You are the **Agent Name**.
```

OpenCode reads these files and registers them as available agents. The `description` field is critical — it's what the AI reads to decide which agent to route to.

### Permission Design Philosophy

| Permission | Means | Use for |
|-----------|-------|--------|
| `allow` | Can use freely | Trusted agents doing their core job |
| `ask` | Must ask first | Agents that might overstep (orchestrators, reviewers) |
| `deny` | Cannot use | Read-only agents (PM, planning only) |

**My setup's permission rationale:**

| Agent | edit | bash | Why |
|-------|------|------|-----|
| Team Leader | ask | ask | Orchestrator — should route, not build. Asks before doing anything. |
| QA | allow | allow | Needs to write tests and run them freely. |
| Security | allow | allow | Needs to patch vulns and run scans without friction. |
| PM | deny | deny | Pure planning. Should never write code or run commands. |
| UI/UX | allow | allow | Needs to create components, run builds, check accessibility. |

### The Orchestration Pattern

My setup uses the **Supervisor pattern** (also called orchestrator/subagent):

```
User → Team Leader (supervisor)
         ├── @qa (testing/quality)
         ├── @security-engineer (vulnerability)
         ├── @project-manager (planning)
         └── @ui-ux-designer (design)
```

The Team Leader:
1. Receives the user's request
2. Decides which subagent to invoke (based on task type)
3. Dispatches work via the `task` tool (fresh context for the subagent)
4. Receives results and synthesizes them
5. Reports back to the user

### Why This Works

- **Each subagent has a clean context** — no cross-contamination from other tasks
- **Each subagent has focused tools** — QA has test commands, PM has none
- **The TL maintains the big picture** — no single agent gets overwhelmed
- **You can work in parallel** — dispatch research to one agent while another builds

### Agentic Workflow Defined

> **Agentic workflow** = breaking a complex task into discrete steps, with different agents (or the same agent in different phases) handling each step.

Without workflow: "Build a login page" → AI guesses the steps, skips testing, misses edge cases.

With workflow: "Build a login page" → PM plans → TL routes to UI/UX for design → QA tests → Security reviews → TL verifies.

The difference is **predictability**. The same process every time → the same quality every time.

---

## Session 3: Session Workflow

### How to Start a Session

The first message matters more than anything else you type. A structured request gets better results.

**Bad start:**
> "Hey can you help me with something?"

The AI now has to guess what you want. Wastes context.

**Good start:**
> "I need to add cursor-based pagination to the GET /users endpoint in our Express app. It should return 20 items per page, include a cursor in the response, and handle empty results. Uses Prisma. Don't add new dependencies."

The AI now knows: task, scope, constraints, tech stack, and success criteria.

### The Task Decomposition Pattern

For complex work, follow this structure:

1. **State your goal** — one sentence describing the outcome
2. **Let the AI propose an approach** — "First, tell me if these requirements are clear and how you'd approach this. Don't write code yet."
3. **Review and approve** — confirm the approach before execution
4. **Execute in phases** — review after each phase
5. **Verify** — ask for tests, check the output

```
Goal → Proposal → Approval → Build Phase 1 → Review → Build Phase 2 → Review → Verify → Done
```

### Course-Correction Phrases

When the AI goes off track:

| Situation | Say |
|-----------|-----|
| Wrong approach | "Stop. That's not what I meant. Let me rephrase: ..." |
| Too complex | "Simplify this. I only need X and Y, not Z." |
| Wrong technology | "Don't use that library. Use the one already in the project." |
| Missing context | "You're missing [file]. Read it and update your approach." |

### Session Starter Template

Copy-paste this and fill in:

```markdown
I need to [goal].

Context:
- [what I'm working on]
- [what exists already]

Requirements:
- [requirement 1]
- [requirement 2]

Constraints:
- [tech constraint]
- [anti-pattern to avoid]

First, tell me if my requirements are clear and propose an approach.
Don't write code until I approve.
```

---

## Session 4: Context Management

### The Context Window Problem

AI models have a limited attention span (context window). Even with 200K tokens, conversations get long. Everything you've said and the AI has said takes up space.

**What eats context fast:**
- Long error traces pasted inline
- Entire files dumped into the conversation
- Verbose back-and-forth that could have been a single message
- AI responses that repeat what you already know

### Strategies

#### 1. Summarize and Restart

When a session gets long (30+ messages), ask:

> "Summarize what we've done and what's pending. I'm going to start a fresh session."

The AI compresses the state into a paragraph. Start a new session with `/session`, paste the summary.

#### 2. Use Files as External Memory

Instead of keeping decisions in conversation, write them down:

- `AGENTS.md` — permanent preferences and workflow rules
- `CLAUDE.md` or session notes — what was decided in this project
- `LEARNING.md` — this file! Captures what I've learned

Every word in a file is a word NOT in the context window.

#### 3. Be Concise

- State requirements directly — don't narrate your thinking process
- Paste file snippets, not entire files (use `read` tool for full files)
- Use bullet points over paragraphs

#### 4. Use Caveman Mode

Superpowers includes a `caveman` skill that compresses communication. In long sessions, invoke it to save ~75% tokens.

#### 5. Use @mentions for Fresh Context

When you call `@qa`, the subagent starts with a **fresh context** focused only on the task you give it. This is one of the most powerful patterns — you get clean reasoning without historical baggage.

### Context Budget Analogy

> Your session is a suitcase. Every message you send and receive is an item you pack.
>
> If you pack old conversation junk (verbose back-and-forth, repeated clarifications, full error traces), there's no room for the actual work (code, design decisions, test results).
>
> Pack light. Use files for storage. Take fresh suitcases (subagents) for each task.

---

## Session 5: Prompt Patterns

### The Universal Prompt Structure

Every good prompt follows this pattern:

> **Role + Context + Task + Format + Constraints**

| Element | Purpose | Example |
|---------|---------|---------|
| **Role** | Who the AI should act as | "You are a senior TypeScript developer" |
| **Context** | What exists already | "We have an Express app with Prisma" |
| **Task** | What to do | "Add cursor pagination to GET /users" |
| **Format** | How to return the result | "Return the route handler and a JSDoc comment" |
| **Constraints** | What to avoid | "Don't add new dependencies. Use existing Prisma client" |

### Pattern 1: Feature Work

```
You are a senior TypeScript developer.
Context: [current setup, existing code]
Task: [what to build]
Format: [how to present the output]
Constraints: [tech limits, anti-patterns]
```

**Example:**
```
You are a senior TypeScript developer.
Context: We have an Express + Prisma app. User model exists with id, email, name.
Task: Add cursor-based pagination to the GET /users endpoint.
  Return 20 items per page. Cursor is the last user's id.
  Include `hasMore` boolean in response.
Format: Export a new route handler. Add JSDoc explaining the pagination params.
Constraints: Use existing Prisma client. Don't add new dependencies.
```

### Pattern 2: Debugging

```
Context: [what's failing, error message]
Task: Find the root cause and fix it.
Constraints: Explain the bug before writing the fix. Add a regression test.
```

**Example:**
```
Context: The test `test/user.test.ts:42` fails with "Cannot read properties of
  undefined (reading 'email')". The user object seems malformed.
  Here's the relevant code: [paste].
Task: Find the root cause and fix it.
Constraints: Explain what caused it. Add a regression test that would have caught it.
```

### Pattern 3: Code Review

```
Context: Review this PR diff [paste].
Task: Find bugs, security issues, and test gaps.
Format: For each finding: file:line → problem → fix suggestion.
Prioritize by severity (critical/high/medium/low).
```

### Pattern 4: Refactoring

```
Context: This file has grown too large [paste or describe].
Task: Split it into smaller modules with clear responsibilities.
Constraints: Don't change the public API. All existing tests must pass.
  Keep related functions together. Each new file should have one purpose.
```

### Why Patterns Work

Patterns are **repeatable**. Same structure → same quality every time. No luck involved.

When you use a pattern:
- You don't forget to include context
- The AI knows exactly what format to return
- Constraints prevent bad decisions
- The outcome is predictable

---

## Session 6: Skill Leverage

### What Skills Are

Skills are pre-written instruction files that inject domain expertise into the AI's context. Think of them as **on-demand experts**.

When you start a task that matches a skill:
1. The skill file is loaded
2. Its instructions are injected into the AI's context
3. The AI follows the skill's workflow

### When to Use a Skill

| Use a skill when... | Don't use a skill when... |
|--------------------|---------------------------|
| Working in an unfamiliar domain | You can describe the approach clearly in one sentence |
| The skill encodes team best practices | The task is straightforward |
| You need a step-by-step process for reliability | The skill is about something you've already mastered |
| The domain has high stakes (security, deployment) | You're experimenting and want flexibility |

### The Golden Path for Feature Work

The most important skill chain is:

```
brainstorming → writing-plans → execute
```

1. **brainstorming** — Clarify requirements, explore approaches, document design
2. **writing-plans** — Break the design into testable, sequential tasks
3. **execute** — Build it (via subagent-driven development or inline)

Run feature work through this chain every time. It prevents the #1 failure mode: building the wrong thing.

### Your Installed Skills Quick Tour

| Skill | When to use |
|-------|------------|
| `brainstorming` | Before any feature work — design first |
| `writing-plans` | After design approval — create implementation plan |
| `systematic-debugging` | For any bug — don't guess, follow the process |
| `test-driven-development` | Before writing feature code — TDD workflow |
| `caveman` | In long sessions to save token space |
| `caveman-compress` | Compress memory files when they get large |
| `find-skills` | Looking for new skills to install |
| `nestjs-best-practices` | Working on NestJS code |
| `next-best-practices` | Working on Next.js code |
| `azure-*` | Working with Azure resources |

### How to Create Your Own Skill

If you find yourself repeating the same instructions, make it a skill:

1. Create a `SKILL.md` in your skills directory
2. Write the instructions you'd normally repeat
3. Give it a clear description (so the AI auto-loads it at the right time)
4. Test it with a real task

---

## Quick Reference

### Session Starter Template

```
I need to [goal].

Context:
- [what I'm working on]
- [what exists already]

Requirements:
- [requirement 1]
- [requirement 2]

Constraints:
- [tech constraint]
- [anti-pattern to avoid]

First, tell me if my requirements are clear and propose an approach.
Don't write code until I approve.
```

### Universal Prompt Structure

> **Role + Context + Task + Format + Constraints**

### Agent Delegation Table

| Need | Agent | Permissions |
|------|-------|-------------|
| Write tests, review code, find bugs | `@qa` | edit/bash: allow |
| Security audit, vuln scan, hardening | `@security-engineer` | edit/bash: allow |
| Task breakdown, estimation, planning | `@project-manager` | edit/bash: deny |
| UI design, a11y, responsive layout | `@ui-ux-designer` | edit/bash: allow |
| Orchestration, routing, synthesis | Team Leader (default) | edit/bash: ask |

### Skill Chain for Feature Work

```
brainstorming → writing-plans → execute
```

### Context Budget Tips

- Summarize and restart sessions after 30+ messages
- Use files (AGENTS.md, CLAUDE.md) for external memory
- Caveman mode when tokens are tight
- @mentions give each subagent a fresh context
- One clear first message beats 10 back-and-forth clarifications

### Course-Correction Phrases

| Situation | Say |
|-----------|-----|
| Wrong approach | "Stop. Let me rephrase: ..." |
| Too complex | "Simplify. I only need X." |
| Wrong tech | "Use the existing library, not a new one." |
| Missing context | "Read [file] and update your approach." |
