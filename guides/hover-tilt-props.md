# hover-tilt — référence des props

Référence condensée de tous les props de la lib [hover-tilt](https://hover-tilt.simey.me) (v1.0.0, MPL-2.0), source de vérité du widget `<$HoverTilt>`. Chaque prop est un attribut du widget (voir [widget-tw.md](hover-tilt-widget-tw.md) pour la correspondance et la résolution des valeurs par défaut).

> **Nommage.** Côté Svelte / propriété JS : `camelCase` (`tiltFactor`). Côté attribut HTML du Web Component natif : `kebab-case` (`tilt-factor`). Le widget `<$HoverTilt>` pilote l'élément par **propriétés JS camelCase** (pas d'attributs kebab), donc les attributs du widget sont eux aussi en `camelCase`.

Guides liés : [CSS exposé](hover-tilt-css.md) · [effets avancés (ombre / reflet / masques)](hover-tilt-effets.md) · [widget TW](hover-tilt-widget-tw.md).

## Props d'interaction

| Prop | Type | Défaut hover-tilt | Rôle |
|---|---|---|---|
| `tiltFactor` | number | `1` | Intensité de l'inclinaison horizontale. Plus haut = inclinaison plus marquée. |
| `tiltFactorY` | number | = `tiltFactor` | Intensité de l'inclinaison verticale. Permet un effet asymétrique quand différent de `tiltFactor`. |
| `scaleFactor` | number | `1` | Zoom au survol. `>1` agrandit, `<1` rétrécit. |
| `springOptions` | objet | `{ stiffness: 0.2, damping: 0.8 }` | Physique du ressort pour l'échelle et l'opacité (Svelte Spring). Voir [ressort](#lobjet-springoptions). |
| `tiltSpringOptions` | objet | = `springOptions` | Ressort **séparé** pour l'inclinaison, si on veut un ressenti différent entre inclinaison et échelle. |
| `enterDelay` | number (ms) | `0` | Délai avant activation quand le curseur entre. Évite le clignotement sur survol bref. |
| `exitDelay` | number (ms) | `200` | Délai avant retour à l'état de repos quand le curseur sort. |

### L'objet `springOptions`

Basé sur le [ressort de Svelte](https://svelte.dev/docs/svelte/svelte-motion#Spring). Deux clés utiles :

| Clé | Défaut | Effet |
|---|---|---|
| `stiffness` | `0.2` | Rigidité. Plus haut = réponse plus rapide/sèche. |
| `damping` | `0.8` | Amortissement. Plus haut = moins d'oscillation/rebond. |

Le widget `<$HoverTilt>` n'expose pas l'objet directement : il le construit à partir des attributs `stiffness`/`damping` (et `tiltStiffness`/`tiltDamping` pour `tiltSpringOptions`). Voir [widget-tw.md](hover-tilt-widget-tw.md).

## Props esthétiques

| Prop | Type | Défaut hover-tilt | Rôle |
|---|---|---|---|
| `shadow` | boolean | `false` | Ombre portée dynamique qui suit l'inclinaison. |
| `shadowBlur` | number (px) | `22` | Rayon de flou de l'ombre. Actif seulement si `shadow`. Aussi réglable via la variable CSS `--hover-tilt-shadow-blur`. |
| `blendMode` | string | `"overlay"` | `mix-blend-mode` de la couche de reflet (`overlay`, `screen`, `multiply`, `plus-lighter`…). Aussi via `--hover-tilt-blend-mode`. |
| `glareIntensity` | number | `1` | Force du reflet. `>1` intensifie, `<1` atténue. Au-delà de `4`, plus d'effet visible avec le dégradé par défaut. |
| `glareHue` | number (0-360) | `270` (lavande) | Teinte du reflet. Aussi via `--hover-tilt-glare-hue`. |
| `glareMask` | string | — | `mask-image` CSS pour confiner le reflet à une zone. Voir [effets](hover-tilt-effets.md#masques-de-reflet-glare-masks). |
| `glareMaskMode` | `match-source` \| `luminance` \| `alpha` \| `none` | — (comport. navigateur : `match-source`) | Interprétation du masque. |
| `glareMaskComposite` | `add` \| `subtract` \| `exclude` \| `intersect` | — (comport. navigateur : `add`) | Composition de plusieurs masques. |
| `class` | string | — | Classe(s) CSS sur l'élément hôte / conteneur. |
| `style` | string | — | Style inline sur le conteneur. |

## Contenu (slot)

hover-tilt applique l'effet à **ce qui est écrit dans son corps** (contenu slotté), pas à un élément fixe — voir les démos « bespoke » (cartes Pokémon). Le widget reflète ce fonctionnement : le corps de `<$HoverTilt>…</$HoverTilt>` devient le contenu slotté. Voir [widget-tw.md](hover-tilt-widget-tw.md).

## Notes

- Les défauts de ce tableau sont ceux de **hover-tilt lui-même**. Le widget `<$HoverTilt>` applique des défauts *plus doux* (ressort souple, ombre activée, `tiltFactor` 1.2), stockés comme données dans les tiddlers `settings/` et non codés en dur — voir [widget-tw.md](hover-tilt-widget-tw.md).
- `glareMask*`, `class`, `style` : détaillés côté effets/CSS dans [hover-tilt-effets.md](hover-tilt-effets.md) et [hover-tilt-css.md](hover-tilt-css.md).
