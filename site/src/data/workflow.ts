export type StageId =
  | 'understand'
  | 'inspect'
  | 'plan'
  | 'research'
  | 'delegate'
  | 'implement'
  | 'review'
  | 'verify';

export interface WorkflowStage {
  readonly id: StageId;
  readonly number: number;
  readonly title: string;
  readonly summary: string;
  readonly what: string;
  readonly why: string;
  readonly output: string;
  readonly conditional?: string;
}

export interface Specialist {
  readonly id: string;
  readonly title: string;
  readonly responsibility: string;
}

export interface EvidenceLink {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly href: string;
}

export const repositoryUrl = 'https://github.com/daryllmagsombol/ai-workflow';
export const profileUrl = 'https://github.com/daryllmagsombol';

// Outputs describe a possible search/filter task, not a completed client feature.
export const stages: readonly WorkflowStage[] = [
  {
    id: 'understand',
    number: 1,
    title: 'Understand',
    summary: 'Agree on what search and filters should do.',
    what: 'I clarify which fields are searchable, which filters matter, how they combine, and what counts as done. Permissions and empty results are part of that conversation.',
    why: 'Important behavior belongs in the requirements, not in an AI assistant’s assumptions. I remain responsible for those decisions.',
    output: 'An agreed brief: search by title, filter by status, combine both, and preserve the existing access rules. These are illustrative choices to confirm before building.',
  },
  {
    id: 'inspect',
    number: 2,
    title: 'Inspect',
    summary: 'Read how the existing app handles data and interface behavior.',
    what: 'Locate the list page, query logic, permission checks, reusable controls, and nearby tests. The explorer can help map the relevant code and patterns.',
    why: 'The change should fit the application that exists, rather than introducing a duplicate search system or bypassing established rules.',
    output: 'A map of affected files, existing search or filter components, query behavior, and tests to extend. Unclear behavior returns to the brief.',
  },
  {
    id: 'plan',
    number: 3,
    title: 'Plan',
    summary: 'Define the scope, dependencies, checks, and file ownership.',
    what: 'The orchestrator breaks the change into bounded tasks. It identifies which work can run independently and what must wait for an agreed query interface.',
    why: 'A plan prevents incompatible assumptions and overlapping edits. Small changes can take a lighter path; not every request needs a large process.',
    output: 'A bounded plan for query behavior, search controls, tests, and review, with an owner and completion checks for each task.',
  },
  {
    id: 'research',
    number: 4,
    title: 'Research',
    conditional: 'When needed',
    summary: 'Check unfamiliar or version-sensitive APIs when needed.',
    what: 'The librarian checks current documentation and repository examples against the app’s actual dependencies. Context7 can supply version-specific documentation.',
    why: 'A plausible API is not proof that it exists in this version. Skip this stage when the existing code and verified sources already answer the question.',
    output: 'A sourced approach for combining search and filters. Newly discovered constraints may send the work back to planning.',
  },
  {
    id: 'delegate',
    number: 5,
    title: 'Delegate',
    conditional: 'When useful',
    summary: 'Assign focused work to specialists when useful.',
    what: 'Give each specialist the brief, relevant files, constraints, ownership, and expected checks. Run only independent lanes in parallel; reconcile their results before dependent work.',
    why: 'Each assistant needs a specific job, not an instruction to build everything. The task determines the specialist mix; not every agent participates in every change.',
    output: 'Focused search/filter task briefs with non-overlapping file ownership and an agreed interface. Simple work may stay in one lane instead.',
  },
  {
    id: 'implement',
    number: 6,
    title: 'Implement',
    summary: 'Make a bounded change using the app’s existing patterns.',
    what: 'The fixer carries out the scoped change, reuses existing components, preserves access rules, and adds or updates the relevant tests.',
    why: 'The goal is maintainable behavior that meets the brief, not generated code that merely appears to work. Scope changes return to planning.',
    output: 'A reviewable diff for the search controls, combined query behavior, and tests for filtering, clearing a filter, and empty results.',
  },
  {
    id: 'review',
    number: 7,
    title: 'Review',
    summary: 'Challenge the proposed change and investigate findings.',
    what: 'OpenCode AI review checks the proposed diff for bugs and risks where configured. Findings are reconciled against the actual code and requirements, not trusted without judgment.',
    why: 'A change can look complete and still mishandle combined filters or expose records. Review is another check, not a guarantee. A finding can return work to investigation or implementation.',
    output: 'Illustrative review feedback: changing the status filter drops the search term. Investigate, fix the cause, and review again; this is not an actual review verdict.',
  },
  {
    id: 'verify',
    number: 8,
    title: 'Verify',
    summary: 'Gather evidence, fix failures, and keep approval human.',
    what: 'Run checks appropriate to the project: tests, build/type checks, static analysis, and rendered UI checks where applicable. SonarQube is opt-in. Fix failures and rerun affected checks.',
    why: 'Confidence is not evidence. Checks vary by project, and skipped checks or unresolved risks must be reported. Verified work still needs human review and approval before shipping.',
    output: 'A verification report for search/filter combinations, permissions, empty results, and mobile behavior, listing actual checks run, results, and limitations—not simulated passing tests.',
  },
];

export const specialists: readonly Specialist[] = [
  {
    id: 'orchestrator',
    title: 'Orchestrator',
    responsibility: 'Plan dependencies, assign focused work, reconcile specialist results, and coordinate verification.',
  },
  {
    id: 'explorer',
    title: 'Explorer',
    responsibility: 'Locate relevant files, symbols, and existing repository patterns.',
  },
  {
    id: 'librarian',
    title: 'Librarian',
    responsibility: 'Research current documentation, library APIs, and repository examples when needed.',
  },
  {
    id: 'designer',
    title: 'Designer',
    responsibility: 'Own interface design, interaction quality, and frontend implementation within the assigned scope.',
  },
  {
    id: 'fixer',
    title: 'Fixer',
    responsibility: 'Implement bounded changes using the project’s existing patterns and assigned checks.',
  },
  {
    id: 'oracle',
    title: 'Oracle',
    responsibility: 'Advise on architecture, risk, complex debugging, and difficult engineering decisions.',
  },
  {
    id: 'observer',
    title: 'Observer',
    responsibility: 'Analyze screenshots, images, and other visual material when needed; report findings without editing code.',
  },
];

export const evidenceLinks: readonly EvidenceLink[] = [
  {
    id: 'readme',
    title: 'Workflow and responsibilities',
    description: 'Read the method, specialist roles, quality gates, and human responsibilities.',
    href: `${repositoryUrl}/blob/main/README.md`,
  },
  {
    id: 'setup',
    title: 'Development setup',
    description: 'Inspect installation steps, provider configuration, and tooling setup.',
    href: `${repositoryUrl}/blob/main/DEV-SETUP.md`,
  },
  {
    id: 'configuration',
    title: 'Specialist configuration',
    description: 'Inspect the current agent and model presets. Routing can change independently of the method.',
    href: `${repositoryUrl}/blob/main/oh-my-opencode-slim.json`,
  },
  {
    id: 'checks',
    title: 'PR checks and AI review',
    description: 'Inspect configuration validation, script checks, regression tests, and review gating. Fork PRs skip the AI review job; validation and human review still apply.',
    href: `${repositoryUrl}/blob/main/.github/workflows/opencode-review.yml`,
  },
  {
    id: 'profile',
    title: 'GitHub profile',
    description: 'Visit the author’s public GitHub profile.',
    href: profileUrl,
  },
];
