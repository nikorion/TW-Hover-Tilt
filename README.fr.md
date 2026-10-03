# TW-Hover-Tilt

[English](README.md) · **Français**

![Status](https://img.shields.io/badge/status-experimental-orange)

Un widget TiddlyWiki qui enveloppe le Web Component de [hover-tilt](https://hover-tilt.simey.me) pour appliquer un effet 3D d'inclinaison/reflet au pointeur sur n'importe quel contenu.

## Ce que c'est

TiddlyWiki ne comprend ni npm ni les modules ES : il évalue les tiddlers JS dans une sandbox `function(module, exports, require)`, qui échoue sur `import`/`export`. hover-tilt (lui-même écrit en Svelte 5) fournit son propre Web Component prébuilt — un `<hover-tilt>` autonome, sans dépendance, qui s'enregistre lui-même. Ce plugin vendore ce fichier tel quel (`src/hover-tilt/modules/hover-tilt.min.js` : en-tête TW ajouté, son unique instruction ESM `export` retirée, minifié avec terser), et un widget TiddlyWiki classique le charge via `require()` comme n'importe quel autre module, puis pilote directement l'élément `<hover-tilt>` obtenu.

Il fournit un widget :

- `<$HoverTilt>` — habille tout contenu écrit dans son propre corps avec l'effet 3D d'inclinaison/reflet de hover-tilt, en exposant (presque) toute la surface de props de hover-tilt comme attributs
- une internationalisation à la fois côté JS (`modules/lang.js`) et côté wikitext (`language/lingo.tid`), avec `en-GB` et `fr-FR` fournis
- un playground interactif pour régler tous les attributs à la fois (`$:/plugins/nikorion/hover-tilt/playground`)

Jusqu'à la v0.1.0 ce plugin compilait son propre wrapper Svelte via Vite ; depuis la v0.2.0 il pilote le Web Component prébuilt de hover-tilt et ne compile plus rien lui-même (voir l'onglet history du plugin pour le journal des versions).

## Prérequis

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

## Développer

```
pnpm install
```

Tester dans TiddlyWiki, avec reconstruction automatique et rechargement du navigateur à chaque changement sous `src/hover-tilt/` :

```
pnpm dev
```

`pnpm dev` affiche l'URL à ouvrir (port libre aléatoire, réutilisé au lancement suivant). Il exécute `scripts/dev.cjs` : nodemon reboote TiddlyWiki sur changement de module JS/`plugin.info`, tandis que `scripts/dev-hmr.cjs` pousse à chaud les changements de contenu (`.tid`/`.multids`) via SSE et déclenche un rechargement complet du navigateur après un reboot.

## Mettre à jour hover-tilt

`src/hover-tilt/modules/hover-tilt.min.js` est un fichier vendoré, committé — il n'est **pas** régénéré automatiquement par `pnpm dev` ni `pnpm build`. Pour récupérer une nouvelle version de hover-tilt :

```
pnpm update:hover-tilt
```

Cette commande enchaîne trois étapes : `pnpm update hover-tilt` (met à jour la dépendance npm), `pnpm vendor:hover-tilt` (lit `node_modules/hover-tilt/dist/hover-tilt.js`, retire son unique instruction ESM `export`, le minifie avec terser, et écrit le résultat dans `modules/hover-tilt.min.js` avec un en-tête TW/licence tout neuf — `@date` y désigne la date de vendoring, pas une date de release hover-tilt), puis `pnpm build` pour confirmer que le plugin se charge toujours correctement.

## Tester

Il n'y a pas de suite de tests automatisés. « Tester » signifie ici :

```
pnpm lint         # ESLint sur les modules côté TiddlyWiki (hover-tilt.min.js exclu, car vendoré)
pnpm build        # plugin JSON autoporteur → dist/ ; échoue si un tiddler/module est cassé
pnpm build:site   # site gh-pages → docs/ : démo à moteur externe + bibliothèque de plugins souscriptible
```

Un `pnpm build` qui passe est un signal fort : ça prouve que chaque fichier `.tid`/`.info` se parse et que le graphe de `require()` de chaque module se résout. Ça ne prouve **pas** que le widget s'affiche correctement dans un navigateur — à vérifier manuellement dans un navigateur (URL affichée par `pnpm dev`) après `pnpm dev`.

## Licence

MIT — voir `src/hover-tilt/licence.tid`. Inclut hover-tilt (MPL-2.0) et le runtime Svelte qu'il embarque (MIT).
