#!/usr/bin/env node
"use strict";

// Select and validate the OpenCode GitHub Action review comment for the
// current run, then extract an exact verdict from it.
//
// Input: GitHub issue-comments JSON on stdin. Accepts either a flat array or
//        the array-of-pages produced by `gh api --paginate --slurp`.
//
// Environment:
//   BASELINE_ID     only accept comments with id > BASELINE_ID (default 0)
//   EXPECTED_FOOTER exact footer URL for this run; by default the action emits
//                   "[github run](/<owner>/<repo>/actions/runs/<run_id>)"
//   BOT_ID          trusted bot user id (default 41898282)
//
// A comment is accepted only when ALL hold:
//   - id > BASELINE_ID
//   - user.id === BOT_ID and user.type === "Bot"
//   - body contains the exact EXPECTED_FOOTER for this run
//
// After removing the verified footer, the final non-blank line of the remaining
// body must be EXACTLY "VERDICT: PASS" or "VERDICT: FAIL". There must be exactly
// one "VERDICT:" declaration. Anything else is rejected (fail closed).
//
// Exit codes:
//   0  accepted -> prints PASS or FAIL on stdout
//   2  no matching comment yet (retryable)
//   1  matched a comment but the verdict is missing/malformed/ambiguous

const BOT_TYPE = "Bot";
const VALID_VERDICTS = new Set(["VERDICT: PASS", "VERDICT: FAIL"]);

function reject(message) {
  process.stderr.write(message + "\n");
  process.exit(1);
}

function readStdin() {
  return new Promise((resolve, rejectRead) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", rejectRead);
  });
}

function normalizeComments(raw) {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.flatMap((page) => (Array.isArray(page) ? page : [page]));
}

async function main() {
  const baseline = Number.parseInt(process.env.BASELINE_ID ?? "0", 10) || 0;
  const botId = Number.parseInt(process.env.BOT_ID ?? "41898282", 10);
  const footer = process.env.EXPECTED_FOOTER ?? "";
  if (!footer) reject("EXPECTED_FOOTER is required");

  let comments;
  try {
    comments = normalizeComments(await readStdin());
  } catch (error) {
    reject(`could not parse comments JSON: ${error.message}`);
  }

  const candidates = comments
    .filter((comment) => comment && typeof comment.id === "number" && comment.id > baseline)
    .filter(
      (comment) =>
        comment.user && comment.user.id === botId && comment.user.type === BOT_TYPE,
    )
    .filter(
      (comment) => typeof comment.body === "string" && comment.body.includes(footer),
    );

  if (candidates.length === 0) {
    process.stderr.write("no matching review comment for this run yet\n");
    process.exit(2);
  }

  candidates.sort((a, b) => a.id - b.id);
  const comment = candidates[candidates.length - 1];

  // Strip only the verified footer for this run.
  const body = comment.body.split(footer).join("").replace(/\s+$/, "");

  const declarations = body.match(/VERDICT:/g);
  if (!declarations) reject("review comment has no VERDICT line");
  if (declarations.length > 1) {
    reject(`review comment declares VERDICT ${declarations.length} times — ambiguous`);
  }

  const lines = body.split("\n");
  let finalLine = "";
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].trim() !== "") {
      finalLine = lines[index].trim();
      break;
    }
  }

  if (!VALID_VERDICTS.has(finalLine)) {
    reject(`final line is not an exact verdict: ${JSON.stringify(finalLine)}`);
  }

  process.stdout.write(finalLine === "VERDICT: PASS" ? "PASS\n" : "FAIL\n");
}

main();
