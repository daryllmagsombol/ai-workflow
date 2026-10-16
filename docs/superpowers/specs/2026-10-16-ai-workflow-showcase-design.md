# Personal AI Workflow Showcase — Design

## Intent

Create a personal engineering showcase hosted on GitHub Pages, using React, Tailwind CSS, and Motion. Explain to clients, companies, and developers how the author performs software engineering tasks with AI. The main takeaway is the AI workflow cycle, not a catalog of tools or a claim of autonomous delivery.

## Confirmed decisions

- Personal showcase rather than a standalone workflow product.
- Professional title: **Software Engineer**.
- Visual direction A: cinematic dark orchestration map.
- Stronger, cinematic animation with chapter transitions, parallel-work choreography, checkpoints, and correction loops.
- Mobile-first, responsive presentation.
- Guided illustrative task: **Add search and filters to an existing application**.
- Visitors can open stage details and explore out of sequence instead of being forced through the walkthrough.
- Production animation library: **Motion**, from https://motion.dev/.
- Connector routing must not cross stage cards. The user confirmed the corrected preview looks right in their browser.

## Design reference

The latest approved-routing concept is the local throwaway preview:

`.superpowers/brainstorm/57222-1792156470/content/orchestration-cinematic-routing.html`

Earlier previews are explorations, not competing specifications. The local preview is a visual reference, not production architecture or code that must be copied literally. Its session URL/key must not be published. Carry the intended hierarchy, atmosphere, choreography, and corrected routing into React; do not flatten it into generic cards.

The author confirmed the routing visually. Automated rendered-browser validation of the preview was blocked by missing Chrome; geometry fixtures and interaction smoke checks are not equivalent to rendered verification. Production implementation still requires runtime responsive and interaction checks.

## Author-proposed defaults, not user-provided identity facts

- Use public GitHub handle **daryllmagsombol** as the byline until the owner supplies a display name.
- Hero heading: **How I build software with AI.**
- Main action: **Explore my workflow** (in-page navigation).
- Supporting action: **View the repository**.
- Footer/profile action links to the existing public GitHub profile. No invented email address, contact form, scheduling integration, social profiles, or client identity.
- Use Vite for a static React build unless repository inspection reveals a better existing application foundation. Exact dependency versions and package manager belong to implementation planning, after checking repository conventions and current official documentation.
- Add a clearly separated site directory rather than turning workflow configuration snapshots into application source. Final directory and build commands belong to the implementation plan.
- The normal GitHub project-site target is this repository's `/ai-workflow/` base path. No custom domain is assumed.

## Content and page structure

### 1. Personal introduction / opening scene

Show the byline, Software Engineer title, short hero heading, and one plain-language description: AI supports investigation, specialist execution, review, and verification while the engineer remains responsible for decisions. Do not promise error-free output, faster delivery percentages, or universal applicability.

An opening task/request leads into human-led coordination and evidence. Preserve legible content while the scene animates; visitors should not need to wait for the intro to finish to navigate.

### 2. The workflow cycle

Present the repo-grounded sequence:

**Understand → Inspect → Plan → Research when needed → Delegate when useful → Implement → Review → Verify**

Explain that this is an adaptable cycle, not a mandatory heavyweight ceremony for every small change. Simple tasks take a lighter path. Research and delegation happen when useful. Failed review or verification returns work to the responsible earlier stage. Verified work still receives human review/approval before shipping.

The sequence is the primary navigation for the walkthrough. Desktop can use a connected map; mobile becomes a readable vertical sequence. Stage numbers and labels communicate order without depending on animation or color.

### 3. Follow an illustrative task

Use search and filters throughout. Clearly label it as an **illustrative walkthrough**, not a real client case study or a claim of a deployed feature.

Each stage has a short visible explanation and an accessible expandable detail section with:

- **What happens**
- **Why it matters**
- **Illustrative output**

Example outputs are conceptual artifacts such as agreed search behavior, identified existing components, a bounded plan, delegated scopes, a patch, review findings, or test evidence. Never present simulated tests, progress, or findings as actual live results.

Support jump navigation and open/close stage exploration. Opening multiple stages must remain usable and must not break connector geometry or trap the reader in a scroll sequence.

### 4. Inside delegation

Expand the specialist lanes within the delegation stage rather than overwhelming the first screen. Ground roles in the repository:

- Orchestrator: plan, coordinate, reconcile, verify.
- Explorer: locate relevant repository evidence.
- Librarian: research current documentation and APIs.
- Designer: own interface and interaction quality.
- Fixer: implement bounded changes.
- Oracle: advise on architecture, risk, and difficult problems.
- Observer: analyze visual material when needed.

Show that independent lanes can proceed in parallel, with explicit ownership and reconciliation before dependent work. Do not imply every agent participates in every task. Avoid making transient model identifiers the main story; link to configuration for exact current routing.

### 5. Review, verification, and correction

Make review and verification distinct checkpoints. Illustrate a finding returning to implementation/investigation and then passing through review and tests again. Evidence can include configuration parsing, focused regression tests, build/type/lint checks where applicable, and rendered UI verification—not a claim that every repository uses identical commands.

Maintain a visible distinction between illustrative walkthrough outcomes and actual linked repository evidence.

### 6. Repository evidence and closing

Link to the real README, setup guide, agent/preset configuration, and CI workflow/checks. Prefer stable repository links over hardcoding a passing badge for a historical run. The site must not claim a current CI status without a real maintained data source.

Close with GitHub/profile and repository actions. No unrequested lead-generation form, analytics, backend, or authentication.

## Visual and motion system

- Dark cinematic atmosphere, strong readable typography, directional light, restrained depth, clear spatial hierarchy.
- Motion explains transitions: request enters coordination; delegation forks and converges; checkpoints assess; corrections return; verification leads to human approval.
- Use Motion for React choreography, scroll-triggered/linked effects, transitions, and expandable layout changes. Use Tailwind for styling and CSS for simpler effects. Do not add a second animation framework by default.
- Preserve normal page scrolling. No scroll hijacking, mandatory timed playback, or animation that blocks reading/navigation.
- Pause/resume continuous decorative motion and replay the illustrative flow without resetting the reader's place or closing details.
- Honor reduced-motion preferences: remove continuous travel/parallax and unnecessary movement while retaining order, meaning, and all content.
- Simplify mobile motion and scene composition; do not shrink a desktop diagram until labels become unreadable.
- Avoid fabricating dashboards, cost charts, telemetry, client logos, performance metrics, or testimonials.

## Connector acceptance criteria

- All paths and moving effects remain outside stage-card interiors and controls, with sufficient clearance for their glow.
- Reserve real gutters and outer rails; do not hide intersections using z-index coverups.
- Forward connectors preserve the actual stage order across wrapped rows, including 04 → 05.
- Correction routes stay outside the card grid and do not cross footer content.
- The visible connector and moving token share the same measured geometry.
- Recompute geometry when viewport, card sizes, font layout, or detail expansion affects it.
- At narrow widths use a simplified exterior vertical rail rather than a crowded wrapped route.

## Accessibility, responsiveness, and performance

- Semantic headings, navigation, links, and buttons; accessible expandable sections and visible keyboard focus.
- Touch-friendly controls; no hover-only information or color-only meaning.
- Readable contrast and body text. Decorative graphics should not clutter screen-reader output.
- Full content remains available without animation; avoid blank hidden sections when enhancement fails.
- No horizontal page overflow at narrow mobile widths. Test mobile, intermediate/tablet, and desktop layouts, including variable-height stage content.
- Prefer transform/opacity animation and efficient geometry updates; avoid heavy 3D/video dependencies unless separately justified and approved.
- Test pause/resume, replay, stage navigation, expansion, keyboard operation, reduced motion, and resize routing in a real browser when available. If unavailable, disclose the blocker and obtain explicit human visual confirmation rather than calling fixture checks rendered proof.

## Delivery boundaries

- Build a static site compatible with GitHub Pages, including correct project base-path assets and navigation.
- Add appropriate site build/test and Pages deployment validation without breaking the repository's existing config/installer tests or AI-review gate.
- Never expose local configuration secrets, personal absolute paths, companion session keys, or private metadata.
- Existing workflow configuration remains a separate artifact and should not be changed incidentally for site implementation.
- Publishing may require repository Pages settings or environment permissions; inspect actual settings during implementation and request manual approval where necessary. Do not claim deployment merely because a build succeeds.
- Do not merge the existing PR or publish site changes without an explicit integration decision. This design approval authorizes planning, not an automatic production deployment.

## Non-goals

No full documentation portal, live orchestration system, AI chat assistant, model-cost dashboard, fabricated portfolio projects, CMS, backend, login, contact form, or external skill installer.

## Builder-owned details

After design approval, the implementation plan chooses exact file structure, dependencies/versions, package manager, animation component boundaries, test commands, branch/PR isolation, and GitHub Pages workflow based on repository evidence. These choices must preserve the visual reference and acceptance criteria above.
