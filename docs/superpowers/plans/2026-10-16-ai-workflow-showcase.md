# Personal AI Workflow Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved personal React showcase explaining the author's AI workflow through a cinematic, accessible, mobile-first walkthrough.

**Architecture:** A self-contained static Vite application under `site/`, using typed content, focused React sections, Tailwind CSS tokens, and Motion choreography. Pure connector geometry is separate from DOM measurement and animation so it can be tested independently. Existing repository validation stays intact; site checks join the PR gate and deployment remains separately controlled.

**Tech Stack:** Node 24, npm with a committed `site/package-lock.json`, React/TypeScript, Vite, Tailwind v4 with its Vite plugin, Motion for React, Playwright Test with bundled Chromium, GitHub Actions/Pages.

**Spec:** `docs/superpowers/specs/2026-10-16-ai-workflow-showcase-design.md` (approved in conversation).

## Global Constraints

- Personal showcase; professional title **Software Engineer**; default byline **daryllmagsombol** and heading **How I build software with AI.**
- Guided task **Add search and filters to an existing application** is illustrative, never a claimed client project or live telemetry.
- Preserve the cinematic direction and corrected routing of `.superpowers/brainstorm/57222-1792156470/content/orchestration-cinematic-routing.html`; do not publish preview/session files or keys.
- Stage order: Understand, Inspect, Plan, Research when needed, Delegate when useful, Implement, Review, Verify; human approval follows verification.
- Mobile-first; normal scrolling; keyboard-accessible exploration; pause/replay; reduced-motion support; no card/path intersections or footer collisions.
- No invented metrics, testimonials, logos, contact details, client results, or live status; no backend, router, analytics, authentication, second animation framework, or contact form.
- Preserve existing workflow configuration and CI checks. Keep the published `typecheck`, `review`, and `gate` check names stable.
- Implementation does not authorize merging, changing Pages settings, pushing, or publishing. Those integration actions require the owner's decision.

## Review Focus

1. Project subpath: built assets and navigation work under `/ai-workflow/`, not just development root.
2. Variable layout: connectors avoid cards and controls after resize, font readiness, expansion, and row wrapping.
3. Motion/accessibility: reduced motion and pause stop continuous effects; replay does not reset scroll or close details.
4. Progressive enhancement: meaningful stage content remains readable when JavaScript or animation is unavailable.
5. CI/deployment isolation: fork PRs still validate without secrets; PR artifacts cannot be deployed as production; missing Pages opt-in does not produce a false deployment claim.

## Evidence and execution setup

- PR #1 is merged; GitHub `main` was `2b02189` during recon, while local refs were stale. Fetch before selecting the base; create a new site branch/worktree from the current `origin/main`, not the old merged chore branch. Do not reset or overwrite untracked work.
- Carry the approved spec and this plan into that workspace. Make the named local preview available read-only to the designer; it is not a tracked/public artifact.
- Add ignores for `.opencode/`, `.superpowers/`, and site dependency/build/test artifacts before installing dependencies. Never use broad staging that includes local sessions.
- Choose npm because the new site has no existing lockfile and official setup/CI commands are documented; this does not migrate the existing Bun codemap tests.
- Registry research on 2026-10-16 reported React/DOM 19.3.1, Vite 8.3.4, plugin-react 6.1.2, TypeScript 7.0.2, Tailwind/Vite plugin 4.3.3, Motion 14.3.0, Playwright Test 1.64.1. Verify availability and peer requirements before installation; lock actual compatible resolutions. Do not invent a version if registry evidence differs.
- Official references: https://vite.dev/guide/ ; https://tailwindcss.com/docs/installation/using-vite ; https://motion.dev/docs/react ; https://motion.dev/docs/react-motion-config ; https://playwright.dev/docs/browsers ; https://vite.dev/guide/static-deploy#github-pages .

---

### Task 1: Isolated foundation and typed content

**Owner:** designer (includes the visual foundation); parent validates scope and copy.

**Files:** `.gitignore`; create `site/{package.json,package-lock.json,index.html,vite.config.ts,tsconfig.json,tsconfig.app.json,tsconfig.node.json,playwright.config.ts}` and `site/src/{main.tsx,App.tsx,styles.css,data/workflow.ts}`; create `site/tests/content.spec.ts`.

**Interfaces:**
- `StageId = 'understand' | 'inspect' | 'plan' | 'research' | 'delegate' | 'implement' | 'review' | 'verify'`.
- `WorkflowStage` fields: `id`, `number`, `title`, `summary`, `what`, `why`, `output`, optional `conditional`.
- Export `stages: readonly WorkflowStage[]`, `specialists`, and `evidenceLinks` from `data/workflow.ts`. Public links target the existing GitHub repo/profile; no companion URLs or fabricated facts.
- npm scripts: `dev`, `build` (TypeScript check plus Vite build), `preview`, `test:unit` (`playwright test --project=unit`), `test:e2e` (`playwright test --project=chromium`).
- Playwright project `unit` matches `content.spec.ts` and later `geometry.spec.ts`; `chromium` matches browser specs and leaves `channel` unset. Browser tests use the built site via `vite preview` and base URL ending `/ai-workflow/`.

- [ ] Verify package versions/peers, create the minimal app/configuration, use Vite `base: '/ai-workflow/'`, `react()` and `tailwindcss()` plugins, and CSS `@import "tailwindcss"`. Do not add v3 Tailwind/PostCSS boilerplate.
- [ ] Write content tests asserting the exact eight IDs/order, unique anchors, research/delegation conditional wording, all what/why/output fields, all seven specialist roles, and public HTTPS evidence links without session keys/user paths.
- [ ] Run `npm --prefix site run test:unit` before populating the complete content; confirm assertions fail for the missing/incomplete data.
- [ ] Implement grounded content and a minimal semantic introduction with real hero/repository links. Define semantic typography/color/spacing tokens in CSS; no remote asset dependency unless justified/licensed.
- [ ] Run `npm --prefix site run test:unit` and `npm --prefix site run build`; require passing content tests and a valid subpath build. Inspect generated assets for correct `/ai-workflow/` references.

### Task 2: Cinematic page and accessible exploration

**Owner:** designer; parent reviews user-facing copy without flattening the design.

**Files:** modify `site/src/{App.tsx,styles.css}`; create `site/src/components/{Hero,WorkflowCycle,StageDetails,DelegationScene,CheckpointScene,EvidenceFooter}.tsx`; create `site/tests/exploration.spec.ts` and `site/tests/progressive.spec.ts`.

**Interfaces:** Components consume Task 1 data. Stable stage IDs remain deep-link anchors. Expand/collapse state belongs to the exploration section; scene animation must not own or reset it. Use semantic native disclosure or equivalent accessible buttons and regions.

- [ ] Write browser assertions for hero/title/byline/actions, eight visible stage links, one and multiple expanded details, open-all/close-all, keyboard navigation, hash navigation, and all seven nested delegation roles. Initially confirm failures for unimplemented interactions.
- [ ] Implement the reference hierarchy: dramatic opening, connected cycle, readable task walkthrough, nested parallel lanes, distinct checkpoints/correction story, human approval, real evidence links and footer.
- [ ] Use a build-time prerender of the one public route if necessary for meaningful no-JavaScript content; keep it within the Vite build, not a backend or second framework. Add `progressive.spec.ts` loading the build with JavaScript disabled and assert hero, eight stage summaries, and evidence links remain readable. A generic noscript notice alone does not satisfy this requirement.
- [ ] Install the Playwright-managed browser with `npm --prefix site exec -- playwright install chromium`; never require system Chrome. Run `npm --prefix site run build` then `npm --prefix site run test:e2e -- exploration.spec.ts progressive.spec.ts`.
- [ ] Render at 320, 390, 768, 1024, and 1440px. Check no horizontal overflow, readable copy, usable controls, and consistent visual direction. Parent/designer compare rendered result to the local reference, not merely source code.

### Task 3: Geometry-safe cinematic motion

**Owner:** designer for geometry, interaction, and animation as one integrated visual lane.

**Files:** create `site/src/lib/connectorGeometry.ts`, `site/src/hooks/useConnectorGeometry.ts`, `site/src/components/{CycleConnections,MotionControls}.tsx`, `site/tests/{geometry.spec.ts,motion.spec.ts,routing.spec.ts}`; modify the Task 2 components and styles.

**Interfaces:**
- `Rect = { x: number; y: number; width: number; height: number }`; `Point = { x: number; y: number }`.
- `routeCycle(cards: readonly Rect[], bounds: Rect): { forward: Point[]; correction: Point[] }` takes cycle-local measured bounds in stage order and returns gutter/exterior-rail polylines. Reserve space in CSS before routing; geometry does not move cards.
- `useConnectorGeometry` measures refs and updates routing on resize, observed card changes, and font readiness. Visible SVG and task-token animation consume the same returned paths.
- One motion preference state provides paused status and replay generation independently of disclosures. Wrap in `MotionConfig reducedMotion="user"`; explicitly disable continuous effects/parallax under `useReducedMotion()`—MotionConfig alone does not stop opacity loops.

- [ ] Write geometry tests for one/two/four-column arrangements, variable-height cards, and row transitions 04 → 05. Assert each segment avoids every card rectangle expanded by 12px, preserves order, stays inside reserved bounds, and keeps correction rails away from footer.
- [ ] Confirm failures before implementing the route function; then implement geometry and measurement, preserving simple vertical exterior routing on mobile. Run `npm --prefix site run test:unit`.
- [ ] Add Motion choreography: request-to-coordination reveal; scroll chapters; specialist fork/convergence; review/verify checkpoints; correction return; restrained atmospheric depth. Use normal scrolling and no forced wait. Avoid a speculative animation framework layer.
- [ ] Add browser tests that inspect actual measured card bounds and SVG route geometry at 320, 390, 650, 651, 768, 1024, 1050, 1280, and 1440px. Repeat after disclosure expansion and resizing; check 12px card clearance, no page overflow, and correction path separation from footer.
- [ ] Test reduced-motion with browser emulation, keyboard pause/resume, replay preserving scroll and disclosure state, and touch-sized controls. Sample stable animation progress while paused; do not rely on brittle wall-clock screenshot timing for geometry correctness.
- [ ] Run the full site build and both test projects. Review rendered desktop/mobile motion, not only fixtures. If browser installation is blocked, report it and obtain explicit user visual confirmation; do not declare rendered tests passed.

### Task 4: Site CI, controlled Pages deployment, and documentation

**Owner:** fixer after Task 3; scope excludes visual components. Parent validates CI and external-action boundaries.

**Files:** modify `.github/workflows/opencode-review.yml`; create `.github/workflows/pages.yml`; update `README.md`, `DEV-SETUP.md`; optionally create `site/README.md` for app commands only.

**Interfaces:** Consumes the committed site lockfile/scripts from prior tasks. Adds a `site` job; preserves `typecheck`, `review`, `gate`. Pages artifact path is `site/dist` and public URL is `https://daryllmagsombol.github.io/ai-workflow/`.

- [ ] Add a site PR job with Node 24, npm cache keyed by `site/package-lock.json`, `npm ci` in `site`, build/unit tests, `playwright install --with-deps chromium`, then browser tests. Keep existing config/installer/review commands intact.
- [ ] Extend `gate.needs` to include `site`; require site success (including fork PRs). No path-filtered required check may silently vanish. Leave AI-review fork behavior unchanged.
- [ ] Add Pages workflow with main push plus manual dispatch, guarded by `vars.ENABLE_SHOWCASE_PAGES == 'true'`. Build/test independently on main, then upload only `site/dist`; never download PR-origin artifacts for deployment. Deploy job uses `github-pages` environment, `pages: write`, `id-token: write`, and read-only contents. Concurrency group `pages`, `cancel-in-progress: false`. Verify supported action versions/inputs against official sources before selecting pins.
- [ ] Document the current legacy Pages source, required future switch to GitHub Actions, opt-in variable, target subpath, local commands, verification limits, and that a build is not proof of publication. Do not change Pages settings or enable the variable during implementation.
- [ ] Run `actionlint .github/workflows/*.yml`, site checks, `bash scripts/install-workflow.test.sh`, `node scripts/ci-review.test.js`, and `bun test opencode-config/skills/codemap/scripts/codemap.test.ts`. Inspect gate dependencies and ensure the deployment guard prevents accidental publishing.

### Task 5: Final integration and acceptance

**Owner:** parent orchestrator; scoped corrective edits return to the responsible specialist.

**Files:** all changes read-only unless a bounded reviewed correction is required.

- [ ] Review spec coverage, actual UI copy, final diff/lockfile, and independent implementation review; confirm no session URLs, preview files, secrets, generated artifacts, or absolute local paths are staged.
- [ ] Reuse still-valid check evidence; rerun covering checks after final changes. Confirm real subpath build, keyboard exploration, mobile rendering, reduced motion, animation controls, and connector routing.
- [ ] Present local preview and report build/tests/rendered evidence honestly. Preserve the worktree for iteration; do not merge or publish implicitly.
- [ ] Ask for the integration decision. If a PR is requested, commit/push only intended files and verify live PR checks. If deployment is separately authorized, switch Pages source/enable opt-in as approved, inspect the production Actions run, and test the public subpath/assets before declaring it published.

## Self-review

- Spec coverage: personal identity/content in Tasks 1–2; cinematic motion/connector regression in Task 3; static base/CI/Pages in Task 4; security, evidence, and integration boundaries in Task 5.
- Interfaces: one typed content source, one local-coordinate geometry function shared by paths/token, no duplicated scrolling/disclosure ownership.
- Review focus: subpath assertions Task 1/2; variable layout Task 3; pause/reduced motion Task 3; no-JS content Task 2; fork gate/deploy artifact isolation Task 4.
- Dependency order: Task 1 → Task 2 → Task 3 → Task 4 → Task 5. Repository/documentation research can run independently, but no concurrent writers may touch the same site files.
