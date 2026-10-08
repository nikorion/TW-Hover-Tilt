# `<$HoverTilt>` — le widget TiddlyWiki

Comment le widget `<$HoverTilt>` (plugin `$:/plugins/nikorion/hover-tilt`) expose toute la surface de la lib [hover-tilt](https://hover-tilt.simey.me) dans TiddlyWiki. Pour le détail de chaque effet, voir [props](hover-tilt-props.md), [CSS exposé](hover-tilt-css.md), [effets avancés](hover-tilt-effets.md).

## Principe

Le widget crée un vrai élément `<hover-tilt>` (le Web Component vendoré) et lui pousse chaque prop comme **propriété JS camelCase** (le wrapper custom-element de Svelte 5 expose un accesseur par prop) — donc pas de traduction kebab-case, et les objets (`springOptions`) passent tels quels. `class`/`style` passent par `setAttribute()` (attributs HTML globaux spéciaux). Le **corps** du widget devient le contenu slotté :

```
<$HoverTilt tiltFactor="2" glareHue="150">
  <div class="card">…</div>
</$HoverTilt>
```

Auto-fermant (`<$HoverTilt/>`), il incline un slot vide.

## Résolution des valeurs (attribut → réglage → défaut)

Pour chaque prop, la valeur est résolue **en cascade** — objectif : le moins de valeurs codées en dur possible.

1. **Attribut du widget** — ex. `tiltFactor="2"`. Priorité maximale, portée locale à l'instance.
2. **Réglage global** — tiddler `$:/plugins/nikorion/hover-tilt/settings/<attr>` (édité via l'onglet ControlPanel, voir plus bas). Défaut appliqué à toutes les instances qui ne surchargent pas l'attribut.
3. **Défaut hover-tilt** — si ni attribut ni réglage, la valeur reste indéfinie et **hover-tilt applique son propre défaut interne** (voir colonne « Défaut hover-tilt » dans [props](hover-tilt-props.md)).

Conséquence : les défauts *opiniâtres* du plugin (ressort souple, ombre activée, `tiltFactor` 1.2…) ne sont **pas** codés en dur dans le JS — ils vivent comme **données** dans les tiddlers `settings/` livrés avec le plugin (fichier `settings/defaults.multids`). Modifier un défaut = éditer une donnée, pas le code.

## Attributs

Tous les [props hover-tilt](hover-tilt-props.md) sont exposés en camelCase. Le ressort est éclaté en attributs scalaires (plus simple à régler qu'un objet en wikitext) :

| Attribut widget | Prop hover-tilt | Note |
|---|---|---|
| `tiltFactor`, `tiltFactorY`, `scaleFactor` | idem | |
| `stiffness`, `damping` | → `springOptions` | Assemblés en `{ stiffness, damping }`. |
| `tiltStiffness`, `tiltDamping` | → `tiltSpringOptions` | Ressort **séparé** de l'inclinaison. Non renseignés = `tiltSpringOptions` non défini → hover-tilt réutilise `springOptions`. |
| `enterDelay`, `exitDelay` | idem | ms. |
| `shadow` | idem | `yes`/`no` (ou `true`/`false`). |
| `shadowBlur` | idem | |
| `blendMode` | idem | |
| `glareIntensity`, `glareHue` | idem | |
| `glareMask`, `glareMaskMode`, `glareMaskComposite` | idem | Voir [effets](hover-tilt-effets.md#masques-de-reflet-glare-masks). |
| `class`, `style` | idem | Via `setAttribute()`. |
| `borderRadius` | (structurel) | Rayon de base du conteneur (les couches reflet/ombre héritent via `border-radius: inherit`). Défaut `12px`. |

> Une valeur d'attribut vide (`""`) est traitée comme *non renseigné* → on retombe sur le réglage global puis le défaut hover-tilt. Retirer un attribut au refresh réinitialise donc proprement la prop.

## Réglages globaux (onglet ControlPanel)

Le tiddler `$:/plugins/nikorion/hover-tilt/settings` (taggé `$:/tags/ControlPanel/SettingsTab`) offre une UI pour éditer les défauts globaux. Chaque contrôle écrit `$:/plugins/nikorion/hover-tilt/settings/<attr>` ; le bouton reset supprime la surcharge pour revenir à la valeur livrée (shadow tiddler de `defaults.multids`).

Le widget se rafraîchit quand un tiddler `settings/*` change : ajuster un réglage met à jour **toutes** les instances live.

> Namespace conforme à la convention nikorion : fichier + titre `settings` (pas `config`), défauts sous `.../settings/`.

## Piège : le ressort se re-règle sur `pointerenter`

hover-tilt ne ré-applique `stiffness`/`damping` (de `springOptions` / `tiltSpringOptions`) sur ses ressorts vivants qu'au moment du **`pointerenter`** (fonction `M()` dans la source). Conséquence : changer une valeur de ressort *pendant* que le curseur est déjà sur l'élément ne se voit pas — il faut **sortir puis re-survoler** pour que le nouveau ressort prenne effet. Ça vaut aussi pour le playground (curseurs `stiffness`/`damping`/`tilt*`) et les réglages globaux. Ce n'est pas un ressort figé à l'init : pas besoin de recréer l'élément, juste de re-entrer. Contre le tremblement, monter `tiltDamping` (→ ~1) est le vrai levier ; baisser `tiltStiffness` ne fait que ralentir le suivi.

## Piège : les snippets de la doc hover-tilt sont écrits pour Tailwind

Le [site hover-tilt](https://hover-tilt.simey.me) présente ses exemples en **Tailwind**. Copiés tels quels dans un wiki (sans Tailwind), leurs `class` sont **inertes** — le composant s'affiche, mais rien ne cadre le contenu slotté. Deux symptômes classiques :

- **Coins non arrondis / angles qui dépassent** : `class="rounded-[inherit]"` (sur l'`<img>`) et `class="[&::part(container)]:rounded-[4.55%/3.5%]"` (arbitrary variant Tailwind ciblant `::part(container)`) ne produisent aucune règle CSS. L'hôte est arrondi (via `borderRadius`, défaut `12px`) mais l'image reste carrée → ses coins débordent de la zone arrondie.
- **Contenu trop grand** : sans Tailwind ni layout, une `<img>` s'affiche à sa **taille naturelle** ; rien ne la contraint.

Retraduction en TiddlyWiki (vrai CSS + attributs du widget) :

```
<style>
.pkmn-card { max-width: 240px; height: auto; border-radius: inherit; display: block; }
</style>

<$HoverTilt shadow="yes" borderRadius="4.55% / 3.5%">
<img class="pkmn-card" src="…" alt="…" loading="lazy"/>
</$HoverTilt>
```

Règles de portage : `shadow="yes"` (pas `shadow` nu, traité comme vide → non renseigné) ; l'arrondi voulu passe par l'attribut `borderRadius` (l'`<img>` le récupère via `border-radius: inherit`) ; la taille par un `max-width` CSS. Le Web Component lui-même fonctionne à l'identique — seule la **couche de style Tailwind** est à remplacer. Exemple vivant dans le [playground](../src/hover-tilt/playground.tid) (section //Image example//).

## Cycle de vie (rappel)

`render()` crée `<hover-tilt>`, applique les props, rend le corps dedans (slot natif), l'insère. `refresh()` relit attributs + réglages et pousse les nouvelles props sur l'élément existant — **pas de destroy/remount**. `destroy()` délègue à la base (retire l'élément → son `disconnectedCallback` nettoie l'instance Svelte interne).

Détail complet du pipeline : voir le bloc de doc en tête de `modules/hover-tilt.widget.js` et le `CLAUDE.md` du plugin.
