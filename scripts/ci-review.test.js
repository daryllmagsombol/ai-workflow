#!/usr/bin/env node
"use strict";

// Focused regression tests for scripts/ci-review.js.
// Usage: node scripts/ci-review.test.js

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const HELPER = path.join(__dirname, "ci-review.js");
const FOOTER = "[github run](/owner/repo/actions/runs/999)";

let passed = 0;
let failed = 0;

function comment(id, body, options = {}) {
  return {
    id,
    created_at: `2026-10-16T12:00:${String(id % 60).padStart(2, "0")}Z`,
    user: {
      id: options.userId ?? 41898282,
      login: options.login ?? "github-actions[bot]",
      type: options.type ?? "Bot",
    },
    body,
  };
}

function run(comments, env = {}) {
  return spawnSync(process.execPath, [HELPER], {
    input: JSON.stringify(comments),
    encoding: "utf8",
    env: {
      ...process.env,
      EXPECTED_FOOTER: FOOTER,
      BASELINE_ID: "0",
      BOT_ID: "41898282",
      ...env,
    },
  });
}

function check(name, result, wantCode, wantOut) {
  const codeOk = result.status === wantCode;
  const outOk = wantOut === undefined || result.stdout.trim() === wantOut;
  if (codeOk && outOk) {
    passed += 1;
    console.log(`  ok   ${name}`);
  } else {
    failed += 1;
    console.log(
      `  FAIL ${name}: code=${result.status} stdout=${JSON.stringify(
        result.stdout.trim(),
      )} stderr=${JSON.stringify(result.stderr.trim())}`,
    );
  }
}

// Body layout mirrors the action: model response (ending in the verdict), then
// the appended footer.
const pass = `Looks good.\n\nVERDICT: PASS\n\n${FOOTER}`;
const fail = `Found a bug.\n\nVERDICT: FAIL\n\n${FOOTER}`;

console.log("test: valid verdicts");
check("valid PASS accepted", run([comment(20, pass)]), 0, "PASS");
check("valid FAIL accepted", run([comment(21, fail)]), 0, "FAIL");

console.log("test: identity spoofing is rejected");
check(
  "spoofed bot id ignored",
  run([comment(30, pass, { userId: 123, login: "github-actions[bot]" })]),
  2,
);
check("non-Bot user type ignored", run([comment(31, pass, { type: "User" })]), 2);

console.log("test: wrong run footer is rejected");
check(
  "footer for a different run ignored",
  run([comment(40, `Looks good.\n\nVERDICT: PASS\n\n[github run](/owner/repo/actions/runs/111)`)]),
  2,
);

console.log("test: stale baseline is rejected");
check("comment at/below baseline ignored", run([comment(5, pass)], { BASELINE_ID: "5" }), 2);
check(
  "newest matching comment wins",
  run([comment(50, pass), comment(51, fail)], { BASELINE_ID: "49" }),
  0,
  "FAIL",
);

console.log("test: malformed or ambiguous verdicts fail closed");
check("negated verdict rejected", run([comment(60, `Not a problem.\n\nNOT VERDICT: PASS\n\n${FOOTER}`)]), 1);
check("PASSING rejected", run([comment(61, `Done.\n\nVERDICT: PASSING\n\n${FOOTER}`)]), 1);
check("duplicate declarations rejected", run([comment(62, `A.\n\nVERDICT: PASS\nVERDICT: FAIL\n\n${FOOTER}`)]), 1);
check("quoted verdict rejected", run([comment(63, `A.\n\n"VERDICT: PASS"\n\n${FOOTER}`)]), 1);
check("missing verdict rejected", run([comment(64, `LGTM\n\n${FOOTER}`)]), 1);
check("trailing prose after verdict rejected", run([comment(65, `A.\n\nVERDICT: PASS\nThanks!\n\n${FOOTER}`)]), 1);
check("lowercase verdict rejected", run([comment(66, `A.\n\nverdict: pass\n\n${FOOTER}`)]), 1);

console.log("test: paginated (array-of-pages) input");
check("accepts gh --slurp pages", run([[comment(70, pass)]], { BASELINE_ID: "60" }), 0, "PASS");

console.log("");
console.log(`passed: ${passed}   failed: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
