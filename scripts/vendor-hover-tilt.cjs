#!/usr/bin/env node
"use strict";

// Re-vendors hover-tilt's prebuilt Web Component (node_modules/hover-tilt/dist/hover-tilt.js)
// into src/hover-tilt/modules/hover-tilt.min.js, whenever the `hover-tilt` devDependency is
// bumped. That source file is self-contained but has one ESM artefact — a trailing
// `export { HoverTilt };` — which this script strips, since TiddlyWiki's module sandbox
// (`function(module, exports, require)`) chokes on top-level `export`. The rest is minified
// with terser (see TW-Math's math.min.js for the header convention this follows) and a fresh
// TW header + name/version/license block is written in place of whatever comments terser
// stripped — see CLAUDE.md for why @date here is the vendoring date, not a hover-tilt release
// date (hover-tilt's package.json doesn't publish one).

const fs = require("fs");
const path = require("path");
const { minify } = require("terser");

// hover-tilt's package.json only exposes "./web-component" under an "import"
// condition (no "require"), so require.resolve() can't reach it directly —
// resolve the package root via its main "." export instead, then read
// dist/hover-tilt.js and package.json with plain fs (exports restrictions
// only gate require()/import resolution, not arbitrary file reads).
const packageRoot = path.join(path.dirname(require.resolve("hover-tilt")), "..");
const SOURCE = path.join(packageRoot, "dist", "hover-tilt.js");
const TARGET = path.join(__dirname, "..", "src", "hover-tilt", "modules", "hover-tilt.min.js");

const hoverTiltPkg = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
const vendoredDate = new Date().toISOString().slice(0, 10);

const HEADER = [
  "/*\\",
  "title: $:/plugins/nikorion/hover-tilt/modules/hover-tilt.min.js",
  "type: application/javascript",
  "module-type: library",
  "\\*/",
  "",
  "/**",
  " * hover-tilt.min.js",
  " * https://hover-tilt.simey.me",
  " *",
  " * Add smooth tilt & glare effects to your website — Web Component build of",
  " * hover-tilt, a Svelte 5 component for a 3D tilt/glare pointer effect.",
  " */",
  "",
  "/**",
  ` * @version ${hoverTiltPkg.version}`,
  ` * @date    ${vendoredDate} (vendoring date — see CLAUDE.md)`,
  " */",
  "",
  "/**",
  " * @license",
  " * Copyright (C) 2025 Simon Goellner <simey.me@gmail.com>",
  " *",
  " * This Source Code Form is subject to the terms of the Mozilla Public",
  " * License, v. 2.0. If a copy of the MPL was not distributed with this",
  " * file, You can obtain one at http://mozilla.org/MPL/2.0/.",
  " */",
  "",
].join("\n");

async function main() {
  let source = fs.readFileSync(SOURCE, "utf8");

  // Drop the trailing `//# sourceMappingURL=...` comment (we don't ship the .map file).
  source = source.replace(/\n\/\/# sourceMappingURL=.*\n?$/, "\n");

  // Drop the trailing `export { HoverTilt };` — the only ESM-specific syntax in the file.
  const withoutExport = source.replace(/\nexport\s*\{\s*HoverTilt\s*\}\s*;\s*\n?$/, "\n");
  if (withoutExport === source) {
    throw new Error(
      "vendor-hover-tilt: expected a trailing 'export { HoverTilt };' in " + SOURCE +
      " — hover-tilt's build output shape may have changed, check by hand before re-vendoring."
    );
  }

  // mangle (not mangle.properties) only renames local identifiers, never the
  // string property keys create_custom_element()/customElements.define() rely
  // on, so it's safe here. comments: false strips terser's own header/JSDoc —
  // replaced by HEADER above, matching math.min.js's convention.
  const result = await minify(withoutExport, {
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  if (!result.code) {
    throw new Error("vendor-hover-tilt: terser produced no output");
  }

  fs.writeFileSync(TARGET, HEADER + result.code + "\n", "utf8");
  console.log("[vendor-hover-tilt] wrote " + path.relative(process.cwd(), TARGET));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
