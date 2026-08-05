# Vue Typst

La vue Typst (`v=typst` dans l'URL) génère une fiche d'exercices au format [Typst](https://typst.app/docs/), compilée directement dans le navigateur. Elle est accessible depuis les boutons d'export de la page d'accueil (comme la vue A4, uniquement sur `localhost` ou avec `?beta=1`).

## Interfaces

Trois modes d'affichage, mémorisés dans `localStorage` (`mathaleaTypstView`) :

- **Code** : l'éditeur (CodeMirror) seul ;
- **Côte à côte** : le code à gauche, l'aperçu à droite ;
- **Aperçu** : le document compilé seul.

Le code est éditable : chaque modification recompile le document (débounce de 500 ms) et met à jour l'aperçu, en conservant le dernier rendu valide en cas d'échec.

## Éditeur de code

L'éditeur est CodeMirror 6, configuré par `editor/typstEditorSetup.ts` (`typstEditorExtensions()`) : numéros de lignes, coloration syntaxique Typst, repliage, curseurs multiples, recherche, et thème clair ou sombre suivant celui de l'application (compartiment reconfiguré par `setEditorTheme`, appelé depuis un `$effect` sur le store `darkMode`).

- **Coloration syntaxique** : `editor/typstLanguage.ts` définit un `StreamLanguage` Typst (tokeniseur ligne à ligne, pas un analyseur complet) couvrant commentaires, balisage (titres, listes, gras, italique, littéral), mode code après `#` et formules `$…$`. Les noms de jetons émis sont des noms de tags standard, colorés tels quels par `oneDark` (sombre) et `defaultHighlightStyle` (clair). Le `languageData` fournit les jetons de commentaire, ce qui active « commenter / décommenter » (Ctrl/Cmd + /).
- **Raccourcis** : ceux de `defaultKeymap`, `searchKeymap`, `historyKeymap` et `foldKeymap`, plus quelques ajouts (Ctrl/Cmd + S et Ctrl/Cmd + Entrée pour compiler sans attendre le débounce, Ctrl/Cmd + Maj + D pour dupliquer une ligne, Ctrl/Cmd + L pour sélectionner la ligne, Ctrl/Cmd + Alt + ↑/↓ pour ajouter un curseur). Le bouton « Raccourcis » de la barre d'outils (modes Code et Côte à côte) en affiche la liste, avec la touche de modification adaptée à la plateforme.
- **Interface en français** : `editor/editorPhrases.ts` traduit les chaînes de CodeMirror via `EditorState.phrases` (panneau de recherche de Ctrl/Cmd + F, boîte « Aller à la ligne » de Alt + G, annonces pour lecteurs d'écran).
- **Sélection** : `app.css` redéfinit globalement `::selection` avec une couleur de texte noire, illisible sur le fond sombre de l'éditeur. `drawSelection()` dessine le fond de sélection et un correctif de thème (`Prec.highest`) rétablit `color: inherit` sur le texte sélectionné.
- **Repliage** : il n'y a pas d'arbre syntaxique exploitable, le `foldService` se fonde donc sur l'indentation — ce qui correspond à la structure du code généré (exercices, corrections et listes de questions sont des blocs indentés).

## Erreurs de compilation

`typstDiagnostics.ts` transforme les lignes brutes renvoyées par le compilateur (format « unix » : `main.typ:ligne:colonne[-ligne:colonne]: sévérité: message`, positions comptées à partir de 1) en `TypstDiagnostic` : position, sévérité, message traduit en français et piste de résolution. La table de règles (`RULES`) va du plus spécifique au plus général ; un message non couvert reste affiché en anglais, jugé plus utile qu'une approximation, et le message d'origine reste consultable dans le panneau. Un même message répété sur une même ligne n'est affiché qu'une fois, et un diagnostic venant d'un paquet importé est signalé comme tel (sa ligne ne correspond à rien dans l'éditeur).

Côté interface (`Typst.svelte`) :

- le panneau de diagnostics est sous les deux volets, donc visible aussi en mode « Code » ; il se replie, et se rouvre dès qu'une nouvelle erreur apparaît ;
- chaque diagnostic est cliquable (« ligne N ») et amène le curseur sur la position concernée (`revealPosition`), en basculant en « Côte à côte » si on était en « Aperçu » ;
- les lignes fautives sont surlignées dans l'éditeur et marquées d'une pastille dans une marge dédiée (`setEditorMarkers`) ; pendant la frappe, les marqueurs suivent les décalages de lignes jusqu'à la compilation suivante ;
- quand la compilation échoue, un bouton **« Revenir à la dernière version qui compilait »** rétablit le dernier code ayant produit un document (`lastGoodCode`, mémorisé à chaque compilation réussie). L'opération passe par l'historique de CodeMirror : elle est annulable par Ctrl/Cmd + Z.

## Double-clic sur l'aperçu : aller au code

Un double-clic sur l'aperçu (`jumpToSourceFromClick` dans `Typst.svelte`) bascule en « Côte à côte » (si on était en « Aperçu ») et amène le curseur sur l'exercice ou la correction affiché au point cliqué :

1. le clic est converti en coordonnées SVG (mêmes unités que les repères de la palette de mise en page, voir `computeOverlayWidgets`) ;
2. la page cliquée est retrouvée dans `previewPages`, puis le dernier repère `exo`/`corr` (parmi ceux publiés par `buildTypstDocument`, voir la section « Palette de mise en page ») rencontré au-dessus du point cliqué détermine l'exercice ;
3. `findExerciseSourceLine` cherche la ligne où le contenu est réellement éditable. Pour un énoncé, c'est le titre `// ----- Exercice N -----` de sa définition (`#let exN = exo.with(...)`) : le repère `#mathalea-anchor("exo", N)` ne précède que l'appel `#exN()` de la section « Énoncés », où il n'y a rien à modifier. À défaut de définition (mode fusionné, où le contenu suit le repère) — et toujours pour une correction, qui n'a pas de définition séparée — la ligne visée est celle du repère `#mathalea-anchor("exo"|"corr", N)` ;
4. `revealPosition` (dans `editor/typstEditorSetup.ts`) y place le curseur, en dépliant d'abord tout bloc replié qui la contiendrait (`foldedRanges`/`unfoldEffect`).

Un double-clic sur un contrôle de la palette de mise en page (bouton, champ) est ignoré : elle a déjà son propre comportement.

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

## Ajouter un exercice depuis l'aperçu

Le dernier repère de la palette (après le dernier exercice, ou seul repère
d'une fiche vide) porte un bouton **« Ajouter un exercice »** qui ouvre une
modale de navigation dans les référentiels
([`addExercise/TypstAddExerciseModal.svelte`](../../../../src/components/setup/typst/addExercise/TypstAddExerciseModal.svelte)) :

- même parcours que la vue mobile (rubrique > niveau > thèmes > sous-thèmes),
  à partir des rubriques déclarées pour la vue `typst` dans
  [`src/json/mobileMenu.json`](../../../../src/json/mobileMenu.json) (voir
  [Vue mobile — rubriques](../architecture/vue-mobile.md#rubriques-affichées--srcjsonmobilemenujson)) :
  Collège, Lycée général, Lycée professionnel, **Course aux nombres** et
  **Ressources complémentaires** (annales d'examens et ressources partenaires,
  banques d'exercices ajoutées comprises) — ces deux dernières ne sont pas
  proposées sur téléphone ;
- au bout d'un thème, chaque exercice est affiché **en aperçu HTML**
  ([`addExercise/TypstExercisePreview.svelte`](../../../../src/components/setup/typst/addExercise/TypstExercisePreview.svelte)),
  avec une roue dentée qui ouvre le panneau `Settings` de la vue prof et un
  bouton « Ajouter ». Les aperçus sont chargés paresseusement
  (`IntersectionObserver`) : un thème de cinquante exercices ne charge que les
  modules visibles ;
- l'exercice prévisualisé vit dans la carte, hors de `exercicesParams` : les
  réglages faits à la roue dentée sont portés par les paramètres transmis à
  l'ajout. Après un ajout, la carte tire une nouvelle graine (recliquer
  n'ajoute donc pas deux fois le même énoncé) et un badge rappelle combien de
  fois la ressource est déjà dans la fiche ;
- un exercice statique (annale, banque externe) n'a rien à régler : sa roue
  dentée est masquée, comme dans la barre d'exercice de la palette.

On peut naviguer, ajouter plusieurs exercices, puis fermer la modale
(« Valider », croix, Échap ou clic sur le fond).

Côté `Typst.svelte`, `addExerciseToSheet` ajoute les paramètres à
`exercicesParams` (donc à l'URL), charge l'exercice avec le même
`buildExercise` que le chargement de la fiche
([`lib/components/exercisesUtils.ts`](../../../../src/lib/components/exercisesUtils.ts)),
relit les sources `.typ`/images statiques puis régénère le code. Les réglages
de la palette ne sont pas décalés : l'ajout se fait après le dernier exercice,
aucun numéro existant ne change (une insertion de texte présente au dernier
repère se retrouve donc avant le nouvel exercice). Contrairement aux autres
actions qui régénèrent le code, ouvrir la modale ne demande pas confirmation
même si le code a été modifié à la main (`isEdited`) : comme `deleteExercise`,
ajouter un exercice est déjà un geste délibéré, et bloquer la modale derrière
l'avertissement générique interdirait tout ajout tant que le code a été
retouché à la main.

## Lignes en pointillés (« Lignes pour écrire »)

Bouton (icône liste, `bx-detail`) de la barre d'outils de chaque exercice (à côté de « Éditer le code Typst ») : ajoute des lignes en pointillés (pour que l'élève y écrive), réglées **par exercice** — soit après le corps entier de l'exercice, soit après chaque question de cet exercice (y compris la dernière). Le popover règle l'emplacement, le nombre de lignes (0 par défaut : rien ne s'affiche tant qu'il n'est pas incrémenté) et l'espacement (2 em par défaut, pas de 0,5) ; « Retirer » efface le réglage. Ne s'applique jamais à la correction.

Comme la fusion d'exercices (`onToggleMergeBefore`), le réglage change la structure du document (les appels s'intercalent après chaque question en mode « Après chaque question ») : il régénère donc tout le code plutôt que de l'éditer ponctuellement. Porté par `TypstCarryOver.writingLines` (`Record<number, { position, count, spacing }>`, clé = numéro d'exercice 1-based), il survit à la régénération comme les autres réglages de la palette. Chaque appel généré `#mathalea-lignes(n, gutter: ...em)` est tagué d'un marqueur `// mathalea:lignes-fin(N)` ou `// mathalea:lignes-apres(N)`, relu par `harvestCarryOver` (comme `// mathalea:insertion` pour les insertions de texte) ; `shiftCarryOver`/`swapCarryOver` décalent ces réglages à la suppression/au déplacement d'un exercice, comme `tasksLayout`/`codeOverrides`. Le helper Typst réutilisable `#mathalea-lignes(n, gutter: ...)` (`MATHALEA_WRITING_LINES_HELPER` dans `buildTypstDocument.ts`) n'est déclaré dans le préambule que s'il est effectivement utilisé, et ne produit aucun rendu (ni espace) tant que `n` vaut 0.

## Persistance dans l'URL

Toutes les modifications de la fiche sont sauvegardées dans l'URL (paramètre `typstParam`, JSON encodé en base64) pour pouvoir la recharger à l'identique ou la partager :

- `options` : les réglages du document (`TypstDocumentOptions` — format, orientation, polices, titre/sous-titre/en-tête, nombre de versions…) ;
- `carryOver` : les réglages de la palette de mise en page (`harvestCarryOver` — colonnes/espacement des questions par exercice, textes et sections insérés, sauts de page et de colonne, fusions, zoom/alignement des figures).

La liste des exercices, leurs graines et leurs réglages restent portés par les paramètres habituels de l'URL (`exercicesParams`), mis à jour par le store du même nom : suppression, déplacement, changement de graine ou de nombre de questions y sont déjà reflétés.

`persistToUrl` (dans `Typst.svelte`) est appelée après chaque modification (réglage du document ou édition de la palette, via le `updateListener` de CodeMirror). Comme la vue A4 avec `a4Param`, elle écrit dans `typstParamStore` (source de vérité), redéclenche l'écrivain d'URL de l'app (`mathaleaUpdateUrlFromExercicesParams`, sinon sa prochaine écriture débouncée réécrirait l'URL sans `typstParam`) puis pose immédiatement le paramètre avec `history.replaceState`. Au chargement, `parsed.carryOver` est réinjecté dans la première génération du code (`buildCode` part de `urlCarryOver` tant que l'éditeur n'existe pas). `typstParam` est aussi le canal par lequel le diaporama transmet son nombre de vues (`goToTypstWithSeries`).

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/components/setup/typst/Typst.svelte` | La vue : barre d'outils, éditeur, aperçu, exports |
| `src/components/setup/typst/TypstLayoutOverlay.svelte` | Palette de mise en page dessinée par-dessus l'aperçu |
| `src/components/setup/typst/addExercise/TypstAddExerciseModal.svelte` | Modale « Ajouter un exercice » (navigation dans les référentiels) |
| `src/components/setup/typst/addExercise/TypstExercisePreview.svelte` | Aperçu d'un exercice dans cette modale (réglages et ajout) |
| `src/components/setup/typst/buildTypstDocument.ts` | Génère le code Typst complet (en-tête, exercices, corrections) |
| `src/components/setup/typst/latexToTypst.ts` | Convertit le HTML des exercices et les formules LaTeX en Typst |
| `src/components/setup/typst/typstCompiler.ts` | Compilation dans le navigateur via typst.ts (WASM) |
| `src/components/setup/typst/typstDiagnostics.ts` | Lecture et traduction en français des diagnostics du compilateur |
| `src/components/setup/typst/editor/typstEditorSetup.ts` | Extensions CodeMirror de l'éditeur (thèmes, raccourcis, marqueurs d'erreur) |
| `src/components/setup/typst/editor/typstLanguage.ts` | Coloration syntaxique Typst (`StreamLanguage`) |
| `src/components/setup/typst/editor/editorPhrases.ts` | Traduction française de l'interface de CodeMirror |

## Pipeline de génération

1. Les exercices sont chargés comme dans la vue A4 (`buildExercisesList`, graines `alea`, contenu HTML avec formules KaTeX en `$...$`), en régénérant chaque exercice avec `context.isHtml = true` et `context.isTypst = true` (le rendu HTML est réutilisé, pas le rendu LaTeX). Voir [Variantes d'exercices — branches de rendu](../../auteurs-exercices/complements/variantes-exercices.md#branches-de-rendu) pour ce que cela implique côté code d'exercice (branches `context.isHtml` qui posent un composant interactif non convertible).
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

### Images

Chaque `<img>` du contenu HTML d'un exercice (pas seulement les annales scannées) est préchargé par `prefetchStaticImages` (`Typst.svelte`) : ses octets sont récupérés par `fetch` (mis en cache via `cachedBytes`), enregistrés dans le système de fichiers virtuel du compilateur, puis embarqués comme les autres figures. Le chemin virtuel reprend l'extension réelle de l'image (Typst en déduit le format). Une image dont la récupération échoue (hôte externe n'autorisant pas le CORS, réseau indisponible) reste un encart grisé « image non convertie », sans bloquer le reste de la fiche.

Les tableaux HTML (par opposition aux tableaux LaTeX visuels, voir ci-dessus) ne sont **pas convertis** : un encart grisé « tableau non converti » les remplace.

## Compilation dans le navigateur

`typstCompiler.ts` s'appuie sur `@myriaddreamin/typst.ts` : le compilateur WASM (~27 Mo, polices incluses) et le moteur de rendu sont chargés à la première compilation (import dynamique, URL des `.wasm` résolues par Vite). L'aperçu est un rendu SVG du document ; le bouton « Télécharger le PDF » compile en vrai PDF côté client, sans serveur.

## Tests

- `src/components/setup/typst/latexToTypst.test.ts` : conversion des formules et du HTML ;
- `src/components/setup/typst/typstDiagnostics.test.ts` : lecture du format « unix » et traduction des messages ;
- `src/components/setup/typst/buildTypstDocument.test.ts` : structure du document généré. Les cas qui lancent le binaire externe `typst compile` sont exécutés en local quand le CLI `typst` est installé, ignorés en CI par défaut, et réactivables avec `TYPST_CLI_TESTS=1` pour un job dédié ;
- `pnpm typst:check:compile` : vérification explicite par compilation CLI Typst pour les environnements qui installent le binaire `typst`.
