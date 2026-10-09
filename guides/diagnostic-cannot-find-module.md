# Diagnostic « Cannot find module X » dans TiddlyWiki

Checklist, dans l'ordre, quand un module JS du plugin n'est pas trouvé par `require()`.

1. **En-tête TW manquant ou mal formé** — le fichier doit commencer par `/*\`, avec `title:`/`type:`/`module-type:` et `\*/` intacts. `hover-tilt.min.js` n'a par défaut aucun en-tête TW (c'est un fichier `dist/` npm ordinaire) : c'est `scripts/vendor-hover-tilt.cjs` qui l'ajoute. S'il a été copié à la main depuis le CDN/node_modules sans repasser par ce script, l'en-tête manque.
2. **BOM UTF-8** — le fichier ne doit pas commencer par `EF BB BF` : TW ne reconnaît alors pas l'en-tête `/*\`, le module n'est jamais enregistré. Cause la plus fréquente après une écriture PowerShell : `[System.Text.Encoding]::UTF8` en .NET écrit **toujours** un BOM. Écrire sans BOM :
   ```powershell
   $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
   [System.IO.File]::WriteAllText($path, $content, $utf8NoBom)
   ```
   (Sans objet avec les outils Write/Edit de Claude, qui n'émettent pas de BOM.)
3. **Erreur de syntaxe** — `node --check fichier.js` (erreurs syntaxiques seulement, pas runtime). Piège propre à un fichier vendoré depuis un build ESM : un `export { ... };` ou `import ... from ...` resté en place fait échouer le parsing dans la sandbox TW (`function(module, exports, require){...}` n'accepte pas la syntaxe de module ES) — c'est exactement ce que `vendor-hover-tilt.cjs` retire.
4. **Erreur runtime** — le module existe et parse, mais crashe à l'exécution (`require()` échoue silencieusement côté TW).
5. **Symlink manquant** — le titre du plugin doit être résolvable via `TIDDLYWIKI_PLUGIN_PATH` (`nikorion/hover-tilt` → `src/hover-tilt`). Sans ce symlink (créé seul par `pnpm dev`, manuel ailleurs), TW lève `Cannot find plugin 'nikorion/hover-tilt'` plutôt qu'une erreur de module, mais la cause racine est apparentée (résolution de titre).

Vérification directe du contenu d'un tiddler dans le JSON buildé (tableau JSON dont l'élément 0 est le tiddler-plugin ; son `text` contient le paquet `{"tiddlers":{...}}`) :

```
node -e "console.log(JSON.parse(require('./dist/TW-Hover-Tilt-Plugin.json')[0].text).tiddlers['$:/plugins/nikorion/hover-tilt/modules/hover-tilt.min.js'])"
```
