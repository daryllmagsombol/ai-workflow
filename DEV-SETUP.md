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
and run the "Install script" section (the bash in the collapsible block) on this
machine. Verify each step prints success. If a step fails, stop and report the
error instead of continuing. After install, confirm `opencode --version` works
and that the `orchestrator` agent is available.
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
| `oh-my-opencode-slim.json` | `~/.config/opencode/` | repo root |
| `skills/` | `~/.config/opencode/skills/` | repo `opencode-config/skills/` |
| `plugins/rtk.ts` | `~/.config/opencode/plugins/` | repo `opencode-config/plugins/` |
| `agents/` | `~/.config/opencode/agents/` | repo `opencode-config/agents/` |

The configuration pulls two plugins from the network:

- **superpowers** — planning / TDD / debugging / review skills
- **oh-my-opencode-slim** — agent orchestration layer

Plus the `@opencode-ai/plugin` npm dependency used by the `rtk` plugin.

---

## Prerequisites

- **OpenCode** — install from https://opencode.ai (or `npm i -g opencode-ai`).
- **Node.js 20+** and a package manager (`npm` or `bun`).
- **Git** with SSH or HTTPS access to `github.com/daryllmagsombol/ai-workflow`.
- (Optional) A model provider. The default preset `opencode-go` needs an
  OpenCode Go subscription; see [Model Routing](#model-routing) to switch.

Verify the toolchain first:

```bash
opencode --version
node --version
git --version
```

---

## Install script

<details>
<summary>Expand to view / copy the full install script</summary>

```bash
#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/daryllmagsombol/ai-workflow.git"
CONF_DIR="${XDG_CONFIG_HOME:-$HOME/.config}/opencode"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

echo "==> Cloning ai-workflow"
git clone --depth 1 "$REPO" "$WORK_DIR/repo"

SRC="$WORK_DIR/repo/opencode-config"

echo "==> Creating $CONF_DIR"
mkdir -p "$CONF_DIR"

# Core config files
for f in opencode.json opencode.jsonc AGENTS.md LEARNING.md tui.json; do
  [ -f "$SRC/$f" ] && cp "$SRC/$f" "$CONF_DIR/" && echo "    copied $f"
done

# oh-my-opencode-slim preset
[ -f "$WORK_DIR/repo/oh-my-opencode-slim.json" ] \
  && cp "$WORK_DIR/repo/oh-my-opencode-slim.json" "$CONF_DIR/" \
  && echo "    copied oh-my-opencode-slim.json"

# Directories (merge, don't clobber)
for d in skills plugins agents .oh-my-opencode-slim; do
  if [ -d "$SRC/$d" ]; then
    mkdir -p "$CONF_DIR/$d"
    cp -R "$SRC/$d/." "$CONF_DIR/$d/" && echo "    merged $d/"
  fi
done

# rtk plugin dependency
echo "==> Installing @opencode-ai/plugin"
( cd "$CONF_DIR" && npm install @opencode-ai/plugin@1.15.11 --no-save --silent ) \
  && echo "    installed @opencode-ai/plugin"

echo "==> Done. Configuration installed to $CONF_DIR"
echo "    Run 'opencode' and check the orchestrator agent is available."
```

</details>

Save the script as `scripts/install-workflow.sh` in this repo so the one-liner
above works.

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
5. Launch: `opencode`.

---

## Model routing

The active preset is **`opencode-go`** (OpenCode Go subscription, flat $10/mo).
Switch presets by editing `~/.config/opencode/oh-my-opencode-slim.json` →
`"preset"`. Available presets:

| Preset | Backing provider | Notes |
|--------|------------------|-------|
| `opencode-go` | OpenCode Go | Default; paid subscription |
| `opencode-zen-free` | OpenCode free models | No cost, lower caps |
| `9router` | Local gateway (`localhost:20128`) | Self-hosted, ~40 models |
| `openai` | OpenAI | API key required |

If you use a different provider than the default, update the `provider` block in
`~/.config/opencode/opencode.json` with your own base URL and API key. **Do not
commit provider secrets** — keep them in your local config only.

---

## Per-project activation

The workflow is global, but context providers are per-project:

- **Serena (MCP)** — run `serena` init in a project to build its symbol index
  and memories (writes `.serena/`).
- **context7 / GitHub / Playwright MCPs** — already wired in `opencode.json`;
  just ensure the relevant tokens are present in your environment.
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

## Troubleshooting

- **`command not found: opencode`** — install OpenCode from https://opencode.ai.
- **Plugin fails to load** — check `npm install @opencode-ai/plugin` ran in
  `~/.config/opencode` and that network access to the plugin git URLs works.
- **No models / provider errors** — confirm your preset's provider base URL and
  API key in `opencode.json`; switch presets if you don't have the subscription.
- **Re-run safely** — the install script is idempotent; it merges rather than
  overwrites your local provider secrets.

---

## License

MIT
