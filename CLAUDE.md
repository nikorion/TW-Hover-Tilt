# TW-Hover-Tilt — contexte projet pour Claude

> **Avant toute tâche sur ce plugin, consulter d'abord le `CLAUDE.md` du workspace** (`../CLAUDE.md`) et ses `guides/` pour l'outillage de dev commun, les pièges PowerShell/Windows, le `publishFilter` et les conventions communes. Ci-dessous : le spécifique à TW-Hover-Tilt (vendoring, widget, HMR à module vendoré).

## Statut Git

`CLAUDE.md`, `guides/` et `*.code-workspace` sont gitignorés (usage local Claude Code / éditeur, pas destinés aux contributeurs cloneurs). Contenu utile aux contributeurs externe rapatrié dans `README.md` (symlink, commandes) plutôt que dupliqué ici.

## Identité
- Plugin TW `$:/plugins/nikorion/hover-tilt` : widget `<$HoverTilt>` = effet 3D tilt/glare de [hover-tilt](https://hover-tilt.simey.me) sur tout contenu wikitext. Corps du widget = contenu slotté ; auto-fermant = slot vide.
- **Aucune étape de build.** hover-tilt (Svelte 5 en amont) publie un Web Component prébuilt autonome (`<hover-tilt>` auto-enregistré) ; vendoré tel quel dans `modules/hover-tilt.min.js` — « vendorer » = copie de la dépendance committée dans le repo. Sa seule syntaxe ESM (un `export` final) est retirée car la sandbox TW `function(module, exports, require)` refuse `import`/`export` ; la minification terser (~177 → ~59 Ko) est un gain de taille, pas une nécessité. Rationale et détails : README + en-têtes de `hover-tilt.widget.js` et `scripts/vendor-hover-tilt.cjs`.
- v0.1.0 compilait un wrapper Svelte via Vite — abandonné v0.2.0 (le template `svelte-vite-template` d'origine n'existe plus).

## Structure

| Chemin | Rôle |
|---|---|
| `src/hover-tilt/modules/hover-tilt.widget.js` | widget — pipeline, attributs, rationale documentés en tête de fichier |
| `src/hover-tilt/modules/hover-tilt.min.js` | Web Component VENDORÉ (`pnpm vendor:hover-tilt`) — committé, **jamais édité ni lu à la main** (minifié ~59 Ko : le lire ou le grep noie le contexte pour zéro info exploitable — se référer à la lib source `node_modules/hover-tilt`/README, à `hover-tilt.widget.js` et à `guides/hover-tilt-props.md`). Lecture bloquée par un hook (voir Workflow dev) |
| `src/hover-tilt/modules/lang.js` | i18n JS `getString(key)`, même pattern que TW-Math/TW-Chart |
| `src/hover-tilt/language/lingo.tid` | i18n wikitext : procédure `hover-tilt-lingo` (rendu bloc) + fonction `hover-tilt-lingo-text` (chaîne brute pour attributs/titres/HTML inline) — pourquoi deux entrées et cascade non factorisée : commentaire du fichier |
| `src/hover-tilt/language/<lang>/*.multids` | chaînes courtes, un fichier par domaine (`attributes`/`buttons`/`errors`/`settings`) ; titres finaux = clés lingo, indépendants du découpage |
| `src/hover-tilt/language/<lang>/readme.tid` | readme localisé complet ; `readme.tid` racine = sélecteur de langue (transclusion `$mode="block"` — pas lingo, qui enroberait dans `<p>` et aplatirait titres/tableaux — fallback en-GB). Pattern nikorion nouveau |
| `src/hover-tilt/settings.tid` | onglet ControlPanel (défauts globaux) ; libellés `Attribute/*`, réutilisés par le Playground du wiki de dev |
| `src/hover-tilt/default-config.multids` | défauts opiniâtres LIVRÉS comme données (pas constantes JS) : `.../settings/<attr>` |
| `wiki/tiddlers/Playground.tid` | réglage interactif (état `$:/state/.../playground/<attr>`), ouvert par défaut ; **pas livré** avec le plugin depuis 0.6.0 (dans la démo en ligne) ; chaînes : `wiki/tiddlers/language/<lang>/playground.multids` via `detect-language-lingo` |
| `src/hover-tilt/readme,license,history.tid` | à la racine de `src/hover-tilt/` (comme TW-Math, pas de dossier `tiddlers/` séparé) ; exemples d'usage = section du readme |
| `wiki/` | wiki TW de dev (`pluginPath: ../src`) ; `tiddlers/system/` : `$__config_SyncFilter.tid` + plugins de confort |
| `dist/` | sortie du build `plugin-json` (artefact de release), gitignoré |
| `docs/` | démo générée par `pnpm build` (target `demo`), gitignorée — publiée par la CI commune (`../guides/publication.md`) |
| `scripts/vendor-hover-tilt.cjs` | régénère `hover-tilt.min.js` depuis `node_modules/hover-tilt` |
| `scripts/eslint-compact.cjs` | formatter ESLint local (1 ligne/problème, silencieux si propre) — pas de dépendance npm, le `compact` du cœur ayant disparu en ESLint 9 |
| `.github/workflows/ci.yml` | appelle le workflow commun de `tw-dev` (lint, build, GitHub Pages) |

## Commandes

| Commande | Effet |
|---|---|
| `pnpm dev` | TW + HMR de contenu (voir Workflow dev) |
| `pnpm lint` | ESLint sur `src/hover-tilt/modules/*.js` (min.js exclu, vendoré) via formatter compact local `scripts/eslint-compact.cjs` (1 ligne/problème, silencieux si propre — le `stylish` par défaut sortait un bloc multi-lignes coloré coûteux en contexte). Préférer au glob large `npx eslint .` |
| `pnpm lint:fix` | idem + `--fix` (auto-corrige le corrigible sur le même glob ciblé) |
| `pnpm build` | `dist/TW-Hover-Tilt-Plugin.json` — plugin autoporteur + démo `docs/` (JSON via exporteur `JsonFile` — pas `--savetiddler`, voir `../guides/build-html-publishfilter.md`) ; vert = tous les `.tid`/`.info` parsent et le graphe `require()` se résout |
| `pnpm update:hover-tilt` | enchaîne `pnpm update hover-tilt && pnpm vendor:hover-tilt && pnpm build` ; `nodemon` ne met volontairement pas `hover-tilt.min.js` en ignore → restart TW + reload auto si `pnpm dev` tourne |

## Widget — points clés (détail : en-tête `hover-tilt.widget.js` + `guides/hover-tilt-widget-tw.md`)
- Chaque prop résolue en cascade : attribut → tiddler `settings/<attr>` → `undefined` (défaut interne hover-tilt). Attribut vide = non renseigné. Seules constantes JS : `HT_SPRING` (complète un ressort à moitié spécifié) et `BORDER_RADIUS_FALLBACK`.
- Props = propriétés JS camelCase directes sur l'élément (sauf `class`/`style` via `setAttribute`). `refresh()` = mise à jour in place, pas de destroy/remount ; se déclenche aussi sur changement d'un tiddler `settings/*`.
- Ressort en scalaires : `stiffness`/`damping` → `springOptions` ; `tiltStiffness`/`tiltDamping` → `tiltSpringOptions` (absents → hover-tilt réutilise `springOptions`).
- `require()` de la lib gardé derrière `$tw.browser` : `customElements.define` n'existe pas sous Node, et une erreur de module escalade en `process.exit(1)` côté serveur ; le SSR émet un `<hover-tilt>` inerte, réhydraté au chargement navigateur.

## Workflow dev
- `pnpm dev` = serveur partagé `../tw-dev` (voir `../CLAUDE.md`) : le module vendoré `hover-tilt.min.js` reboote TW + reload comme tout `.js` — exception vendorée : `../guides/hmr-tiddlywiki.md` §3.
- Garde-fou indispensable : `$__config_SyncFilter.tid` exclut du sync tiddlyweb le préfixe de tous les plugins nikorion `$:/plugins/nikorion/` (sinon chaque override HMR serait persisté dans `wiki/tiddlers/` et masquerait les shadows définitivement — bug vécu) et `$:/StoryList` (pas d'état de session écrit sur disque ; `$:/DefaultTiddlers` s'applique à chaque boot). Contrepartie voulue : éditer un tiddler du plugin via l'UI ne persiste pas — `src/` est la seule vérité.
- Quitter `pnpm dev` : deux Ctrl+C (normal Windows — cf. workspace `../CLAUDE.md`).
- **Garde-fou lecture du vendoré** : un hook `PreToolUse` (workspace `nikorion/.claude/settings.json` → `.claude/hooks/block-min-js-read.cjs`) refuse tout `Read`/`Grep` ciblant un `*.min.js` (dont `hover-tilt.min.js`). Message de refus → se rabattre sur la lib source / README / modules non minifiés. Vaut pour tous les plugins du workspace.
- **Bruit de sortie (lint, warnings récurrents)** : ne pas recracher intégralement dans le contexte les erreurs peu importantes et récurrentes — coût tokens. Le lint est déjà compact à la source (formatter local, 1 ligne/problème). D'abord `pnpm lint:fix` (auto-corrige le corrigible) ; puis ne remonter qu'un résumé des restants, pas le dump brut. Faux positifs récurrents non corrigibles : les faire taire à la source, ligne par ligne (`// eslint-disable-next-line <regle>` + justification courte en anglais britannique, cf. convention commentaires ; équivalent `// @ts-expect-error` si un jour du TS) plutôt que de les laisser réapparaître indéfiniment dans les sorties.

## Conventions
- Modules JS (sauf vendoré) : IIFE `(function () { "use strict"; ... })()` + `require`/`exports` façon CommonJS — pas d'ES modules — style aligné TW-Math ; `const`/`let` de préférence à `var`.
- En tête de fichier : en-tête TW `/*\ title/type/module-type \*/` puis bloc `/* ... */` de doc détaillée — pas de commentaires paraphrase.
- `hover-tilt.min.js` : committé (pas gitignoré). Sa licence MPL-2.0 exige une notice dans le fichier : `vendor-hover-tilt.cjs` réinjecte le bloc `@license` que terser a retiré (l'en-tête précise aussi que `@date` = date de vendorage, hover-tilt ne publiant pas de date de release).
- `.gitattributes` force `eol=lf` sur tout le texte.

## Pièges vécus (ce repo)
- **BOM UTF-8 ⚠️** : un module JS commençant par `EF BB BF` n'est jamais enregistré par TW (`Cannot find module`). `[System.Text.Encoding]::UTF8` .NET écrit toujours un BOM — n'écrire ces fichiers qu'avec Write/Edit, ou `New-Object System.Text.UTF8Encoding($false)`. Checklist complète : `guides/diagnostic-cannot-find-module.md`.
- **`__` dans un `<style>` wikitext** : un sélecteur CSS à double underscore (BEM) déclenche la syntaxe soulignement (`__x__` → `<u>`), corrompt la règle et avale le `</style>` (tout le reste du tiddler disparaît). Vécu dans `playground.tid` → aucun `__` dans du CSS en wikitext brut.
- Pièges PowerShell détaillés (NNBSP, here-strings CRLF, limites d'Edit) : `../guides/pieges-powershell-windows.md` (workspace).

## Guides détaillés (à lire à la demande — non chargés auto)
- `guides/hover-tilt-props.md` — props de la lib (v1.0.0), types, défauts upstream, `springOptions`.
- `guides/hover-tilt-css.md` — variables CSS `--hover-tilt-*`, parts, piège scintillement du texte vs glare.
- `guides/hover-tilt-effets.md` — ombre, reflet, masques, modes de fusion.
- `guides/hover-tilt-widget-tw.md` — correspondance widget ↔ lib, cascade des valeurs, pièges ressort/Tailwind.
- `guides/diagnostic-cannot-find-module.md` — checklist module TW introuvable.
