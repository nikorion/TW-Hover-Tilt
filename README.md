# TW-Hover-Tilt

**English** · [Français](README.fr.md)

![Status](https://img.shields.io/badge/status-experimental-orange)

A TiddlyWiki widget wrapping [hover-tilt](https://hover-tilt.simey.me)'s Web Component for a 3D tilt/glare pointer effect on any content.

---

## Contents

- [What this is](#what-this-is)
- [Requirements](#requirements)
- [Developing](#developing)
- [Updating hover-tilt](#updating-hover-tilt)
- [Testing](#testing)
- [License](#license)

---

## What this is

TiddlyWiki has no notion of npm or ES modules — it evaluates JS tiddlers inside a `function(module, exports, require)` sandbox, which chokes on `import`/`export`. hover-tilt (itself written in Svelte 5) ships its own prebuilt Web Component — a self-registering, dependency-free `<hover-tilt>` custom element. This plugin vendors that file as-is (`src/hover-tilt/modules/hover-tilt.min.js`: TW module header added, its one ESM `export` statement removed, minified with terser), and a plain TiddlyWiki widget loads it via `require()` like any other module, then drives the resulting `<hover-tilt>` element directly.

It ships one widget:

- `<$HoverTilt>` — wraps whatever content is written in its own body with hover-tilt's 3D tilt/glare effect, exposing (almost) hover-tilt's entire prop surface as attributes
- i18n on both the JS side (`modules/lang.js`) and the wikitext side (`language/lingo.tid`), with `en-GB` and `fr-FR` bundled
- an interactive playground tuning every attribute at once (`$:/plugins/nikorion/hover-tilt/playground`)

Up to v0.1.0 this plugin compiled its own Svelte wrapper through Vite; since v0.2.0 it drives hover-tilt's prebuilt Web Component instead and compiles nothing itself (see the plugin's history tab for the changelog).

[↑ Back to contents](#contents)

## Requirements

- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) (`pnpm@11.9.0` pinned in `package.json`)
- A symlink resolving the plugin's two-segment name `nikorion/hover-tilt` to `src/hover-tilt`. `wiki/tiddlywiki.info` already sets `"pluginPath": "../src"`, but that alone is **not** enough: `pluginPath` only searches one level deep, so it can find a plugin folder named `hover-tilt`, never one matching the full `nikorion/hover-tilt` name. TiddlyWiki needs a directory tree that actually has that shape, found either via the `TIDDLYWIKI_PLUGIN_PATH` environment variable or a `plugins/nikorion/` folder next to the wiki. Set up one symlink:
  ```
  # PowerShell, needs an admin terminal or Windows Developer Mode enabled
  New-Item -ItemType SymbolicLink -Path "$env:TIDDLYWIKI_PLUGIN_PATH\nikorion\hover-tilt" -Target "src\hover-tilt"
  ```
  ```
  # Linux/macOS
  ln -s "$(pwd)/src/hover-tilt" "$TIDDLYWIKI_PLUGIN_PATH/nikorion/hover-tilt"
  ```
  Without it, `tiddlywiki wiki --listen` / `--build` fails with `Cannot find plugin 'nikorion/hover-tilt'`.

[↑ Back to contents](#contents)

## Developing

```
pnpm install
```

Test it inside TiddlyWiki, with automatic rebuild + browser reload on every change under `src/hover-tilt/`:

```
pnpm dev
```

`pnpm dev` prints the URL to open (random free port, remembered for the next run). It runs `scripts/dev.cjs`: nodemon reboots TiddlyWiki on JS/`plugin.info` changes, while `scripts/dev-hmr.cjs` pushes `.tid`/`.multids` content changes live over SSE and triggers a full browser reload after a reboot.

[↑ Back to contents](#contents)

## Updating hover-tilt

`src/hover-tilt/modules/hover-tilt.min.js` is a vendored, committed file — it is **not** rebuilt automatically by `pnpm dev` or `pnpm build`. To pick up a new hover-tilt release:

```
pnpm update:hover-tilt
```

This chains three steps: `pnpm update hover-tilt` (bumps the npm dependency), `pnpm vendor:hover-tilt` (reads `node_modules/hover-tilt/dist/hover-tilt.js`, strips its one ESM `export` statement, minifies it with terser, and writes the result to `modules/hover-tilt.min.js` with a fresh TW/license header — `@date` there is the vendoring date, not a hover-tilt release date), then `pnpm build` to confirm the plugin still loads cleanly.

[↑ Back to contents](#contents)

## Testing

There is no automated test suite. "Testing" here means:

```
pnpm lint         # ESLint on the TiddlyWiki-side modules (hover-tilt.min.js excluded — it's vendored)
pnpm build        # self-contained plugin JSON → dist/; fails if any tiddler/module is broken
pnpm build:site   # gh-pages site → docs/: external-core demo + subscribable plugin library
```

A green `pnpm build` is a strong signal: it proves every `.tid`/`.info` file parses and every module's `require()` graph resolves. It does **not** prove the widget renders correctly in a browser — check that manually in a browser (URL printed by `pnpm dev`) after `pnpm dev`.

[↑ Back to contents](#contents)

## License

MIT — see `src/hover-tilt/licence.tid`. Includes hover-tilt (MPL-2.0) and its bundled Svelte runtime (MIT).

[↑ Back to contents](#contents)
