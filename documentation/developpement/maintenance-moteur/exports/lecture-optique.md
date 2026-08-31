# Évaluation papier à lecture optique (OMR)

Produire des sujets papier nominatifs, puis corriger les copies scannées
**entièrement dans le navigateur** : ni les copies, ni la liste de classe, ni
les notes ne sortent du poste du professeur. C'est l'équivalent d'Auto Multiple
Choice sans installation ni serveur.

Vue `v=omr`, derrière `?beta=1` (`src/components/setup/omr/Omr.svelte`).
Moteur dans `src/lib/omr/`.

## Parcours

1. **Générer** — l'aperçu se compile tout seul, sur une copie d'exemple tant
   que la liste de classe est vide. Le professeur règle son document dans le
   volet latéral (liste de classe, mode de graine, en-tête, polices, tailles,
   espacements), ajuste la mise en page directement sur l'aperçu, puis
   télécharge deux fichiers : le PDF des sujets, et un `.mathalea-eval.json`
   contenant le corrigé, le barème et la position de chaque case.
2. **Analyser** — il dépose le PDF des copies scannées et ce fichier. Chaque
   page est rasterisée, son QR-code lu, ses repères de calage retrouvés, ses
   cases mesurées.
3. **Bilan** — grille élève × question, exportable en XLSX, ODS ou CSV.

## Une vue sœur des autres exports Typst

La vue reprend la coque de `Slides.svelte` et `Flashcards.svelte` : NavBar,
onglets d'étape, barre d'outils (Code / Côte à côte / Aperçu, réglages, mise en
page, nouvelles données, téléchargement), volet de réglages, pastilles posées
sur l'aperçu aux positions publiées par les repères `mathalea-anchor`. La barre
d'outils ne s'affiche que sur l'onglet *Générer*.

La palette reprend les icônes, la place et les styles de `TypstLayoutOverlay`
(classes `omr-pill*`, calquées sur `typst-pill*`) : barre de l'exercice au bord
droit de la colonne — monter, descendre, insérer un texte, réglages, nouvelles
données, nombre de questions, dupliquer, supprimer — boîte colonnes/espacement
dans la marge gauche, et pastille de saut de page entre deux exercices. Deux
boutons de la vue « Impression » n'y figurent pas : le **crayon** d'édition du
code d'un exercice, exclu par principe, et les **lignes pour écrire**, qui
n'auraient rien à faire lire optiquement.

Déplacer, dupliquer ou supprimer un exercice touche `exercicesParams`, le store
partagé par toutes les vues. Les réglages de mise en page sont attachés au
*rang* de l'exercice : `decalerOmrCarryOver` et `echangerOmrCarryOver` les
renumérotent en même temps, sans quoi les colonnes de l'exercice 2 se
retrouveraient sur l'exercice 3.

Une seule chose y manque délibérément, et c'est ce qui la distingue de la vue
« Impression » : **on ne peut pas éditer le code d'un exercice**. Les énoncés et
leurs cases sont générés ; les retoucher à la main ferait diverger le sujet
imprimé de son corrigé, sans que rien ne le signale. L'éditeur ne montre donc
que le gabarit (voir plus bas), le corps des questions n'y figurant que par un
appel de fonction.

`separatePages` — préparation du SVG de typst.ts, identique dans les quatre vues
— vit dans `src/components/setup/shared/typstPreview.ts`, avec `anchorPosition`
qui convertit un repère (points, par page) en position sur l'aperçu.

## Le gabarit doit fournir ce que la conversion suppose

`htmlToTypst` ne produit pas du Typst autonome : son code référence le
préambule de la vue « Impression » — `#txt(...)` pour le `\\text{}` de LaTeX,
`police-texte`, `mathalea-fit` pour une figure, `tabvar` pour un tableau de
variations, `mathalea-schema-span`… Le gabarit OMR déclare donc les mêmes
aides, en réutilisant les constantes exportées de `latexToTypst.ts` et de
`buildTypstDocument.ts`, et n'importe un paquet que si le contenu s'en sert
(`detectUsedFeatures`, exporté pour l'occasion). Sans cela, un énoncé
parfaitement ordinaire fait échouer la compilation sur un `unknown variable`
que rien ne laissait prévoir — c'est ce qui est arrivé avec `txt`.

Les **figures** sont recueillies copie par copie (`OmrCopieSource.figures`) et
déclarées **dans** le bloc de contenu de la copie, où le `#let` reste local :
avec une graine par élève, deux copies ont chacune leur `fig-1` sans se
marcher dessus. Sans ce tableau, `htmlToTypst` remplace chaque figure par un
encart « figure non convertie ».

## Le corrigé du professeur

Réglage `corrige` : `aucun` (défaut), `complet` ou `minimal` — ce dernier ne
garde que la réponse mise en évidence, via le `minimalCorrection` de la vue
« Impression ». Les corrigés sont **groupés après toutes les copies**, sur des
pages sans repère de calage ni QR-code : le professeur imprime les premières
pages pour la classe et garde les dernières. `rendreCorriges` regroupe les
copies par **contenu**, pas par réglage de graine : sujet commun ⇒ un seul
corrigé, anonyme ; graines par élève ⇒ un corrigé nommé par version distincte.
Une question sans correction rédigée retombe sur la réponse déduite de ses
cases, ce qui garde un QCM exploitable.

Ces pages ne portent aucune case : `omrRoundTrip` le vérifie sur un document
réellement compilé, car une case y serait comptée comme une réponse d'élève.

## Ce qui est réglable, et ce qui ne l'est pas

`OmrDocumentOptions` (`buildOmrDocument.ts`) reprend les réglages de la vue
« Impression » : habillage de l'en-tête (constantes `HEADER_STYLES`,
`TEXT_FONTS`, `MATH_FONTS` importées de `buildTypstDocument.ts`), polices,
taille, interligne, espacement des exercices, titres, barème, pied de page.

**Le format de page et les marges n'en font pas partie, et n'en feront pas
partie.** Les quatre repères de calage sont posés à 10 mm des bords et
l'en-tête porte un QR-code de 18 mm : ces dimensions sont exactement ce que
`reperesRelatifs` promet au moteur de lecture. Les rendre réglables reviendrait
à laisser le professeur casser silencieusement le recalage de ses propres
copies. A4 portrait, donc, et une marge haute de 42 mm.

L'en-tête nominatif fait exception à son propre réglage : `"aucun"` retire le
titre, jamais le nom ni le QR-code, sans lesquels une feuille isolée serait
impossible à rattacher à sa copie.

**Les polices servies par MathALÉA n'ont pas toutes de graisse grasse.** Noto
Sans, Noto Serif, Lora, Source Sans 3, Ubuntu et OpenDyslexic sont livrées en
graisse 400 seulement (`typst fonts --variants --font-path public/fonts/typst`),
et Typst ne synthétise pas le gras : avec elles, ni les titres d'exercice ni les
numéros de questions ne peuvent l'être. La vue le signale et grise la case
plutôt que de laisser croire à un réglage cassé, et la police par défaut est
Libertinus Serif — comme la vue « Impression », et l'une des rares à avoir une
face grasse. La limite vaut pour tous les exports Typst, pas seulement celui-ci.

## Graine d'aléatoire : commune ou par élève

Par défaut, toute la classe compose la même version des exercices. Au choix,
chaque élève reçoit une version propre : `preparerExercices` accepte une graine
de remplacement (`omrPreparation.ts`), et la vue la construit comme
`` `${graineDeBase}-${eleve.id}` `` — reprendre la même *graine de base*
régénère exactement les mêmes sujets. `decrireDocument` reçoit alors une liste
d'exercices par élève au lieu d'une liste commune.

Les exercices ne sont chargés qu'**une fois** ; produire la version d'un élève
ne demande ensuite qu'une passe de `preparerExercices`. Recharger le référentiel
à chaque graine coûterait trente allers-retours pour une classe entière.

Conséquence pour l'accompagnement : deux copies peuvent avoir la **même
géométrie** de cases tout en attendant des **réponses différentes**.
`sensDesCases` tient donc une table de corrigé *par copie*, et `signature()`
(fusion des mises en page, `omrLayout.ts`) intègre `correct`/`valeur` à sa clé —
sans quoi les corrigés fusionneraient et toute la classe sauf une copie serait
notée sur le mauvais corrigé.

## Gabarit, corps, et palette de mise en page

`assemblerGabarit` (`buildOmrDocument.ts`) sépare le **gabarit** — préambule,
réglages de page, variables de mise en page, insertions, cadre nominatif
`omr-copie` — du **corps** des exercices de chaque copie. L'aperçu compile le
gabarit avec le corps d'**une** copie (`compilerApercu`) ; le téléchargement le
compile avec tous les corps (`compilerEvaluation`). Une retouche du gabarit vaut
donc pour toute la classe sans avoir à être rejouée.

Les questions sont groupées **par exercice** (`OmrExerciceSource`) : l'exercice
est l'unité que règle la palette. Chaque exercice rend ses questions dans un
`#tasks` du paquet `taskize`, comme la vue « Impression », en référençant deux
variables du gabarit :

```typst
#let ex1-colonnes = 1
#let ex1-gutter = 1.2em
#let omr-insertions = (
  "0": [],
  "1": [#pagebreak(weak: true)],
)
```

La palette ne tient aucun état à elle : elle réécrit ces lignes et les relit
(`omrCarryOver.ts`), si bien qu'un réglage fait à la souris survit à une
régénération du gabarit — changer de police ne défait pas les colonnes — et
qu'une retouche faite au clavier est reprise par les pastilles.

Les **insertions** passent par un dictionnaire plutôt que par des variables
numérotées : Typst n'a pas de nom de variable dynamique, et c'est le
dictionnaire qui permet au contenu inséré de vivre dans le gabarit éditable
alors que le point d'insertion, lui, est dans le corps régénéré. Chaque entrée
tient sur une ligne, ce que la relecture exige ; un texte libre y est donc passé
comme **chaîne** Typst, jamais comme contenu `[...]`, pour qu'un crochet ou un
dièse saisi par le professeur y reste un caractère ordinaire.

Un garde-fou au téléchargement : si la version d'un élève compte un exercice de
plus que la copie de l'aperçu, le gabarit édité ne déclare pas ses variables de
mise en page. `nombreExercicesDeclares` le détecte et regénère le gabarit en
reprenant les réglages, plutôt que de laisser la compilation échouer.

## Comment une case est retrouvée sur une feuille scannée

Quatre carrés noirs de 5 mm sont imprimés en fond de page, à 10 mm de chaque
bord. Retrouvés dans l'image, ils donnent les quatre correspondances d'une
**homographie** qui envoie la page théorique sur les pixels du scan, absorbant
décalage, rotation et légère perspective. Aucune bibliothèque de vision n'est
nécessaire : un système 8 × 8 résolu par élimination de Gauss suffit
(`registration.ts`).

Les positions des cases viennent de la compilation elle-même. Chaque case
publie la position absolue de son coin interne dans une métadonnée Typst,
interrogée par `query('<omr-box>')` après compilation
(`omrTypstTemplate.ts`). C'est l'équivalent du fichier de positions d'AMC,
obtenu sans étape séparée — et c'est ce qui dispense MathALÉA de LaTeX ici.

**Le PDF et les positions sortent d'une seule compilation**
(`compileTypstToPdfAndQuery`, dans `src/components/setup/typst/typstCompiler.ts`).
Deux compilations séparées ne garantiraient pas que les positions décrivent le
PDF réellement imprimé ; un décalage d'un millimètre fausserait toute la
correction sans rien signaler.

## Décider qu'une case est cochée

Mesures faites sur des marques simulées, à 150 dpi, sur l'intérieur de la case
réduit de 20 % sur chaque bord :

| marque                        | noirceur |
| ----------------------------- | -------- |
| case vide                     | 0,000    |
| trait débordant d'une voisine | 0,000    |
| barre horizontale             | 0,214    |
| coche ✓                       | 0,338    |
| croix ✗                       | 0,556    |
| case noircie                  | 1,000    |

Deux conséquences de conception.

La marge intérieure de 20 % annule le bruit de bord : un trait qui déborde
d'une case voisine ne compte pas.

Surtout, **aucun seuil fixe ne convient**. Placé à 0,25, il classerait une case
barrée (0,214) comme vide : un faux négatif silencieux, la seule erreur que ce
moteur ne s'autorise pas. Une première version cherchait le seuil par la
méthode d'Otsu appliquée à l'histogramme des noirceurs ; elle échouait pour une
raison de fond, Otsu cherchant à équilibrer deux classes alors qu'au plus une
case sur trois est marquée sur un QCM, souvent une sur dix.

Le seuil est donc déduit du **niveau de fond de la copie**, estimé par le
premier quartile de ses noirceurs — robuste tant que moins des trois quarts des
cases sont marquées. Une case est vide en deçà de `base + 0,08`, cochée au-delà
de `base + 0,16`, ambiguë entre les deux (`readBoxes.ts`). Ce niveau absorbe le
voile gris d'un scanner mal réglé sans que la vigueur du trait des élèves ne le
déplace. Le seuil se calcule **par copie**, ce qui impose de mesurer toutes ses
pages avant d'en classer la moindre case — d'où l'ordre des opérations dans
`analyseScan.ts`.

Corollaire, repris d'AMC : la consigne imprimée demande de **noircir** la case,
pas de la cocher.

Sur un scan médiocre, ce seuil absolu ne suffit pas : le débordement d'une
coche voisine ou une gomme mal effacée fait monter une case vide à 0,25–0,32,
juste au-dessus de `base + 0,16`. Pour une question à **réponse unique**
(`qcmMono`), `affinerChoixUnique` (`readBoxes.ts`) tranche alors par contraste
_dans le groupe_ : quand une case domine franchement — au-dessus du seuil
« cochée », plus sombre que la suivante d'au moins 0,09, et la suivante en deçà
de 80 % d'elle —, elle est retenue et les autres repassent à vide. À défaut de
domination nette, rien n'est modifié : la question part en arbitrage comme
avant. Les questions à choix multiples ne sont pas touchées.

## Rien n'est deviné

Une lecture douteuse ne devient jamais une note. Sont remontés pour arbitrage
plutôt que notés zéro : une case ambiguë, deux cases cochées là où une seule est
attendue, une colonne de chiffres laissée vide, une page absente du lot, une
copie jamais retrouvée (`scoring.ts`, `OmrQuestionStatut`).

## Deux pièges Typst à connaître

**`place(right, dx:)` aligne déjà le bord droit.** Écrire
`dx: -marge - taille` décale les marqueurs d'une largeur de marqueur vers
l'intérieur, sans que rien ne le signale : le générateur et le moteur de lecture
ne sont alors plus d'accord sur la géométrie, et le recalage échoue.

**`counter(page)` lu dans un en-tête est décalé** : l'incrément automatique de
la page n'y est pas encore visible. Le QR-code et les cases publient donc le
rang **physique** de la feuille (`here().position().page`), un fait de mise en
page ; `buildEvaluation` le ramène ensuite au rang dans la copie via
`copies[].pages`.

## Orientation des feuilles

Une feuille passée à l'envers est redressée automatiquement. La détection ne
peut pas reposer sur un échec de décodage — un lecteur de QR-code lit aussi bien
un code à l'envers — et les quatre marqueurs sont symétriques par demi-tour, si
bien que le recalage *réussirait* en lisant chaque case à la place de sa
symétrique. C'est la **position** du QR-code dans l'image qui tranche : imprimé
en haut, retrouvé en bas, la feuille est retournée (`qr.ts`).

## Fichiers

| Fichier                    | Rôle                                                        |
| -------------------------- | ----------------------------------------------------------- |
| `omrTypstTemplate.ts`      | Préambule Typst : marqueurs, case publiant sa position, en-tête et QR |
| `buildOmrDocument.ts`      | `OmrDocumentOptions` ; `assemblerGabarit` (gabarit + corps par copie) ; QCM, grille numérique, cases de barème |
| `omrCarryOver.ts`          | Relecture et réécriture des réglages de mise en page dans le gabarit (palette) |
| `omrLayout.ts`             | Jointure positions ↔ corrigé *par copie*, fusion des mises en page identiques (corrigé compris dans la signature) |
| `omrPreparation.ts`        | Génération interactive des exercices, avec graine de remplacement pour un sujet par élève |
| `genererEvaluation.ts`     | Liste de classe, aperçu SVG d'une copie, compilation, téléchargement des deux fichiers |
| `omrQuestions.ts`          | Exercices MathALÉA → exercices groupés et questions, via `htmlToTypst` |
| `../../components/setup/shared/typstPreview.ts` | Préparation du SVG d'aperçu et position des pastilles, partagée par les quatre vues Typst |
| `pdfRaster.ts`             | Rastérisation des scans par pdf.js, à 150 dpi                |
| `qr.ts`                    | `BarcodeDetector` puis repli `jsqr` ; orientation de la feuille |
| `binarize.ts`              | Otsu et image intégrale (mesure d'un rectangle en temps constant) |
| `registration.ts`          | Détection des marqueurs et homographie                       |
| `readBoxes.ts`             | Mesure et classement des cases                               |
| `scoring.ts`               | Barème, y compris les conventions `b/m/p/P/mz` d'AMC          |
| `analyseScan.ts`           | Chaîne complète, une seule passe de rastérisation             |
| `omrWorker.ts` / `omrWorkerClient.ts` | Analyse hors du fil principal                     |
| `omrExport.ts`             | Bilan en XLSX, ODS et CSV, via `src/lib/spreadsheet.ts`       |

## pdf.js dans un Web Worker

pdf.js doit recevoir **son propre worker**, fabriqué explicitement et passé par
`new PDFWorker({ port })` (`pdfRaster.ts`). Livré à lui-même dans un contexte de
worker, il bascule en mode « faux worker » : il installe alors son propre
`self.onmessage` sur le fil courant, écrase celui de l'appelant et diffuse son
protocole interne vers la page. L'analyse échoue alors sans message exploitable.

## Tests

- `src/lib/omr/*.test.ts` — modules purs : homographie, mesure, barème, export.
- `tests/unit/omrRoundTrip.test.ts` — compile un vrai document, décode les
  QR-codes, recale, noircit des cases et les relit.
- `tests/unit/omrAnalyse.test.ts` — lot de trois copies scannées : pages
  mélangées, feuille à l'envers, copie manquante, scanner mal réglé.

Ces deux derniers exigent le binaire `typst` et sont ignorés s'il est absent.
`tests/unit/omrPngDecode.ts` fournit un décodeur PNG minimal : les tests
tournent sous Node et jsdom, où il n'y a ni canevas ni `ImageData`.

`omrRoundTrip` est aussi ce qui garantit que la mise en page n'a pas cassé la
lecture : il compile pour de bon et relit les cases. C'est lui qui a établi que
le passage des questions dans un `#tasks` de `taskize` ne perturbe pas
`here().position()`, donc que les positions publiées décrivent toujours le PDF
imprimé — le seul point où une régression serait silencieuse.

## Limites connues

- Numérisation à plat attendue (200 à 300 dpi). Les photos au smartphone
  demanderaient un seuillage adaptatif par blocs, non implémenté.
- Pas d'annotation automatique des copies corrigées en PDF.
- L'identification passe par le QR-code nominatif : aucune écriture manuscrite
  n'est lue.
- **La fiabilité n'a pas encore été mesurée sur de vraies copies imprimées puis
  scannées.** C'est la raison pour laquelle la vue reste derrière `?beta=1`.
