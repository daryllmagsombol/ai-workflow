#!/usr/bin/env bash
# Focused regression tests for scripts/install-workflow.sh.
#
# Runs the installer against a temporary HOME with stubbed `git` and `npm` so
# no network access or real package installation happens, and never touches the
# live ~/.config/opencode.
#
# Usage: bash scripts/install-workflow.test.sh
set -uo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INSTALLER="$REPO_ROOT/scripts/install-workflow.sh"

if ! command -v node >/dev/null 2>&1; then
  echo "skip: node is required for installer JSON assertions but was not found" >&2
  exit 1
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

STUB_BIN="$TMP/bin"
FIXTURE="$TMP/fixture-repo"

pass=0
fail=0
ok()  { pass=$((pass + 1)); printf '  ok   %s\n' "$1"; }
bad() { fail=$((fail + 1)); printf '  FAIL %s\n' "$1"; }

assert_file() {
  if [ -f "$1" ]; then ok "$2"; else bad "$2 (missing: $1)"; fi
}

# ---------------------------------------------------------------------------
# Fixture repository: mirrors the tracked layout the installer expects.
# ---------------------------------------------------------------------------
mkdir -p "$FIXTURE"
cp -R "$REPO_ROOT/opencode-config" "$FIXTURE/"
cp "$REPO_ROOT/oh-my-opencode-slim.json" "$FIXTURE/"

# ---------------------------------------------------------------------------
# Stubs: intercept `git clone` (local fixture / fake vendor) and `npm`.
# ---------------------------------------------------------------------------
mkdir -p "$STUB_BIN"

cat > "$STUB_BIN/git" <<'STUB'
#!/usr/bin/env bash
# Fake `git`: supports `clone --depth 1 URL DEST` only.
set -euo pipefail
dest="${!#}"            # last argument
url="${@: -2:1}"        # second-to-last argument
[ -n "${FAKE_CLONE_LOG:-}" ] && printf '%s\n' "$url" >> "$FAKE_CLONE_LOG"
case "$url" in
  *ai-workflow*)
    mkdir -p "$dest"
    cp -R "$FAKE_REPO_SRC/." "$dest/"
    ;;
  *i-have-adhd*)
    if [ "${FAKE_IHA_FAIL:-0}" = "1" ]; then
      echo "fake git: simulated clone failure" >&2
      exit 1
    fi
    mkdir -p "$dest/.opencode/plugins"
    printf '// fake i-have-adhd plugin\n' > "$dest/.opencode/plugins/i-have-adhd.mjs"
    ;;
  *)
    echo "fake git: unexpected clone url: $url" >&2
    exit 1
    ;;
esac
STUB

cat > "$STUB_BIN/npm" <<'STUB'
#!/usr/bin/env bash
# Fake `npm`: accept any install invocation, install nothing.
exit 0
STUB

chmod +x "$STUB_BIN/git" "$STUB_BIN/npm"

# ---------------------------------------------------------------------------
# Helpers.
# ---------------------------------------------------------------------------
run_install() {
  local home="$1"
  mkdir -p "$home"
  HOME="$home" \
  XDG_CONFIG_HOME="$home/.config" \
  PATH="$STUB_BIN:$PATH" \
  FAKE_REPO_SRC="$FIXTURE" \
  FAKE_IHA_FAIL="${FAKE_IHA_FAIL:-0}" \
  FAKE_CLONE_LOG="${FAKE_CLONE_LOG:-}" \
    bash "$INSTALLER" >"$home/install.log" 2>&1
  local rc=$?
  return $rc
}

# Prints the number of times $2 appears in the "plugin" array of JSON file $1.
plugin_count() {
  node -e '
    const fs = require("node:fs");
    const [file, needle] = process.argv.slice(1);
    const json = JSON.parse(fs.readFileSync(file, "utf8"));
    const plugins = Array.isArray(json.plugin) ? json.plugin : [];
    process.stdout.write(String(plugins.filter((p) => p === needle).length));
  ' "$1" "$2"
}

conf_of() { printf '%s/.config/opencode' "$1"; }
vendor_plugin_of() { printf '%s/vendor/i-have-adhd/.opencode/plugins/i-have-adhd.mjs' "$(conf_of "$1")"; }

# ---------------------------------------------------------------------------
# Test 0: installer syntax.
# ---------------------------------------------------------------------------
echo "test: installer syntax"
if bash -n "$INSTALLER" 2>"$TMP/syntax.log"; then
  ok "bash -n scripts/install-workflow.sh"
else
  bad "bash -n scripts/install-workflow.sh: $(cat "$TMP/syntax.log")"
fi

# ---------------------------------------------------------------------------
# Test 1: fresh install.
# ---------------------------------------------------------------------------
echo "test: fresh install"
HOME1="$TMP/home-fresh"
CLONES1="$TMP/clones-fresh.log"
if FAKE_CLONE_LOG="$CLONES1" run_install "$HOME1"; then
  ok "installer exited 0"
else
  bad "installer exited non-zero (see $HOME1/install.log)"
fi

CONF1="$(conf_of "$HOME1")"
assert_file "$CONF1/opencode.json" "opencode.json installed"
assert_file "$CONF1/opencode.jsonc" "opencode.jsonc installed"
assert_file "$CONF1/AGENTS.md" "AGENTS.md installed"
assert_file "$CONF1/LEARNING.md" "LEARNING.md installed"
assert_file "$CONF1/tui.json" "tui.json installed"
assert_file "$CONF1/oh-my-opencode-slim.json" "oh-my-opencode-slim.json installed"
assert_file "$CONF1/skills/context7-mcp/SKILL.md" "context7-mcp skill installed"
assert_file "$(vendor_plugin_of "$HOME1")" "i-have-adhd plugin vendored"

want1="$(vendor_plugin_of "$HOME1")"
got1="$(plugin_count "$CONF1/opencode.json" "$want1")"
if [ "$got1" = "1" ]; then
  ok "i-have-adhd plugin wired into opencode.json"
else
  bad "i-have-adhd plugin wired into opencode.json (count=$got1)"
fi

# The wired entry must be an absolute path (portable across HOME locations).
case "$want1" in
  /*) ok "wired plugin path is absolute" ;;
  *)  bad "wired plugin path is not absolute: $want1" ;;
esac

# i-have-adhd must be cloned from the correct upstream.
if grep -q '^https://github.com/ayghri/i-have-adhd\.git$' "$CLONES1" 2>/dev/null; then
  ok "i-have-adhd cloned from ayghri upstream"
else
  bad "i-have-adhd clone URL missing/wrong (see $CLONES1)"
fi
if grep -q 'anthropics/i-have-adhd' "$CLONES1" 2>/dev/null; then
  bad "stale anthropics/i-have-adhd upstream still used"
else
  ok "stale anthropics upstream not used"
fi

# ---------------------------------------------------------------------------
# Test 2: repeat install is idempotent.
# ---------------------------------------------------------------------------
echo "test: repeat install idempotency"
if run_install "$HOME1"; then
  ok "second install exited 0"
else
  bad "second install exited non-zero (see $HOME1/install.log)"
fi
got2="$(plugin_count "$CONF1/opencode.json" "$want1")"
if [ "$got2" = "1" ]; then
  ok "plugin entry not duplicated on re-run"
else
  bad "plugin entry duplicated on re-run (count=$got2)"
fi
assert_file "$CONF1/skills/context7-mcp/SKILL.md" "context7-mcp skill survives re-run"

# ---------------------------------------------------------------------------
# Test 3: unrelated existing files are preserved.
# ---------------------------------------------------------------------------
echo "test: preserve unrelated target files"
HOME3="$TMP/home-preserve"
CONF3="$(conf_of "$HOME3")"
mkdir -p "$CONF3/skills/local-only" "$CONF3/plugins"
printf 'local\n' > "$CONF3/skills/local-only/SKILL.md"
printf '// my local plugin\n' > "$CONF3/plugins/local-plugin.ts"
printf 'notes\n' > "$CONF3/local-notes.md"

if run_install "$HOME3"; then
  ok "install over existing tree exited 0"
else
  bad "install over existing tree exited non-zero (see $HOME3/install.log)"
fi
assert_file "$CONF3/skills/local-only/SKILL.md" "unrelated skill preserved"
assert_file "$CONF3/plugins/local-plugin.ts" "unrelated plugin preserved"
assert_file "$CONF3/local-notes.md" "unrelated root file preserved"
assert_file "$CONF3/skills/context7-mcp/SKILL.md" "managed skill still installed"

# ---------------------------------------------------------------------------
# Test 4: no plugin wiring when the vendored plugin is unavailable.
# ---------------------------------------------------------------------------
echo "test: no wiring when vendor plugin missing"
HOME4="$TMP/home-no-vendor"
if FAKE_IHA_FAIL=1 run_install "$HOME4"; then
  ok "optional vendor clone failure is non-fatal (installer exited 0)"
else
  bad "optional vendor clone failure aborted the installer (see $HOME4/install.log)"
fi
CONF4="$(conf_of "$HOME4")"
if [ -f "$(vendor_plugin_of "$HOME4")" ]; then
  bad "vendor plugin unexpectedly present"
else
  ok "vendor plugin correctly absent on clone failure"
fi
want4="$(vendor_plugin_of "$HOME4")"
got4="$(plugin_count "$CONF4/opencode.json" "$want4")"
if [ "$got4" = "0" ]; then
  ok "no plugin wired without vendor file"
else
  bad "unexpected plugin wiring without vendor file (count=$got4)"
fi

# ---------------------------------------------------------------------------
# Summary.
# ---------------------------------------------------------------------------
echo
echo "passed: $pass   failed: $fail"
[ "$fail" -eq 0 ]
