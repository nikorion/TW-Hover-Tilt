# hover-tilt — CSS exposé (variables & parts)

Ce que hover-tilt (v1.0.0) expose côté CSS pour composer ses propres effets par-dessus l'inclinaison/reflet natifs. Utile dès qu'on veut aller au-delà des [props](hover-tilt-props.md) : dégradés suivant le pointeur, halos, effets de bord, finitions type cartes holographiques (voir [effets avancés](hover-tilt-effets.md)).

Guides liés : [props](hover-tilt-props.md) · [effets avancés](hover-tilt-effets.md) · [widget TW](hover-tilt-widget-tw.md).

## Variables CSS de sortie (lecture)

hover-tilt met à jour ces variables en continu pendant l'interaction. On les **lit** dans son propre CSS (sur le contenu slotté) pour piloter des dégradés, ombres, lumières… synchronisés avec le pointeur et l'inclinaison.

| Variable | Plage | Signification |
|---|---|---|
| `--hover-tilt-x` | 0–1 | Position X du pointeur (normalisée). Pratique pour dégradés / éclairage. |
| `--hover-tilt-y` | 0–1 | Position Y du pointeur (normalisée). |
| `--hover-tilt-opacity` | 0–1 | Niveau d'activation courant (ressort interne) — 0 au repos, 1 en pleine interaction. |
| `--hover-tilt-scale` | number | Facteur d'échelle courant (utilisé par le zoom au survol). |
| `--hover-tilt-rotation-x` | deg | Rotation d'inclinaison courante autour de l'axe X. |
| `--hover-tilt-rotation-y` | deg | Rotation d'inclinaison courante autour de l'axe Y. |
| `--hover-tilt-angle` | 0–360 (deg) | Angle horaire du pointeur. Idéal pour les `conic-gradient`. |
| `--hover-tilt-from-center` | px | Distance du pointeur au centre du composant. |
| `--hover-tilt-at-edge` | 0–1 | Proximité d'un bord quelconque. Utile pour les effets de bord. |

## Variables CSS d'entrée (écriture)

Miroirs de props, réglables aussi en CSS (utile pour surcharger par media query, thème, sélecteur…). Équivalents aux props du même nom (voir [props](hover-tilt-props.md)).

| Variable | Prop équivalent |
|---|---|
| `--hover-tilt-glare-intensity` | `glareIntensity` |
| `--hover-tilt-glare-hue` | `glareHue` |
| `--hover-tilt-shadow-blur` | `shadowBlur` |
| `--hover-tilt-blend-mode` | `blendMode` |

## Parts (`::part`)

Le Web Component expose deux parts, ciblables depuis l'extérieur du Shadow DOM via `nom-tilt::part(...)` :

| Part | Rôle |
|---|---|
| `::part(container)` | Enveloppe l'effet ; porte la `perspective`. |
| `::part(tilt)` | Couche animée qui porte le pseudo-élément de reflet. |

Exemple (CSS classique, hors TiddlyWiki) :

```css
hover-tilt::part(container) { perspective: 800px; }
hover-tilt::part(tilt) { border-radius: 16px; }
```

## Dans TiddlyWiki

Le widget `<$HoverTilt>` crée un vrai élément `<hover-tilt>` en light-DOM ; ces variables/parts s'utilisent donc normalement. Le contenu slotté (corps du widget) peut lire les variables de sortie dans un `<style>` local. Le widget applique un `border-radius` de base (réglable, voir [widget-tw.md](hover-tilt-widget-tw.md)) car les couches reflet/ombre de hover-tilt utilisent `border-radius: inherit`.

## Piège : scintillement du texte pendant l'inclinaison

Deux tremblements distincts sont possibles pendant l'animation, à ne pas confondre :

1. **Oscillation du ressort** (physique) — se règle via `tiltStiffness`/`tiltDamping` (voir [widget-tw.md](hover-tilt-widget-tw.md#piège-le-ressort-se-re-règle-sur-pointerenter)).
2. **Scintillement du rendu** (rastérisation) — le contenu slotté (texte, bordures fines) est redessiné pixel par pixel à chaque micro-variation d'angle sous la transform 3D. C'est un problème de compositing GPU, pas de physique.

Diagnostic : mettre `tiltFactor` au maximum et comparer un bloc **sans texte** (dégradé uni) à un bloc avec texte. Si seul le texte tremble, c'est le n°2. Un contenu déjà rastérisé une fois pour toutes — une **image** (`<img>`) — ne scintille pas : le compositeur se contente de le faire pivoter. C'est la parade la plus fiable (voir l'exemple //Image example// du [playground](../src/hover-tilt/playground.tid)).

Pour du texte qu'on veut garder en texte, on peut atténuer avec `-webkit-font-smoothing: antialiased` (sans effet de bord notable).

⚠️ **Piège dans le piège** — les hints qui **promeuvent l'élément en couche compositée** (`transform: translateZ(0)`, `will-change: transform`, `backface-visibility: hidden`) réduisent le scintillement mais créent un **contexte d'isolation** : le `mix-blend-mode` du reflet (glare) ne peut alors plus se fondre dans le contenu → **le glare disparaît**. C'est un compromis direct, pas cumulable avec un reflet en blend-mode. Sur le playground on a donc renoncé à ces hints pour conserver le glare, et on illustre la vraie solution (image) à côté.
