/*
 * Compact ESLint formatter — one line per problem, project-relative paths,
 * and completely silent when the run is clean (returns an empty string).
 *
 * Kept local (zero npm dependency) because ESLint 9 dropped the built-in
 * `compact` formatter. The default `stylish` formatter emits a multi-line,
 * ANSI-coloured block per file, which balloons the assistant's context on
 * every lint run; this keeps each problem to a single greppable line:
 *   src/hover-tilt/modules/foo.js:12:5 error Unexpected console (no-console)
 */
"use strict";

const path = require("path");

module.exports = function (results) {
  const cwd = process.cwd();
  const lines = [];
  let errors = 0;
  let warnings = 0;

  for (const result of results) {
    const rel = path.relative(cwd, result.filePath).replace(/\\/g, "/");
    for (const m of result.messages) {
      if (m.severity === 2) {
        errors += 1;
      } else {
        warnings += 1;
      }
      const level = m.severity === 2 ? "error" : "warning";
      const rule = m.ruleId ? ` (${m.ruleId})` : "";
      lines.push(`${rel}:${m.line || 0}:${m.column || 0} ${level} ${m.message}${rule}`);
    }
  }

  if (lines.length === 0) {
    return "";
  }
  lines.push(`${lines.length} problem(s): ${errors} error(s), ${warnings} warning(s)`);
  return lines.join("\n") + "\n";
};
