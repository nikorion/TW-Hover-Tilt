# Builds & site gh-pages (démo, bibliothèque, CI)

Tout est en TiddlyWiki natif — aucun bundler. Deux éditions TW : `wiki/tiddlywiki.info` (targets `plugin-json` et `demo`) et `library/tiddlywiki.info` (target `library`). Quatre scripts pnpm : `build` (plugin autoporteur `dist/TW-Hover-Tilt-Plugin.json`, artefact de release), `build:demo` (`docs/`), `build:library` (`docs/library/`), `build:site` = demo + library (ce que déploie la CI).

## Artefact plugin JSON (target `plugin-json`)

Produit via l'exporteur core `$:/core/templates/exporters/JsonFile` (variable `exportFilter` restreinte au tiddler-plugin) : un **tableau JSON** contenant le tiddler-plugin avec tous ses champs (`version`, `plugin-type`…) — le format que le désérialiseur JSON du core sait importer par glisser-déposer. ⚠️ Ne pas revenir à `--savetiddler <plugin> ... application/json` : ça n'écrit que le `text` du tiddler (`{"tiddlers":{...}}`), une forme que l'import du core ne reconnaît pas (il attend un tableau d'objets-tiddlers) — l'artefact n'était alors pas installable par drag & drop (bug corrigé). La target `demo` copie le même artefact dans `docs/`.

## Démo à moteur externe (target `demo`)

Au lieu de `$:/core/save/all` (qui embarque le moteur TW + les images en base64 dans un seul HTML géant), la target utilise :

- `$:/core/save/offline-external-js` → `index.html` léger, qui charge le moteur via `<script src="tiddlywikicore-<version>.js">` (fichier séparé, mis en cache par le navigateur entre visites ; ce template exclut aussi `filesystem`/`tiddlyweb`, inutiles en statique) ;
- `--render $:/core/templates/tiddlywiki5.js` → `tiddlywikicore-<version>.js` (le moteur, dont le nom doit matcher la référence ci-dessus — d'où le défaut `tiddlywikicore-$(version)$.js` du template) ;
- images externalisées : `--savetiddlers` sur le filtre `[!is[system]] :filter[get[type]prefix[image/]] -[get[type]match[image/svg+xml]]` vers `images/`, puis `--setfield` `_canonical_uri` + vidage du champ `text` → plus aucune image raster en base64 dans le HTML. Inerte tant qu'aucune image raster n'est empaquetée (l'exemple Pokémon du playground est une URL distante, pas un tiddler).

`publishFilter` (mécanisme core du bouton « Download full wiki ») est passé en args supplémentaires de `--rendertiddler` pour exclure les tiddlers de dev :

```json
"--rendertiddler", "$:/core/save/offline-external-js", "index.html", "text/plain", "",
"publishFilter", "-[[$:/plugins/wikilabs/link-to-tabs]]"
```

- Le `""` juste avant `publishFilter` est le slot `template` : à laisser vide, sinon les index des args nommés se décalent.
- `link-to-tabs` est installé dans `wiki/tiddlers/` (confort de dev) mais exclu du publish ; `highlight` est gardé (utilisé par les codeblocks du readme), ainsi que `$:/nikorion/detect-language` (détection de la langue navigateur, voulue aussi sur la démo) et la feuille de style `$:/nikorion/styles/highlight.css`.

## Langue de la démo

Pas de `$:/language` figé : le tiddler `$:/nikorion/detect-language` (`wiki/tiddlers/system/`, taggé `$:/tags/StartupAction/Browser`, embarqué dans la démo) lit `$:/info/browser/language` au démarrage et bascule sur le plugin de langue installé correspondant (tag exact, sinon sous-tag primaire — ex. `fr-CA` → `fr-FR`), sinon retombe sur `en-GB` (défaut core). Idée reprise du startup de Modern.TiddlyDev, généralisée aux langues réellement installées.

## Bibliothèque de plugins (target `library`)

Édition dédiée `library/tiddlywiki.info` (plugins `tiddlywiki/pluginlibrary` + `nikorion/hover-tilt`) : `--makelibrary` + `--savelibrarytiddlers` (filtre `[[$:/plugins/nikorion/hover-tilt]]`) + rendu de `library.template.html`. Produit `docs/library/index.html` + `recipes/library/tiddlers/…json` : une URL souscriptible depuis le gestionnaire de plugins d'un autre wiki (installation/mise à jour depuis TW).

⚠️ `--makelibrary` scanne **tout** `TIDDLYWIKI_PLUGIN_PATH` (donc tous les plugins nikorion de la machine) — c'est le **filtre de `--savelibrarytiddlers` qui restreint la sortie** à hover-tilt. Ne pas le relâcher.

## CI (`.github/workflows/deploy-pages.yml`)

Sur push (`master`/`main`) ou manuel : recrée le symlink `nikorion/hover-tilt` dans un `TIDDLYWIKI_PLUGIN_PATH` temporaire (indispensable hors machine de dev — la résolution du nom-court en dépend), `pnpm install --frozen-lockfile`, `pnpm build:site`, déploie `docs` sur GitHub Pages (artefact + `deploy-pages`, concurrence limitée à un déploiement).

Prérequis une fois : régler la source Pages sur « GitHub Actions » dans les réglages du dépôt.
