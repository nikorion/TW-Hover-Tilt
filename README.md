# TW-Hover-Tilt

**English** · [Français](README.fr.md)

![Status](https://img.shields.io/badge/status-experimental-orange)

A TiddlyWiki widget wrapping [hover-tilt](https://hover-tilt.simey.me)'s Web Component for a 3D tilt/glare pointer effect on any content.

## What this is

TiddlyWiki has no notion of npm or ES modules — it evaluates JS tiddlers inside a `function(module, exports, require)` sandbox, which chokes on `import`/`export`. hover-tilt (itself written in Svelte 5) ships its own prebuilt Web Component — a self-registering, dependency-free `<hover-tilt>` custom element. This plugin vendors that file as-is (`src/hover-tilt/modules/hover-tilt.min.js`: TW module header added, its one ESM `export` statement removed, minified with terser), and a plain TiddlyWiki widget loads it via `require()` like any other module, then drives the resulting `<hover-tilt>` element directly.

It ships one widget:

- `<$HoverTilt>` — wraps whatever content is written in its own body with hover-tilt's 3D tilt/glare effect, exposing (almost) hover-tilt's entire prop surface as attributes
- i18n on both the JS side (`modules/lang.js`) and the wikitext side (`language/lingo.tid`), with `en-GB` and `fr-FR` bundled
- an interactive playground tuning every attribute at once, in the dev wiki (`wiki/tiddlers/Playground.tid`) and the [online demo](https://nikorion.github.io/TW-Hover-Tilt/) — not shipped with the plugin

Up to v0.1.0 this plugin compiled its own Svelte wrapper through Vite; since v0.2.0 it drives hover-tilt's prebuilt Web Component instead and compiles nothing itself (see the plugin's history tab for the changelog).

## Requirements

- [Node.js](https://nodejs.org/) and [pnpm](https://pnpm.io/) (`pnpm@11.9.0` pinned in `package.json`)
- Clone [tw-dev](https://github.com/nikorion/tw-dev) next to this repository: `pnpm dev` runs it, and it links by itself the nikorion plugins the dev wiki loads — from clones sitting next to this one (`../TW-Math`…), so your edits to them are live, otherwise from a read-only copy it fetches from GitHub. No symlink, no `TIDDLYWIKI_PLUGIN_PATH`, no admin rights. `pnpm build` alone still needs `TIDDLYWIKI_PLUGIN_PATH`: point it to `../tw-dev/.state/TW-Hover-Tilt/plugins`, created by `pnpm dev`.

## Developing

```
pnpm install
```

Test it inside TiddlyWiki, with automatic rebuild + browser reload on every change under `src/hover-tilt/`:

```
pnpm dev
```

`pnpm dev` prints the URL to open (random free port, remembered for the next run). It runs the shared dev server `../tw-dev` (cloned next to this repository): a change to a JS module or `plugin.info` restarts TiddlyWiki, any other file (`.tid`, `.multids`, `.css`…) is pushed live over SSE, and the browser reloads after a restart.

## Updating hover-tilt

`src/hover-tilt/modules/hover-tilt.min.js` is a vendored, committed file — it is **not** rebuilt automatically by `pnpm dev` or `pnpm build`. To pick up a new hover-tilt release:

```
pnpm update:hover-tilt
```

This chains three steps: `pnpm update hover-tilt` (bumps the npm dependency), `pnpm vendor:hover-tilt` (reads `node_modules/hover-tilt/dist/hover-tilt.js`, strips its one ESM `export` statement, minifies it with terser, and writes the result to `modules/hover-tilt.min.js` with a fresh TW/license header — `@date` there is the vendoring date, not a hover-tilt release date), then `pnpm build` to confirm the plugin still loads cleanly.

## Testing

There is no automated test suite. "Testing" here means:

```
pnpm lint         # ESLint on the TiddlyWiki-side modules (hover-tilt.min.js excluded — it's vendored)
pnpm build        # dist/TW-Hover-Tilt-Plugin.json + docs/ (demo wiki, published by CI)
```

A green `pnpm build` is a strong signal: it proves every `.tid`/`.info` file parses and every module's `require()` graph resolves. It does **not** prove the widget renders correctly in a browser — check that manually in a browser (URL printed by `pnpm dev`) after `pnpm dev`.

## Installation

**Live demo**: [https://nikorion.github.io/TW-Hover-Tilt/](https://nikorion.github.io/TW-Hover-Tilt/) — try the plugin before installing it.

**From the nikorion plugin library** (TiddlyWiki then offers each new version as an update):

1. On [nikorion.github.io/tw-plugins](https://nikorion.github.io/tw-plugins/), drag the **nikorion plugin library** button onto your wiki (once per wiki).
2. Open *Control Panel → Plugins → Get more plugins → Open plugin library*, choose the nikorion tab and install **Hover Tilt**.

**By hand**: download [`TW-Hover-Tilt-Plugin.json`](https://nikorion.github.io/TW-Hover-Tilt/TW-Hover-Tilt-Plugin.json) and drag it onto your wiki.

Requires TiddlyWiki ≥ 5.3.8.

## License

MIT — see `src/hover-tilt/licence.tid`. Includes hover-tilt (MPL-2.0) and its bundled Svelte runtime (MIT).
