#!/usr/bin/env bash
# Install the AI-assisted coding workflow config into a fresh machine.
# Idempotent: re-running merges directories and overwrites known files.
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

# Core config files (only those tracked in the repo)
for f in opencode.json opencode.jsonc AGENTS.md LEARNING.md tui.json; do
  if [ -f "$SRC/$f" ]; then
    cp "$SRC/$f" "$CONF_DIR/" && echo "    copied $f"
  fi
done

# oh-my-opencode-slim preset
if [ -f "$WORK_DIR/repo/oh-my-opencode-slim.json" ]; then
  cp "$WORK_DIR/repo/oh-my-opencode-slim.json" "$CONF_DIR/" \
    && echo "    copied oh-my-opencode-slim.json"
fi

# Merge directories (does not clobber existing local files in them)
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
echo "    Next: fill in your provider API key in $CONF_DIR/opencode.json"
echo "    Then run 'opencode' and confirm the orchestrator agent is available."
