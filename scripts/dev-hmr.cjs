#!/usr/bin/env node
"use strict";

// Content-HMR for the dev wiki (`pnpm dev`). Pairs with a module-only nodemon
// (nodemon.json, which reboots TW *only* on module/plugin.info changes) to give
// near-instant, state-preserving updates for **content** tiddlers (.tid /
// .multids) with no server reboot and no full page reload.
//
// ── Why this works ────────────────────────────────────────────────────
// The plugin's content tiddlers (readme, playground, language strings…) ship as
// *shadow* tiddlers bundled inside the plugin tiddler, which TiddlyWiki never
// hot-swaps live (it shows a "reload required" banner instead). But a *real*
// tiddler of the same title overrides its shadow and re-renders reactively. So
// on a content change we parse the source file into tiddler field objects and
// push them over Server-Sent Events (SSE — native, zero dependency) to a tiny
// browser startup module ($:/dev/hmr), which does $tw.wiki.addTiddler(): the
// override lives in the browser's memory only — nothing is written to disk or to
// the server store, so there is no cleanup and no drift.
//
// ── Module changes ────────────────────────────────────────────────────
// A module (.js) or plugin.info change takes the full path: the paired nodemon
// restarts TW, and this script probes the port (down → up) then broadcasts a
// { type: "reload" } event so the browser reloads once TW is back — at which
// point the fresh shadows win and the in-memory overrides vanish with the reload.
// (A true module hot-swap was prototyped and validated — see
// guides/hmr-tiddlywiki.md — but not kept: reboot+reload is simpler and the
// vendored Web Component needs it anyway.)

const http = require("http");
const fs = require("fs");
const path = require("path");

const WATCH_DIR = path.resolve("src/hover-tilt");
// Port TW listens on — injected by scripts/dev.cjs (resolved to 8080 or a random
// free port); 8080 is the standalone fallback. Only used by the readiness probe.
const TW_PORT = Number(process.env.TW_PORT) || 8080;
const SSE_PORT = Number(process.env.HMR_SSE_PORT) || 35730;
const POLL_MS = 250;
const DOWN_TIMEOUT_MS = 5000;
const UP_TIMEOUT_MS = 30000;

// A module/metadata change needs a full reboot (nodemon does the restart); any
// other watched file is treated as content and pushed live.
const REBOOT_EXTS = new Set(["js", "info", "svg", "meta"]);

// ── SSE server ────────────────────────────────────────────────────────
const clients = new Set();

const sse = http.createServer((req, res) => {
  if (req.url.split("?")[0] !== "/hmr") {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });
  res.write("retry: 1000\n\n");
  clients.add(res);
  req.on("close", () => clients.delete(res));
});

sse.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    process.stderr.write(`[hmr] port ${SSE_PORT} already in use — another pnpm dev running?\n`);
    process.exit(1);
  }
  throw err;
});

sse.listen(SSE_PORT, () =>
  process.stdout.write(`[hmr] SSE server on http://localhost:${SSE_PORT}/hmr\n`)
);

function broadcast(payload) {
  const line = "data: " + JSON.stringify(payload) + "\n\n";
  for (const res of clients) res.write(line);
}

// ── .tid / .multids parsing ───────────────────────────────────────────
function parseFields(block) {
  const fields = {};
  for (const rawLine of block.split("\n")) {
    const m = /^([^:]+):\s?(.*)$/.exec(rawLine);
    if (m) fields[m[1].trim()] = m[2];
  }
  return fields;
}

// Standard .tid: header "key: value" lines, blank line, then the text body.
function parseTid(raw) {
  const text = raw.replace(/\r\n/g, "\n");
  const sep = text.indexOf("\n\n");
  const fields = parseFields(sep === -1 ? text : text.slice(0, sep));
  fields.text = sep === -1 ? "" : text.slice(sep + 2);
  return fields.title ? [fields] : [];
}

// .multids: header block (common fields, incl. `title:` = shared prefix), blank
// line, then "Name: value" lines → one tiddler each (title = prefix + Name).
function parseMultids(raw) {
  const text = raw.replace(/\r\n/g, "\n");
  const sep = text.indexOf("\n\n");
  if (sep === -1) return [];
  const common = parseFields(text.slice(0, sep));
  const prefix = common.title || "";
  delete common.title;
  const out = [];
  for (const line of text.slice(sep + 2).split("\n")) {
    if (!line.trim()) continue;
    const m = /^([^:]+):\s?(.*)$/.exec(line);
    if (m) out.push(Object.assign({}, common, { title: prefix + m[1].trim(), text: m[2] }));
  }
  return out;
}

function tiddlersFor(file) {
  const raw = fs.readFileSync(file, "utf8");
  return file.endsWith(".multids") ? parseMultids(raw) : parseTid(raw);
}

// ── readiness probe: module reboot → reload once TW is back up ─────────
function probe() {
  return new Promise((resolve) => {
    const req = http.get({ host: "localhost", port: TW_PORT, path: "/" }, (res) => {
      res.resume();
      resolve(res.statusCode < 500 ? "up" : "down");
    });
    req.on("error", () => resolve("down"));
    req.setTimeout(800, () => {
      req.destroy();
      resolve("down");
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor(state, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await probe()) === state) return true;
    await sleep(POLL_MS);
  }
  return false;
}

let rebooting = false;
async function handleReboot() {
  if (rebooting) return;
  rebooting = true;
  try {
    await waitFor("down", DOWN_TIMEOUT_MS);
    const ready = await waitFor("up", UP_TIMEOUT_MS);
    process.stdout.write(
      ready
        ? "[hmr] TW rebooted — reloading browser\n"
        : "[hmr] reboot timeout — reloading anyway\n"
    );
    broadcast({ type: "reload" });
  } finally {
    rebooting = false;
  }
}

// ── file watching + classification ────────────────────────────────────
let debounce = null;
const pending = new Set();

fs.watch(WATCH_DIR, { recursive: true }, (_event, filename) => {
  if (!filename) return;
  pending.add(filename);
  clearTimeout(debounce);
  debounce = setTimeout(flush, 100);
});

function flush() {
  const files = [...pending];
  pending.clear();
  let needsReboot = false;
  const tiddlers = [];
  for (const filename of files) {
    const ext = path.extname(filename).slice(1);
    if (REBOOT_EXTS.has(ext)) {
      needsReboot = true;
      continue;
    }
    if (ext === "tid" || ext === "multids") {
      const abs = path.join(WATCH_DIR, filename);
      if (!fs.existsSync(abs)) continue;
      try {
        tiddlers.push(...tiddlersFor(abs));
      } catch (err) {
        process.stderr.write(`[hmr] parse failed for ${filename}: ${err.message}\n`);
      }
    }
  }
  // A reboot supersedes content pushes: nodemon is restarting TW anyway, and the
  // reload that follows re-syncs everything from the fresh shadows.
  if (needsReboot) {
    handleReboot();
    return;
  }
  if (tiddlers.length) {
    broadcast({ type: "tiddlers", tiddlers });
    process.stdout.write(
      `[hmr] pushed ${tiddlers.length} tiddler(s): ${tiddlers.map((t) => t.title).join(", ")}\n`
    );
  }
}

process.stdout.write(`[hmr] watching ${WATCH_DIR}\n`);
