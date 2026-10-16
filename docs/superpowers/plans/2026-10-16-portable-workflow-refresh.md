# Portable Workflow Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring this repository up to date with the user's local AI workflow while keeping the published setup portable and safe.

**Architecture:** Preserve the existing configuration mirror and repo-to-machine installer. Sync authored sources, normalize machine-specific configuration, and describe externally managed dependencies rather than vendoring them.

**Tech Stack:** OpenCode configuration, oh-my-opencode-slim presets, Markdown, Bash, JavaScript/TypeScript plugins.

**Spec:** User-approved scope in this conversation: refresh portable configuration, policies, lessons, plugins, README, setup guide, and installer; exclude credentials, backups, session data, generated dependencies, and absolute machine paths. Leave live configuration untouched. Preserve existing skill snapshots unless compatibility requires a change.

## Global Constraints

- Change repository files only; do not run installation against the real home directory.
- Never copy credential stores, session data, vendor directories, node_modules, backups, or lock directories.
- Preserve environment-variable secret references; never publish literal secret values.
- Keep existing architecture and unrelated files, including the untracked `.opencode/` workspace.
- Do not commit or push.
- One writer per file; dependent documentation work follows config and installer decisions.

## Review Focus

- Absolute paths: snapshots and setup instructions must work for users with a different home directory.
- Existing installs: installer tests must prove unrelated files and user data are preserved.
- Fresh installs: required external plugins and skills must have explicit setup instructions rather than silently broken paths.
- Repeated installs: installer must remain idempotent in a temporary HOME.
- Missing providers or optional tooling: document requirements without promising unverified automatic setup.

---

### Task 1: Refresh portable configuration snapshots

**Files:** root `oh-my-opencode-slim.json`; `opencode-config/{AGENTS.md,LEARNING.md,opencode.json,opencode.jsonc,tui.json}`; `opencode-config/plugins/{rtk.ts,commandcode-model-sync.js}`. Add the authored `context7-mcp` skill only if its portable installation fits the existing layout; otherwise document its source.

**Interfaces:** Consumes local authored files under `~/.config/opencode/` and `~/.agents/skills/context7-mcp/`; produces sanitized repository snapshots and a concise list of installer requirements.

- [ ] Compare each candidate source with the tracked snapshot; retain unchanged files unchanged.
- [ ] Sync changed authored content, loading applicable configuration and agent-writing skills first.
- [ ] Remove machine-specific companion binary overrides; make the vendored plugin dependency portable using supported configuration or explicit installer wiring, not an invented path expansion.
- [ ] Validate JSON and plugin JavaScript syntax; scan the changed files for secrets and absolute user paths.
- [ ] Report all changed paths, deliberate normalizations, and required external dependencies to the installer lane.

### Task 2: Align installation and documentation

**Files:** `scripts/install-workflow.sh`, `README.md`, `DEV-SETUP.md`; a focused shell test under `scripts/` if installer behavior changes.

**Interfaces:** Consumes Task 1's final snapshots and requirements; produces a coherent portable install and matching workflow documentation.

- [ ] Inspect existing installation behavior and add a regression test for any portability change before implementing it.
- [ ] Update only necessary installer behavior. Keep optional external assets explicit, preserve unrelated target files, and avoid copying generated manifests as though they install dependencies.
- [ ] Update documentation for the active preset, specialist roles, workflow gates, plugins, external skill sources, provider setup, and environment references using verified source evidence.
- [ ] Keep any embedded installer instructions consistent with the actual script; remove stale duplication only where needed for accuracy.
- [ ] Run `bash -n scripts/install-workflow.sh` and the focused installer tests in isolated temporary directories, including fresh, repeat, and existing-file-preservation cases.

### Task 3: Final reconciliation and validation

**Files:** All changed files, read-only validation unless a bounded correction is needed.

**Interfaces:** Consumes the completed writer results; produces a verified diff and concise completion report.

- [ ] Inspect final git status and diff; confirm `.opencode/`, legacy agents, and unrelated CI files are untouched.
- [ ] Parse all changed JSON, check changed plugin syntax, and rerun relevant installer checks if their final inputs changed.
- [ ] Verify documentation matches the final preset and dependency installation behavior.
- [ ] Scan changed content for credentials and machine-specific paths; distinguish documentation examples from operational absolute paths.
- [ ] Report changed scope, commands actually run, and any remaining optional setup or unresolved limitations. Do not claim live installation was tested.

## Execution notes

- Task 1 snapshot review: spec compliance and quality passed; managed snapshots remain unchanged. A trailing-whitespace cleanup is queued.
- Ruling: omit the invalid `small_model: "mimo-v2.6-free"` override from the portable snapshot, restoring OpenCode's documented automatic selection instead of guessing a replacement. Official config documentation requires `provider/model`; research also found no matching catalog ID. Cost if wrong: the portable install uses automatic selection rather than the user's intended explicit small model. Live configuration remains unchanged. Sources: https://opencode.ai/docs/config/ and https://models.dev/api.json (checked 2026-10-16).
- Documentation follow-up complete: automatic small-model selection and the deliberate difference from live configuration are documented.
- Task 1: complete; portable snapshots reviewed for spec compliance, quality, and sensitive paths. Existing managed skill snapshots preserved.
- Task 2: complete; installer and documentation aligned. Final review corrected overwrite-safety guidance and added an explicit optional-clone-failure success assertion.
- Task 3: complete; final review approved spec compliance and quality. Final installer run: 25 passed, 0 failed; ShellCheck and diff whitespace checks clean. JSON parsing and plugin JavaScript syntax checks passed. Tests used a temporary HOME and stubbed network tools, not a real installation.
- Final state: uncommitted repository edits only; live configuration and pre-existing `.opencode/` untouched. All implementation and validation steps above are complete; checklists are retained as the original execution brief.
