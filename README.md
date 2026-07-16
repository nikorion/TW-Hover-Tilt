# TW-Hover-Tilt

![Status](https://img.shields.io/badge/status-experimental-orange)

A TiddlyWiki widget wrapping [hover-tilt](https://hover-tilt.simey.me)'s Web Component for a 3D tilt/glare pointer effect on any content.

**[English](#english) · [Français](#français)**

---

## English

### What this is

TiddlyWiki has no notion of npm or ES modules — it evaluates JS tiddlers inside a `function(module, exports, require)` sandbox, which chokes on `import`/`export`. hover-tilt (itself written in Svelte 5) ships its own prebuilt Web Component — a self-registering, dependency-free `<hover-tilt>` custom element. This plugin vendors that file as-is (`src/hover-tilt/modules/hover-tilt.min.js`: TW module header added, its one ESM `export` statement removed, minified with terser), and a plain TiddlyWiki widget loads it via `require()` like any other module, then drives the resulting `<hover-tilt>` element directly.

It ships one widget:

- `<$HoverTilt>` — wraps whatever content is written in its own body with hover-tilt's 3D tilt/glare effect, exposing (almost) hover-tilt's entire prop surface as attributes
- i18n on both the JS side (`modules/lang.js`) and the wikitext side (`language/lingo.tid`), with `en-GB` and `fr-FR` bundled
- an interactive playground tuning every attribute at once (`$:/plugins/nikorion/hover-tilt/playground`)

Up to v0.1.0 this plugin compiled its own Svelte wrapper through Vite; since v0.2.0 it drives hover-tilt's prebuilt Web Component instead and compiles nothing itself (see the plugin's history tab for the changelog).

### Requirements

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

### Developing

```
pnpm install
```

Test it inside TiddlyWiki, with automatic rebuild + browser reload on every change under `src/hover-tilt/`:

```
pnpm dev
```

`pnpm dev` prints the URL to open — <http://localhost:8080> by default, or a random free port if 8080 is taken. It runs `scripts/dev.cjs`: nodemon reboots TiddlyWiki on JS/`plugin.info` changes, while `scripts/dev-hmr.cjs` pushes `.tid`/`.multids` content changes live over SSE and triggers a full browser reload after a reboot.

### Updating hover-tilt

`src/hover-tilt/modules/hover-tilt.min.js` is a vendored, committed file — it is **not** rebuilt automatically by `pnpm dev` or `pnpm build`. To pick up a new hover-tilt release:

```
pnpm update:hover-tilt
```

This chains three steps: `pnpm update hover-tilt` (bumps the npm dependency), `pnpm vendor:hover-tilt` (reads `node_modules/hover-tilt/dist/hover-tilt.js`, strips its one ESM `export` statement, minifies it with terser, and writes the result to `modules/hover-tilt.min.js` with a fresh TW/license header — `@date` there is the vendoring date, not a hover-tilt release date), then `pnpm build` to confirm the plugin still loads cleanly.

### Testing

There is no automated test suite. "Testing" here means:

```
pnpm lint         # ESLint on the TiddlyWiki-side modules (hover-tilt.min.js excluded — it's vendored)
pnpm build        # self-contained plugin JSON → dist/; fails if any tiddler/module is broken
pnpm build:site   # gh-pages site → docs/: external-core demo + subscribable plugin library
```

A green `pnpm build` is a strong signal: it proves every `.tid`/`.info` file parses and every module's `require()` graph resolves. It does **not** prove the widget renders correctly in a browser — check that manually in a browser (URL printed by `pnpm dev`, `http://localhost:8080` by default) after `pnpm dev`.

### License

MIT — see `src/hover-tilt/licence.tid`. Includes hover-tilt (MPL-2.0) and its bundled Svelte runtime (MIT).

---

## Français

### Ce que c'est

TiddlyWiki ne comprend ni npm ni les modules ES : il évalue les tiddlers JS dans une sandbox `function(module, exports, require)`, qui échoue sur `import`/`export`. hover-tilt (lui-même écrit en Svelte 5) fournit son propre Web Component prébuilt — un `<hover-tilt>` autonome, sans dépendance, qui s'enregistre lui-même. Ce plugin vendore ce fichier tel quel (`src/hover-tilt/modules/hover-tilt.min.js` : en-tête TW ajouté, son unique instruction ESM `export` retirée, minifié avec terser), et un widget TiddlyWiki classique le charge via `require()` comme n'importe quel autre module, puis pilote directement l'élément `<hover-tilt>` obtenu.

Il fournit un widget :

- `<$HoverTilt>` — habille tout contenu écrit dans son propre corps avec l'effet 3D d'inclinaison/reflet de hover-tilt, en exposant (presque) toute la surface de props de hover-tilt comme attributs
- une internationalisation à la fois côté JS (`modules/lang.js`) et côté wikitext (`language/lingo.tid`), avec `en-GB` et `fr-FR` fournis
- un playground interactif pour régler tous les attributs à la fois (`$:/plugins/nikorion/hover-tilt/playground`)

Jusqu'à la v0.1.0 ce plugin compilait son propre wrapper Svelte via Vite ; depuis la v0.2.0 il pilote le Web Component prébuilt de hover-tilt et ne compile plus rien lui-même (voir l'onglet history du plugin pour le journal des versions).

### Prérequis

- [Node.js](https://nodejs.org/) et [pnpm](https://pnpm.io/) (`pnpm@11.9.0` figé dans `package.json`)
- Un symlink qui résout le nom à deux segments `nikorion/hover-tilt` vers `src/hover-tilt`. `wiki/tiddlywiki.info` définit déjà `"pluginPath": "../src"`, mais ça ne suffit pas : `pluginPath` ne cherche qu'à un seul niveau de profondeur, donc il peut trouver un dossier de plugin nommé `hover-tilt`, jamais un qui correspond au nom complet `nikorion/hover-tilt`. TiddlyWiki a besoin d'une arborescence qui a réellement cette forme, trouvée soit via la variable d'environnement `TIDDLYWIKI_PLUGIN_PATH`, soit via un dossier `plugins/nikorion/` à côté du wiki. Créer un symlink :
  ```
  # PowerShell, nécessite un terminal admin ou le mode développeur Windows activé
  New-Item -ItemType SymbolicLink -Path "$env:TIDDLYWIKI_PLUGIN_PATH\nikorion\hover-tilt" -Target "src\hover-tilt"
  ```
  ```
  # Linux/macOS
  ln -s "$(pwd)/src/hover-tilt" "$TIDDLYWIKI_PLUGIN_PATH/nikorion/hover-tilt"
  ```
  Sans ce symlink, `tiddlywiki wiki --listen` / `--build` échoue avec `Cannot find plugin 'nikorion/hover-tilt'`.

### Développer

```
pnpm install
```

Tester dans TiddlyWiki, avec reconstruction automatique et rechargement du navigateur à chaque changement sous `src/hover-tilt/` :

```
pnpm dev
```

`pnpm dev` affiche l'URL à ouvrir — <http://localhost:8080> par défaut, ou un port libre aléatoire si 8080 est pris. Il exécute `scripts/dev.cjs` : nodemon reboote TiddlyWiki sur changement de module JS/`plugin.info`, tandis que `scripts/dev-hmr.cjs` pousse à chaud les changements de contenu (`.tid`/`.multids`) via SSE et déclenche un rechargement complet du navigateur après un reboot.

### Mettre à jour hover-tilt

`src/hover-tilt/modules/hover-tilt.min.js` est un fichier vendoré, committé — il n'est **pas** régénéré automatiquement par `pnpm dev` ni `pnpm build`. Pour récupérer une nouvelle version de hover-tilt :

```
pnpm update:hover-tilt
```

Cette commande enchaîne trois étapes : `pnpm update hover-tilt` (met à jour la dépendance npm), `pnpm vendor:hover-tilt` (lit `node_modules/hover-tilt/dist/hover-tilt.js`, retire son unique instruction ESM `export`, le minifie avec terser, et écrit le résultat dans `modules/hover-tilt.min.js` avec un en-tête TW/licence tout neuf — `@date` y désigne la date de vendoring, pas une date de release hover-tilt), puis `pnpm build` pour confirmer que le plugin se charge toujours correctement.

### Tester

Il n'y a pas de suite de tests automatisés. « Tester » signifie ici :

```
pnpm lint         # ESLint sur les modules côté TiddlyWiki (hover-tilt.min.js exclu, car vendoré)
pnpm build        # plugin JSON autoporteur → dist/ ; échoue si un tiddler/module est cassé
pnpm build:site   # site gh-pages → docs/ : démo à moteur externe + bibliothèque de plugins souscriptible
```

Un `pnpm build` qui passe est un signal fort : ça prouve que chaque fichier `.tid`/`.info` se parse et que le graphe de `require()` de chaque module se résout. Ça ne prouve **pas** que le widget s'affiche correctement dans un navigateur — à vérifier manuellement dans un navigateur (URL affichée par `pnpm dev`, `http://localhost:8080` par défaut) après `pnpm dev`.

### Licence

MIT — voir `src/hover-tilt/licence.tid`. Inclut hover-tilt (MPL-2.0) et le runtime Svelte qu'il embarque (MIT).
