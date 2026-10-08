# hover-tilt — effets avancés (ombre, reflet, masques)

Réglage fin des trois familles d'effets natifs de hover-tilt (v1.0.0) : ombre dynamique, reflet (glare) et masques de reflet. Tout est pilotable via les [props](hover-tilt-props.md) — donc via les attributs du widget `<$HoverTilt>` (voir [widget-tw.md](hover-tilt-widget-tw.md)).

Guides liés : [props](hover-tilt-props.md) · [CSS exposé](hover-tilt-css.md) · [widget TW](hover-tilt-widget-tw.md).

## Ombre dynamique

L'ombre portée suit l'inclinaison (elle « décolle » l'élément du fond).

- `shadow` (boolean) — active/désactive.
- `shadowBlur` (px, défaut hover-tilt `22`) — rayon de flou ; aussi via `--hover-tilt-shadow-blur`.

C'est un effet distinct du reflet : le reflet est une lumière sur la surface, l'ombre est une projection dessous.

## Reflet (glare)

Halo lumineux qui suit le pointeur — la base de tout effet holographique.

- `glareIntensity` (défaut `1`) — force. `>1` intensifie, `<1` atténue ; au-delà de `4`, plus d'effet visible avec le dégradé par défaut.
- `glareHue` (0-360, défaut `270` lavande) — teinte ; aussi via `--hover-tilt-glare-hue`.
- `blendMode` (défaut `overlay`) — `mix-blend-mode` de la couche de reflet ; aussi via `--hover-tilt-blend-mode`.

### Modes de fusion (`blendMode`)

| Mode | Effet | Usage typique |
|---|---|---|
| `screen` | Éclaircit doucement, sans brûler vers le blanc pur | Paillettes, holo classique |
| `overlay` | Multiply (zones sombres) + screen (zones claires) — renforce le contraste existant | Reflet métallique, holo |
| `soft-light` | Version douce de hard-light | Holo, cartes V |
| `hard-light` | Comme overlay mais piloté par la couche du dessus — plus dur | V, VMAX, VSTAR |
| `color-dodge` | Éclaircit agressivement (`base ÷ (1 − blend)`), peut brûler au blanc | Irisé, galaxie, or |
| `color-burn` | Inverse de color-dodge — assombrit agressivement | Galaxie, secret rare |
| `multiply` | Assombrit, n'éclaircit jamais | Motifs tissés |
| `darken` | Garde la couleur la plus sombre, pixel par pixel | Or secret |
| `exclusion` | Comme difference mais plus doux — inverse partiellement | Couches `::after` de profondeur |

`screen` / `overlay` / `soft-light` / `hard-light` sont prévisibles et sûrs pour débuter. `color-dodge` / `color-burn` / `exclusion` sont plus spectaculaires mais très sensibles à ce qu'il y a en dessous : un fond « plat » peut faire paraître l'effet plus faible que prévu.

## Masques de reflet (glare masks)

Confinent le reflet à une forme / un motif, au lieu de couvrir toute la surface. Cœur des finitions type cartes à collectionner (le brillant ne prend que sur l'illustration, pas le cadre).

| Prop | Valeurs | Rôle |
|---|---|---|
| `glareMask` | `url(...)`, dégradé CSS, `url(#svgmask)` | Image/motif qui contraint le reflet. |
| `glareMaskMode` | `match-source` \| `luminance` \| `alpha` \| `none` | Interprétation du masque. |
| `glareMaskComposite` | `add` \| `subtract` \| `exclude` \| `intersect` | Composition de plusieurs masques (finitions multi-couches). |

### `glareMask` — valeurs

- **Image** : `url(/motif.webp)`, `url(/circuit.svg)`.
- **Dégradé CSS** : `repeating-radial-gradient(circle at 30% 30%, #fff, #fff 12px, #fff0 12px, #fff0 24px)`.
- **SVG inline** : `url(#mask)` (référence une `<mask>` du document).

### `glareMaskMode` — interprétation

- `luminance` — lit les valeurs noir & blanc du bitmap (masques PNG/JPG).
- `alpha` — lit la transparence (SVG transparents, dégradés CSS).
- `match-source` — comportement par défaut.

> Safari gère mal les masques `luminance` : préférer `alpha` quand c'est possible.

### Exemple (Web Component natif, kebab-case)

```html
<hover-tilt glare-mask="url(/aztec.webp)" glare-mask-mode="luminance">
  <img src="card.png" />
</hover-tilt>
```

Équivalent widget TW (camelCase) : `<$HoverTilt glareMask="url(/aztec.webp)" glareMaskMode="luminance">…</$HoverTilt>`.

## Aller plus loin en CSS pur

Certaines finitions holographiques (paillettes SVG `feTurbulence`, bandes métalliques `repeating-linear-gradient`, irisation…) se composent **par-dessus** l'inclinaison/reflet natifs, en lisant les [variables CSS de sortie](hover-tilt-css.md) sur le contenu slotté. Le `readme.tid` du plugin contient un tableau de correspondance effet → technique CSS.
