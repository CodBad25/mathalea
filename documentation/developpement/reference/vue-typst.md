# Vue Typst

La vue Typst (`v=typst` dans l'URL) génère une fiche d'exercices au format [Typst](https://typst.app/docs/), compilée directement dans le navigateur. Elle est accessible depuis les boutons d'export de la page d'accueil (comme la vue A4, uniquement sur `localhost` ou avec `?beta=1`).

## Interfaces

Trois modes d'affichage, mémorisés dans `localStorage` (`mathaleaTypstView`) :

- **Code** : l'éditeur (CodeMirror) seul ;
- **Côte à côte** : le code à gauche, l'aperçu à droite ;
- **Aperçu** : le document compilé seul.

Le code est éditable : chaque modification recompile le document (débounce de 500 ms) et met à jour l'aperçu. Les erreurs de compilation s'affichent sous l'aperçu au format `fichier:ligne:colonne: message`, en conservant le dernier rendu valide.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/components/setup/typst/Typst.svelte` | La vue : barre d'outils, éditeur, aperçu, exports |
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

Les images (`<img>`, exercices statiques) et tableaux HTML ne sont **pas convertis** : un encart grisé « image/tableau non converti(e) » les remplace.

## Compilation dans le navigateur

`typstCompiler.ts` s'appuie sur `@myriaddreamin/typst.ts` : le compilateur WASM (~27 Mo, polices incluses) et le moteur de rendu sont chargés à la première compilation (import dynamique, URL des `.wasm` résolues par Vite). L'aperçu est un rendu SVG du document ; le bouton « Télécharger le PDF » compile en vrai PDF côté client, sans serveur.

## Tests

- `src/components/setup/typst/latexToTypst.test.ts` : conversion des formules et du HTML ;
- `src/components/setup/typst/buildTypstDocument.test.ts` : structure du document généré.
