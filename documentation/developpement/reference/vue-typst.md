# Vue Typst

La vue Typst (`v=typst` dans l'URL) génère une fiche d'exercices au format [Typst](https://typst.app/docs/), compilée directement dans le navigateur. Elle est accessible depuis les boutons d'export de la page d'accueil (comme la vue A4, uniquement sur `localhost` ou avec `?beta=1`).

## Interfaces

Trois modes d'affichage, mémorisés dans `localStorage` (`mathaleaTypstView`) :

- **Code** : l'éditeur (CodeMirror) seul ;
- **Côte à côte** : le code à gauche, l'aperçu à droite ;
- **Aperçu** : le document compilé seul.

Le code est éditable : chaque modification recompile le document (débounce de 500 ms) et met à jour l'aperçu. Les erreurs de compilation s'affichent sous l'aperçu au format `fichier:ligne:colonne: message`, en conservant le dernier rendu valide.

## Palette de mise en page

Le bouton « Mise en page » de la barre d'outils affiche des contrôles par-dessus l'aperçu (`TypstLayoutOverlay.svelte`) :

- dans la marge de page (la plus proche de la colonne concernée), à hauteur de chaque liste de questions (environnement `tasks`) : nombre de colonnes (1 à 4) et espacement vertical (pas de 0,25 em) — l'énoncé (`exN`) et sa correction (`exN-corr`) se règlent indépendamment ;
- dans la marge droite, au début de chaque exercice : insertion/modification d'un texte ou d'un titre de section (`#section[...]`, helper émis dans le préambule) **avant** cet exercice, nombre de questions (`nbQuestions`) et suppression de l'exercice (retire aussi son entrée de `exercicesParams`). Quand le nombre de questions change, les questions déjà affichées sont figées (`frozenInputs`, vidé par « Nouvelles données ») : la régénération ne rebrasse pas leurs valeurs, seules les questions ajoutées sont nouvelles ;
- entre les exercices : deux boutons de saut de page et de saut de colonne (ce dernier seulement en document multicolonne) — une fois insérés, ils deviennent des badges bien visibles, retirables d'un clic (le saut de page ferme et rouvre le bloc `en-colonnes`, `#pagebreak` étant interdit dans un conteneur) ;
- à gauche du titre de la fiche : édition du titre, du sous-titre et de la ligne d'en-tête (ces champs ne sont plus dans la fenêtre Réglages ; la valeur est reportée dans les réglages persistés).

Fonctionnement :

1. `buildTypstDocument` émet des repères invisibles `#mathalea-anchor(kind, num)` (métadonnées Typst portant la position `here().position()` en pt) devant chaque `#tasks` (`kind: "tasks"`, ou `"tasks-corr"` dans une correction), devant chaque exercice (`kind: "exo"`), aux points d'insertion (`kind: "gap"`, `num: 0` avant le premier exercice) et devant le bloc de titre (`kind: "header"`). Ils n'ont aucun impact sur la mise en page (vérifié au pixel près).
2. Après chaque compilation, `typstCompiler.ts` interroge le document (`world.query({ selector: '<mathalea-anchor>' })`, même monde de compilation que le rendu SVG) et renvoie les repères (`TypstAnchor`).
3. `Typst.svelte` convertit ces positions en pourcentages du conteneur de l'aperçu (via la géométrie des pages renvoyée par `separatePages`) et place les contrôles.

Les contrôles font des **éditions ciblées du code** dans CodeMirror (pas de régénération) : les boutons modifient les lignes `#let exN-colonnes`/`#let exN-gutter`, les insertions ajoutent une ligne marquée `// mathalea:insertion` après le repère de gap. Elles sont donc annulables (Ctrl+Z) et présentes dans le `.typ` exporté. Ces éditions ne marquent **pas** le code comme « modifié à la main » (`isEdited`) : puisqu'elles survivent à la régénération via le carry-over, elles ne déclenchent pas l'avertissement d'écrasement — seule la frappe directe dans l'éditeur le fait.

À la régénération (réglages, « Nouvelles données »), `harvestCarryOver` relit ces ajustements dans le code courant et les réémet (paramètre `carryOver` de `buildTypstDocument`) : ils survivent à la régénération, contrairement aux autres modifications manuelles. « Réinitialiser les réglages du document » les efface.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/components/setup/typst/Typst.svelte` | La vue : barre d'outils, éditeur, aperçu, exports |
| `src/components/setup/typst/TypstLayoutOverlay.svelte` | Palette de mise en page dessinée par-dessus l'aperçu |
| `src/components/setup/typst/buildTypstDocument.ts` | Génère le code Typst complet (en-tête, exercices, corrections) |
| `src/components/setup/typst/latexToTypst.ts` | Convertit le HTML des exercices et les formules LaTeX en Typst |
| `src/components/setup/typst/typstCompiler.ts` | Compilation dans le navigateur via typst.ts (WASM) |

## Pipeline de génération

1. Les exercices sont chargés comme dans la vue A4 (`buildExercisesList`, graines `alea`, contenu HTML avec formules KaTeX en `$...$`).
2. `buildTypstDocument` assemble le document : réglages éditables en tête de fichier (`#let colonnes`, `#let corrige`, `#let couleur`), en-tête de fiche, un bloc par exercice, section corrections dans un `#if corrige [...]`.
3. `htmlToTypst` convertit chaque contenu : balises simples (`<br>`, `<b>`, `<i>`, `<sup>`, listes...) vers le balisage Typst, échappement des caractères spéciaux, et formules LaTeX converties par [tex2typst](https://github.com/qwinsi/tex2typst).

Particularités de la conversion des formules (`latexMathToTypst`) :

- virgule décimale française rendue sans espace (`3,5` → `3","5`) ;
- `\num`/`\numprint` dépliés en conservant les espaces fines (`\,`) ;
- espaces LaTeX explicites (`\thinspace`, `\medspace`, `\thickspace`) normalisées vers les espaces mathématiques Typst ;
- la mise en évidence `{\color{...}\boldsymbol{...}}` de `miseEnEvidence` est convertie en `#text(fill: rgb("..."))` ;
- en cas d'échec de conversion, la formule est insérée verbatim entre guillemets.

### Figures SVG

Les figures SVG (mathalea2d) sont **embarquées dans le document** : chaque figure est déclarée en tête de fichier (`#let fig-N = image(bytes("<svg...>"), format: "svg", width: ...pt)`) et référencée dans le corps. Le document reste autonome (il compile aussi avec le CLI `typst`). La largeur reprend celle de la figure (96 px CSS = 72 pt). `sanitizeSvg` corrige au passage le SVG pour le parseur XML strict de Typst (point-virgule parasite entre attributs généré par `lib/2d/textes.ts`, entités HTML indéfinies en XML, attributs dupliqués).

Pour les figures mathalea2d qui contiennent des labels KaTeX (`divLatex`), seul le tracé géométrique part dans le SVG. Les labels sont extraits depuis l'annotation TeX KaTeX, convertis en Typst, puis placés par les helpers `mathalea-label` et `mathalea-figure`. Le code généré reste donc éditable côté Typst sans réinjecter le HTML visible de KaTeX.

### Tableaux

Les tableaux LaTeX visuels (`tabular`, `tblr`, ou `array` avec bordures/`\hline`) sont convertis en tableaux Typst avec le package [`tblr`](https://typst.app/universe/package/tblr). L'import `#import "@preview/tblr:0.5.0": *` est ajouté uniquement quand un tableau de ce type est généré. Les commandes `\def\arraystretch{...}` et `\renewcommand{\arraystretch}{...}` sont interprétées comme un agrandissement vertical des cellules (`inset.y`), puis retirées du code final.

Les environnements mathématiques non visuels (`aligned`, `cases`, `array` sans bordures) restent des expressions mathématiques converties par `tex2typst`.

### Schémas en barres et figures 3D

Les schémas en barres (`SchemaEnBoite`, HTML en grille CSS `SchemaContainer`) sont convertis en grilles Typst natives : boîtes avec fond et bordures (les côtés partagés, `border-left: none`, ne sont pas doublés), accolades et flèches étirées sur la largeur de leur cellule par le helper `mathalea-schema-span` (`stretch(brace.t)`/`stretch(<->)`). Les accolades latérales (`latexAccoladeRight`, rares) ne sont pas rendues.

Les empilements de cubes des exercices de motifs (`<canvas-3d>`, rendu WebGL Three.js) n'ont pas d'image extractible : les cubes décrits par l'attribut `content` (JSON) sont redessinés en SVG isométrique (`canvas3dToSvg`), embarqué comme les autres figures. Un contenu 3D sans cubes est remplacé par un encart.

Les images (`<img>`, exercices statiques) et tableaux HTML ne sont **pas convertis** : un encart grisé « image/tableau non converti(e) » les remplace.

## Compilation dans le navigateur

`typstCompiler.ts` s'appuie sur `@myriaddreamin/typst.ts` : le compilateur WASM (~27 Mo, polices incluses) et le moteur de rendu sont chargés à la première compilation (import dynamique, URL des `.wasm` résolues par Vite). L'aperçu est un rendu SVG du document ; le bouton « Télécharger le PDF » compile en vrai PDF côté client, sans serveur.

## Tests

- `src/components/setup/typst/latexToTypst.test.ts` : conversion des formules et du HTML ;
- `src/components/setup/typst/buildTypstDocument.test.ts` : structure du document généré.
