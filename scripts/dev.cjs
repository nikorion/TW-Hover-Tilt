#!/usr/bin/env node
"use strict";

// Orchestrates `pnpm dev`. Resolves the dev port once — prefers 8080, and falls
// back to a random free port if 8080 is already taken (same behaviour as
// TiddlyDev / the get-port package: move aside rather than kill the occupant) —
// then runs the two long-lived pieces side by side, sharing the chosen port
// through the TW_PORT env var:
//   • nodemon      → reboots TW on module / plugin.info changes (nodemon.json
//                    supplies watch/ext; the port is injected here via --exec)
//   • dev-hmr.cjs  → content-HMR SSE server (reads TW_PORT for its readiness probe)
//
// Zero added dependency: port resolution uses the native `net` module and the
// two children are spawned directly (no concurrently).

const net = require("net");
const path = require("path");
const { spawn } = require("child_process");

const PREFERRED_PORT = Number(process.env.TW_PORT) || 8080;

// Can we bind this port right now? (briefly opens then closes a listener)
function isFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once("error", () => resolve(false));
    srv.once("listening", () => srv.close(() => resolve(true)));
    srv.listen(port, "0.0.0.0");
  });
}

// Ask the OS for any free ephemeral port (listen on 0 → it assigns one).
function randomFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.once("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

async function resolvePort() {
  if (await isFree(PREFERRED_PORT)) return PREFERRED_PORT;
  const port = await randomFreePort();
  process.stdout.write(`[dev] port ${PREFERRED_PORT} busy → using free port ${port}\n`);
  return port;
}

(async () => {
  const port = await resolvePort();
  const env = { ...process.env, TW_PORT: String(port) };
  process.stdout.write(`[dev] TiddlyWiki → http://localhost:${port}\n`);

  const nodemonBin = require.resolve("nodemon/bin/nodemon.js");
  const nodemon = spawn(
    process.execPath,
    [nodemonBin, "--exec", `tiddlywiki wiki --listen port=${port}`],
    { stdio: "inherit", env }
  );
  const hmr = spawn(process.execPath, [path.join(__dirname, "dev-hmr.cjs")], {
    stdio: "inherit",
    env,
  });

  // Ctrl+C (or nodemon stopping) tears both down. dev-hmr exiting on its own is
  // NOT fatal: it bails out when the SSE port is already taken (a parallel
  // `pnpm dev` for another plugin — see HMR_SSE_PORT), and TW should keep serving.
  let shuttingDown = false;
  function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const child of [nodemon, hmr]) {
      if (!child.killed) child.kill();
    }
  }
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  nodemon.on("exit", shutdown);
})();
