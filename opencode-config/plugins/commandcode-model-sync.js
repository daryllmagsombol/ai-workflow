// opencode-commandcode-model-sync — registers Command Code models that
// opencode-cmd-provider's bundled snapshot is missing, so newly released models
// appear in OpenCode without waiting for a provider plugin release and without
// purging the provider's pinned cache entry.
//
// https://github.com/fauzanharsya/opencode-commandcode-model-sync
//
// Companion to opencode-cmd-provider, not a replacement: the provider does all
// the auth and API traffic, this only syncs its model list.
//
// ATTRIBUTION: the model-entry shape registered below (toModelEntry), the
// "(free)" suffix rule, the { reasoningEffort } variant payload, the "[CMD] "
// display prefix, the pending-context placeholder, and the max-output cap are
// derived from opencode-cmd-provider (MIT, Copyright (c) 2026
// opencode-cmd-provider contributors) —
// https://github.com/rashidrazak/opencode-cmd-provider. See NOTICE for the full
// license text. The catalog resolution strategy, fallback chain, parser,
// installer, and tests here are original to this project.
//
// Catalog resolution order, on every startup:
//   1. unpkg `command-code@latest` (the internet mirror) — freshest, tried first
//      so a machine whose Command Code CLI is old or absent still sees new models;
//   2. the installed Command Code CLI's shipped catalog
//      (command-code/dist/bundled/command-code-knowledge/reference/models.md);
//   3. jsDelivr `command-code@latest` — last network resort;
//   4. a disk cache of the last successful internet fetch (offline fallback).
//
// Both mirrors are fetched in parallel under one hard budget (BUDGET_MS), then
// consulted in the order above. If neither lands in time the local CLI catalog
// is used immediately. That keeps the happy path at roughly one CDN round trip
// while capping the offline/blackholed-network cost at BUDGET_MS.
//
// unpkg is preferred over jsDelivr despite being slower, because jsDelivr
// serves a stale cached payload for `@latest`: on 2026-09-10 its metadata
// reported 1.53.0 while the file it returned was the 1.52.0 table missing
// `deepseek/deepseek-v4.1-flash` (69 rows vs 70). Preferring it would
// reintroduce the very bug this plugin exists to fix, so it is demoted to a
// last resort rather than a faster first choice.
//
// Cross-platform: Windows, macOS, and Linux. All paths go through node:path so
// separators and PATH splitting follow the host; the plugin directory layout
// matches OpenCode's own (`~/.config/opencode` and `~/.cache/opencode` on every
// OS), and no shell, npm, or system command is invoked at runtime.
//
// Zero dependencies by design: `@opencode-ai/plugin` is deliberately NOT
// imported (not even for types). That package pulls in ~25 transitive packages
// for a type-only import, including a beta build of `effect` and a native
// addon that runs an install script. The minimal structural types below mirror
// @opencode-ai/plugin@1.x instead, so the shipped plugin has an empty
// dependency tree and nothing to compromise it at install time.
//
// We read the CLI's bundled models.md rather than `command-code --list-models`
// because the CLI's text output lowercases ids and drops every metadata column,
// and the runtime needs the exact casing (e.g. `MiniMaxAI/MiniMax-M3`).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, dirname, join } from "node:path";
const CATALOG_RELATIVE = join("command-code", "dist", "bundled", "command-code-knowledge", "reference", "models.md");
// unpkg first: it redirects `@latest` to the exact published version, so it is
// actually fresh. jsDelivr's `@latest` can be stale by days (see header).
const UNPKG_URL = "https://unpkg.com/command-code@latest/dist/bundled/command-code-knowledge/reference/models.md";
const JSDELIVR_URL = "https://cdn.jsdelivr.net/npm/command-code@latest/dist/bundled/command-code-knowledge/reference/models.md";
// Hard cap on how long startup waits for the freshest catalog before falling
// back to the local CLI copy. Shared by both mirrors, which are fetched
// concurrently, so the total wait can never exceed this value.
const BUDGET_MS = 3_000;
// Offline fallback only: written on a successful internet fetch, read when the
// internet and the CLI are both unavailable. Resolved per call so it follows the
// active home directory.
function cacheFile() {
    return join(homedir(), ".cache", "opencode", "commandcode-model-sync-catalog.md");
}
// Derived from opencode-cmd-provider (MIT — see NOTICE): its display prefix and
// output cap, so models registered here match the ones it declares itself.
const DEFAULT_PREFIX = "[CMD] ";
const DEFAULT_MAX_OUTPUT_TOKENS = 65_536;
// Mirrors the provider plugin's placeholder for a row whose Context cell is
// missing: opencode requires a numeric limit, and 0 would advertise a broken model.
const PENDING_CONTEXT_LENGTH = 128_000;
function parseContext(raw) {
    const match = /^([\d.]+)\s*([KM])$/i.exec(raw.trim());
    if (!match)
        return null;
    const value = Number.parseFloat(match[1]);
    if (!Number.isFinite(value))
        return null;
    const scale = match[2].toUpperCase() === "M" ? 1_000_000 : 1_000;
    return Math.round(value * scale);
}
function parseEfforts(raw) {
    const value = raw.trim();
    if (!value || value === "—" || value === "-")
        return null;
    const levels = value
        .split(",")
        .map((level) => level.trim())
        .filter(Boolean);
    return levels.length > 0 ? levels : null;
}
function parseCost(raw) {
    const rates = /^\$([\d.]+)\s*\/\s*\$([\d.]+)/.exec(raw.trim());
    if (!rates)
        return null;
    const input = Number.parseFloat(rates[1]);
    const output = Number.parseFloat(rates[2]);
    if (!Number.isFinite(input) || !Number.isFinite(output))
        return null;
    const cacheRead = /cache\s*\$([\d.]+)/.exec(raw);
    const cacheWrite = /write\s*\$([\d.]+)/.exec(raw);
    return {
        input,
        output,
        cacheRead: cacheRead ? Number.parseFloat(cacheRead[1]) : 0,
        cacheWrite: cacheWrite ? Number.parseFloat(cacheWrite[1]) : 0,
    };
}
function parseCatalog(markdown) {
    const models = [];
    const seen = new Set();
    for (const line of markdown.split(/\r?\n/)) {
        if (!line.startsWith("|"))
            continue;
        const cells = line.split("|").map((cell) => cell.trim());
        const id = /^`([^`]+)`$/.exec(cells[1] ?? "")?.[1];
        const name = cells[2];
        if (!id || !name || seen.has(id))
            continue;
        seen.add(id);
        models.push({
            id,
            name,
            contextLength: parseContext(cells[3] ?? ""),
            efforts: parseEfforts(cells[4] ?? ""),
            cost: parseCost(cells[5] ?? ""),
        });
    }
    return models;
}
function isCatalog(markdown) {
    return markdown.includes("| Id (use EXACTLY this) |");
}
// Candidate global node_modules roots. PATH entries cover the common
// per-manager layouts on every OS: /usr/local/bin -> /usr/local/lib/node_modules,
// /opt/homebrew/bin -> /opt/homebrew/lib/node_modules (Apple Silicon),
// nvm's ~/.nvm/versions/node/<v>/bin -> ../lib/node_modules, and on Windows
// %APPDATA%\npm\node_modules.
function nodeModulesDirs() {
    const dirs = new Set();
    const add = (dir) => {
        if (dir)
            dirs.add(dir);
    };
    if (process.env.APPDATA)
        add(join(process.env.APPDATA, "npm", "node_modules"));
    add(join(homedir(), "AppData", "Roaming", "npm", "node_modules"));
    const prefix = process.env.npm_config_prefix ?? process.env.PREFIX;
    if (prefix) {
        add(join(prefix, "lib", "node_modules"));
        add(join(prefix, "node_modules"));
    }
    for (const entry of (process.env.PATH ?? "").split(delimiter)) {
        if (!entry)
            continue;
        add(join(entry, "node_modules"));
        add(join(entry, "..", "lib", "node_modules"));
        add(join(entry, "..", "node_modules"));
    }
    for (const entry of (process.env.NODE_PATH ?? "").split(delimiter)) {
        if (entry)
            add(entry);
    }
    add(join(homedir(), ".npm-global", "lib", "node_modules"));
    add(join(homedir(), ".bun", "install", "global", "node_modules"));
    add("/usr/local/lib/node_modules");
    add("/opt/homebrew/lib/node_modules");
    add("/usr/lib/node_modules");
    return [...dirs];
}
function readLocalCatalog() {
    for (const dir of nodeModulesDirs()) {
        try {
            const file = join(dir, CATALOG_RELATIVE);
            if (existsSync(file))
                return readFileSync(file, "utf8");
        }
        catch {
            continue;
        }
    }
    return null;
}
function readCachedCatalog() {
    try {
        const file = cacheFile();
        if (!existsSync(file))
            return null;
        return readFileSync(file, "utf8");
    }
    catch {
        return null;
    }
}
function writeCachedCatalog(markdown) {
    try {
        const file = cacheFile();
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, markdown, "utf8");
    }
    catch {
        // Best-effort; a failed cache write must not break config resolution.
    }
}
// Resolves to the parsed catalog (plus the raw text, for caching) or null on
// timeout/error/invalid payload. The timeout is bounded by the caller's
// deadline, so a blackholed network cannot stall startup past BUDGET_MS.
function fetchCatalog(url, deadline) {
    const remaining = deadline - Date.now();
    if (remaining <= 0)
        return Promise.resolve(null);
    return fetch(url, { signal: AbortSignal.timeout(remaining) })
        .then((response) => (response.ok ? response.text() : null))
        .then((markdown) => {
        if (!markdown || !isCatalog(markdown))
            return null;
        const models = parseCatalog(markdown);
        return models.length > 0 ? { models, markdown } : null;
    })
        .catch(() => null);
}
async function loadCatalog() {
    const deadline = Date.now() + BUDGET_MS;
    // Start both mirrors immediately so the preferred one never waits on the
    // other's timeout; each is individually capped by the shared deadline.
    const primary = fetchCatalog(UNPKG_URL, deadline);
    const secondary = fetchCatalog(JSDELIVR_URL, deadline);
    const unpkg = await primary;
    if (unpkg) {
        writeCachedCatalog(unpkg.markdown);
        return { models: unpkg.models, source: "remote" };
    }
    // The local CLI copy is instant and usually fresh (the CLI auto-updates), so
    // it outranks jsDelivr, whose `@latest` can be stale by days.
    const cliMarkdown = readLocalCatalog();
    if (cliMarkdown) {
        const models = parseCatalog(cliMarkdown);
        if (models.length > 0)
            return { models, source: "cli" };
    }
    const jsdelivr = await secondary;
    if (jsdelivr)
        return { models: jsdelivr.models, source: "jsdelivr" };
    const cachedMarkdown = readCachedCatalog();
    if (cachedMarkdown) {
        const models = parseCatalog(cachedMarkdown);
        if (models.length > 0)
            return { models, source: "cache" };
    }
    return { models: [], source: null };
}
// Derived from opencode-cmd-provider's zero-cost check (MIT — see NOTICE): the
// upstream catalog names paid and free variants identically, so a zero-rate row
// is the only signal that a model is served free.
function isFreeCost(cost) {
    return cost.input === 0 && cost.output === 0 && cost.cacheRead === 0 && cost.cacheWrite === 0;
}
function toModelEntry(model, prefix) {
    const contextLength = model.contextLength ?? PENDING_CONTEXT_LENGTH;
    const free = model.cost !== null && isFreeCost(model.cost);
    const efforts = model.efforts;
    return {
        name: `${prefix}${model.name}${free ? " (free)" : ""}`,
        limit: {
            context: contextLength,
            output: Math.min(contextLength, DEFAULT_MAX_OUTPUT_TOKENS),
        },
        // Without a models.md Efforts entry there is no evidence the model is
        // reasoning-capable, so it is advertised as a plain model.
        reasoning: efforts ? true : undefined,
        variants: efforts
            ? Object.fromEntries(efforts.map((effort) => [effort, { reasoningEffort: effort }]))
            : undefined,
        tool_call: true,
        // models.md carries no modality data (that lives in the CLI bundle), so
        // unknown models default to text-only rather than over-claiming vision.
        modalities: { input: ["text"] },
        ...(model.cost !== null
            ? {
                cost: {
                    input: model.cost.input,
                    output: model.cost.output,
                    cache_read: model.cost.cacheRead,
                    cache_write: model.cost.cacheWrite,
                },
            }
            : {}),
        status: "active",
    };
}
export const CcLiveModels = async ({ client }) => {
    const log = async (level, message, extra) => {
        try {
            await client.app.log({ body: { service: "commandcode-model-sync", level, message, extra } });
        }
        catch {
            // Logging is best-effort; never let it break config resolution.
        }
    };
    return {
        config: async (config) => {
            try {
                const { models: catalog, source } = await loadCatalog();
                if (catalog.length === 0)
                    return;
                const provider = (config.provider ??= {});
                const entry = (provider.commandcode ??= {});
                entry.npm ??= "opencode-cmd-provider";
                entry.name ??= "Command Code";
                entry.env ??= ["COMMANDCODE_API_KEY"];
                entry.options ??= {};
                entry.options.baseURL ??= "https://api.commandcode.ai";
                entry.models ??= {};
                const prefix = typeof entry.options.display_prefix === "string"
                    ? entry.options.display_prefix
                    : DEFAULT_PREFIX;
                const declaredIds = new Set(Object.values(entry.models)
                    .map((model) => model?.id)
                    .filter((id) => typeof id === "string"));
                // The bundled snapshot (and any user declaration) always wins; this only
                // fills the ids it does not know about yet.
                const added = [];
                for (const model of catalog) {
                    if (entry.models[model.id] !== undefined || declaredIds.has(model.id))
                        continue;
                    entry.models[model.id] = toModelEntry(model, prefix);
                    added.push(model.id);
                }
                if (added.length > 0) {
                    await log("info", "registered models missing from the bundled snapshot", {
                        source,
                        catalogCount: catalog.length,
                        added: added.length,
                        models: added,
                    });
                }
            }
            catch (error) {
                await log("error", "catalog refresh failed; bundled snapshot stands", {
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        },
    };
};
