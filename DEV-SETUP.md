# DEV-SETUP.md

One-command setup for the AI-assisted coding workflow documented in
[`README.md`](README.md). This installs the OpenCode configuration (plugins,
agents, skills, MCPs, and provider setup) into a fresh machine.

---

## ⚡ Copy this to your coding harness to install automatically

Paste the block below into any OpenCode / Claude / ChatGPT-style coding agent.
It reads this file and executes the setup for you.

```text
Read https://raw.githubusercontent.com/daryllmagsombol/ai-workflow/main/DEV-SETUP.md
and run the canonical installer at
https://raw.githubusercontent.com/daryllmagsombol/ai-workflow/main/scripts/install-workflow.sh
on this machine. Verify each step prints success. If a step fails, stop and
report the error instead of continuing. After install, confirm `opencode --version`
works and that the `orchestrator` agent is available.
```

If your harness supports it, the equivalent one-liner (after cloning) is:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/daryllmagsombol/ai-workflow/main/scripts/install-workflow.sh)
```

> The install script lives in [`scripts/install-workflow.sh`](scripts/install-workflow.sh).
> It is idempotent — re-running it is safe.

---

## What gets installed

| Artifact | Destination | Source in repo |
|----------|-------------|----------------|
| `opencode.json` / `opencode.jsonc` | `~/.config/opencode/` | repo `opencode-config/` |
| `AGENTS.md`, `LEARNING.md` | `~/.config/opencode/` | repo `opencode-config/` |
| `tui.json` | `~/.config/opencode/` | repo `opencode-config/` |
| `oh-my-opencode-slim.json` | `~/.config/opencode/` | repo root |
| `skills/` | `~/.config/opencode/skills/` | repo `opencode-config/skills/` |
| `plugins/` | `~/.config/opencode/plugins/` | repo `opencode-config/plugins/` |

The installer also vendors `i-have-adhd` (from its [upstream repo](https://github.com/ayghri/i-have-adhd)) and, when the plugin file is present, appends its absolute path to the installed `~/.config/opencode/opencode.json`. This wiring is idempotent and skipped if the optional clone fails — nothing else in your config is touched.

The configuration pulls plugins from the network:

- **superpowers** — planning / TDD / debugging / review skills
- **oh-my-opencode-slim** — agent orchestration layer
- **opencode-cmd-provider** — command provider plugin
- **i-have-adhd** — ADHD-friendly output shaping (vendored to `vendor/`, then wired into `opencode.json`)

Plus the `@opencode-ai/plugin` npm dependency used by the local `rtk` plugin. The authored `context7-mcp` skill ships in `opencode-config/skills/` and is installed with the other repo skills; if you also keep a personal copy under `~/.agents/skills/`, that root is already supported by OpenCode, so no duplication is required.

---

## Prerequisites

- **OpenCode** — install from https://opencode.ai (or `npm i -g opencode-ai`).
- **Node.js 20+** and a package manager (`npm` or `bun`).
- **Git** with SSH or HTTPS access to `github.com/daryllmagsombol/ai-workflow`.
- (Optional) Model provider credentials. The default preset
  `openai-mixed-optimized` uses OpenAI models for reasoning and CommandCode
  models for fast work, so it needs **both** providers configured. See
  [Model routing](#model-routing) to switch presets.

Verify the toolchain first:

```bash
opencode --version
node --version
git --version
```

---

## Install script

The canonical installer is [`scripts/install-workflow.sh`](scripts/install-workflow.sh).
Read it there rather than copying a frozen snapshot here, so fixes — the
`i-have-adhd` upstream URL, vendored-plugin wiring, merge behavior, and the
`@opencode-ai/plugin` dependency step — stay in sync. Both one-liners above
invoke that script directly.

It is idempotent: re-running merges directories and appends the `i-have-adhd`
plugin entry at most once.

**Managed files are overwritten.** Each run copies these tracked files over
whatever is already in `~/.config/opencode/`:

- `opencode.json`, `opencode.jsonc`, `AGENTS.md`, `LEARNING.md`, `tui.json`
- `oh-my-opencode-slim.json`

Everything else is preserved: the `skills/`, `plugins/`, `.oh-my-opencode-slim/`,
and `vendor/` directories are merged, so unrelated files you added (extra skills,
plugins, notes) stay in place. If you have customized any managed file — above
all local provider settings in `opencode.json` — **back it up first**:

```bash
cp -R ~/.config/opencode ~/.config/opencode.bak-$(date +%Y%m%d)
```

The installer has focused regression tests that stub `git`/`npm` and run against
a temporary `HOME` (no network, never touching your real config):

```bash
bash scripts/install-workflow.test.sh
```

---

## Manual setup (if you prefer)

1. Clone and inspect:
   ```bash
   git clone https://github.com/daryllmagsombol/ai-workflow.git
   cd ai-workflow
   ```
2. Copy the `opencode-config/` tree into `~/.config/opencode/` (see table above).
3. Copy `oh-my-opencode-slim.json` to `~/.config/opencode/`.
4. Install the plugin dependency:
   ```bash
   cd ~/.config/opencode && npm install @opencode-ai/plugin@1.15.11
   ```
5. (Optional) Vendor the `i-have-adhd` plugin and wire it in. The installer does
   this automatically; manually it is:
   ```bash
   git clone --depth 1 https://github.com/ayghri/i-have-adhd.git \
     ~/.config/opencode/vendor/i-have-adhd
   ```
   then add `~/.config/opencode/vendor/i-have-adhd/.opencode/plugins/i-have-adhd.mjs`
   to the `plugin` array in `~/.config/opencode/opencode.json`. Skip it and the
   rest of the workflow still works.
6. Launch: `opencode`.

---

## Model routing

The active preset is **`openai-mixed-optimized`** — OpenAI models for
reasoning-heavy agents and CommandCode models for fast, high-volume work, so it
requires credentials for **both** providers. Switch presets by editing the
top-level `"preset"` key in `~/.config/opencode/oh-my-opencode-slim.json`.
Available presets:

| Preset | Backing provider(s) | Notes |
|--------|---------------------|-------|
| `openai-mixed-optimized` | OpenAI + CommandCode | Default; OpenAI reasoning + CommandCode fast models |
| `openai` | OpenAI | All agents on OpenAI models |
| `cmc` | CommandCode | All agents on CommandCode models |
| `cmc-mimo` | CommandCode | CommandCode MiMo variants |
| `opencode-go` | OpenCode Go | Paid OpenCode Go subscription |
| `opencode-zen-free` | OpenCode free models | No cost, lower caps |

Model IDs in a preset only resolve through a provider you have configured — e.g.
`openai/*` needs OpenAI and `commandcode/*` needs CommandCode. The snapshot ships
`opencode.jsonc` with `small_model` deliberately unset, so OpenCode chooses a
cheaper model automatically (falling back when none is available) rather than the
repo inventing an unqualified model ID. (That describes the repository snapshot;
it is not a statement about what the installer writes to your machine — see
[Install script](#install-script).) Update the provider block in
`~/.config/opencode/opencode.json` with your own base URL and API key for
whichever providers you use. **Do not commit provider secrets** — keep them in
your local config only.

---

## Per-project activation

The workflow is global, but context providers are per-project:

- **Serena (MCP)** — run `serena` init in a project to build its symbol index
  and memories (writes `.serena/`).
- **context7** — set `CONTEXT7_API_KEY` in your environment:
  ```bash
  export CONTEXT7_API_KEY="your-api-key-here"
  ```
- **GitHub** — set `GITHUB_PERSONAL_ACCESS_TOKEN` if you need GitHub MCP.
- **Stitch** — set `STITCH_API_KEY` if you need Stitch MCP.
- **Project `AGENTS.md`** — drop a project-specific `AGENTS.md` in any repo to
  scope quality gates and instructions (see `pprcv-poc` for an example).

---

## Verify

```bash
opencode --version
# Inside opencode, confirm the orchestrator agent is listed:
#   /agents
```

You should see `orchestrator`, `explorer`, `librarian`, `oracle`, `designer`,
`fixer`, and `observer` available.

---

## CI

[`.github/workflows/opencode-review.yml`](.github/workflows/opencode-review.yml)
(`PR Checks`) runs on pull requests:

- **Config & installer validation** (job and check-run name `typecheck`, kept for
  branch-protection compatibility): parses the tracked JSON (`opencode.json`,
  `opencode.jsonc`, `tui.json`, `oh-my-opencode-slim.json`), runs `node --check`
  on `opencode-config/plugins/commandcode-model-sync.js`, runs `bash -n` +
  ShellCheck on both `scripts/*.sh`, runs the installer regression suite, runs
  the CI-review helper tests, and runs the codemap skill tests under Bun.
- **AI review** (non-fork PRs only): the `anomalyco/opencode/github` action posts
  its findings as a PR comment ending with an exact `VERDICT: PASS` or
  `VERDICT: FAIL` line. `OPENCODE_API_KEY` is **optional** — the free model used
  here works without it. The `gate` job fails on `FAIL` and fails closed if the
  review cannot run (stale PR head, failed/cancelled action, or a missing,
  malformed, or ambiguous verdict).
- **Showcase site** (job and check-run name `site`): builds and tests the
  [`site/`](site) app on every PR, including fork PRs — `npm ci` with the
  committed lockfile, `npm run build`, `npm run test:unit`, a package-owned
  `playwright install --with-deps chromium`, then `npm run test:e2e`. It uses no
  secrets, so it runs for forks too.

The `gate` job requires the validation job and the site job to succeed and the
AI review to complete successfully (or be skipped on fork PRs) before reporting
all clear.

### Showcase site (optional)

The site is a static React/Vite/Tailwind/Motion build under `site/`. Run it
locally:

```bash
cd site
npm ci
npm run build          # tsc -b && vite build && prerender
npm run test:unit      # content/geometry unit project
npx playwright install --with-deps chromium   # package-owned browser; never system Chrome
npm run test:e2e       # browser project against the built site
```

Browser tests use the Playwright-managed Chromium declared by the package, so no
system Chrome is required. CI builds and tests the site on every pull request (the
`site` job above).

**Deployment is opt-in and separate from building.** The target public URL is
**https://daryllmagsombol.github.io/ai-workflow/** (project subpath `/ai-workflow/`).
[`.github/workflows/pages.yml`](.github/workflows/pages.yml) builds and retests the
site on pushes to `main` and on manual dispatch, but its jobs only run when the
repository variable `ENABLE_SHOWCASE_PAGES` is `true` **and** the run ref is
`main` (when dispatching manually, select the `main` branch — a tag or other
branch is rejected by the job guards):

| Kind | Name | Notes |
|------|------|-------|
| Variable | `ENABLE_SHOWCASE_PAGES` | Set to `true` to enable the Pages build/deploy |

The workflow uploads only the freshly built `site/dist` from the pushed `main`
commit; it never deploys pull-request artifacts and never runs on pull requests.
The repository's Pages source is currently the **legacy branch source**, not
GitHub Actions. Switching the Pages source to GitHub Actions is a deliberate,
separately authorized settings change and is **not** performed by this
repository's code. A green build or CI run is not proof of publication — after an
authorized deploy, verify the live subpath and its assets directly.

### Optional: SonarQube

[`.github/workflows/sonarqube.yml`](.github/workflows/sonarqube.yml) is opt-in.
It runs on pushes to `main` / `feature/**` and on manual dispatch, but only when
the repository variable `ENABLE_SONARQUBE` is `true`. Configure in
**Settings → Secrets and variables → Actions**:

| Kind | Name | Notes |
|------|------|-------|
| Variable | `ENABLE_SONARQUBE` | Set to `true` to enable the scan |
| Variable | `SONAR_PROJECT_KEY` | SonarQube project key |
| Secret | `SONAR_HOST_URL` | URL of your SonarQube server |
| Secret | `SONAR_TOKEN` | Analysis token |

No secret values are committed; set them in repository settings only.

---

## Troubleshooting

- **`command not found: opencode`** — install OpenCode from https://opencode.ai.
- **Plugin fails to load** — check `npm install @opencode-ai/plugin` ran in
  `~/.config/opencode` and that network access to the plugin git URLs works.
- **No models / provider errors** — the default preset needs both OpenAI and
  CommandCode configured. Confirm the provider base URL and API key in
  `opencode.json`, or switch to a preset whose providers you have.
- **Re-run safely** — the installer is idempotent, but it *does* overwrite the
  managed files listed under [Install script](#install-script) (including
  `opencode.json`). Back up `~/.config/opencode/` and re-apply your local provider
  settings if you re-run it.

---

## License

MIT
