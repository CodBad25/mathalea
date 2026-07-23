# Formats interactifs spécialisés

Ce cookbook complète
[Ajouter une interactivité simple](../interactivite-simple.md). Il rassemble les
formats spécialisés à utiliser lorsqu'un champ MathLive simple ne suffit pas.

## Le modèle à retenir

Dans une question interactive, il y a presque toujours trois choses à écrire :

1. injecter l'élément interactif dans `texte` ;
2. écrire une correction lisible dans `texteCorr` ;
3. déclarer la réponse attendue avec `handleAnswers()`.

Exemple minimal :

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

// Dans nouvelleVersion(), pour la question i :
texte += 'Question visible par l’élève.'
texteCorr += 'Correction visible après validation.'

handleAnswers(
  this,
  i,
  {
    reponse: { value: reponseAttendue },
  },
  { formatInteractif: 'format-a-utiliser' },
)
```

Depuis `src/exercices/6e/`, les imports commencent souvent par `../../lib/...`. Depuis `src/exercices/can/6e/`, ils commencent plutôt par `../../../lib/...`.

## Champ MathLive simple

À utiliser pour saisir un nombre, une fraction, un calcul, une expression ou une grandeur.

```ts
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'

const resultat = a + b

texte += `$${a}+${b}=$ `
texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)

texteCorr += `$${a}+${b}=${resultat}$`

handleAnswers(
  this,
  i,
  {
    reponse: { value: resultat },
  },
  { formatInteractif: 'mathalea-mathfield' },
)
```

Le helper injecte un custom element `mathalea-mathfield`.

## Champ texte simple

À utiliser pour une réponse textuelle sans MathLive.

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexte } from '../../lib/interactif/questionMathLive'

texte += `Nommer la figure : `
texte += ajouteChampTexte(this, i, '', { placeholder: 'Réponse' })

texteCorr += 'La figure est un rectangle.'

handleAnswers(
  this,
  i,
  {
    reponse: {
      value: 'rectangle',
      options: { texteSansCasse: true },
    },
  },
  { formatInteractif: 'mathalea-textfield' },
)
```

Le helper injecte un custom element `mathalea-textfield`.

## Texte à trous

À utiliser quand plusieurs champs doivent apparaître dans une même phrase ou formule.

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../lib/interactif/questionMathLive'

texte += remplisLesBlancs(
  this,
  i,
  '$%{champ1}+%{champ2}=%{champ3}$',
  '',
  '\\ldots',
)

texteCorr += `$${a}+${b}=${a + b}$`

handleAnswers(
  this,
  i,
  {
    champ1: { value: a },
    champ2: { value: b },
    champ3: { value: a + b },
  },
  { formatInteractif: 'fill-in-the-blank' },
)
```

Le helper injecte un custom element `fill-in-the-blank`. Les noms `champ1`, `champ2`, etc. doivent être les mêmes dans le modèle et dans `handleAnswers()`.

## Tableau MathLive

À utiliser pour saisir des réponses dans un tableau.

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import {
  AddTabDbleEntryMathlive,
  creeTableauMathliveElement,
} from '../../lib/interactif/tableaux/AjouteTableauMathlive'

const tableau = AddTabDbleEntryMathlive.convertTclToTableauMathlive(
  ['', 'Prix'],
  ['Quantité'],
  [''],
)

texte += creeTableauMathliveElement({
  numeroExercice: this.numeroExercice,
  question: i,
  tableau,
  typeTableau: 'doubleEntree',
})

texteCorr += `Le prix est $${prix}$ €.`

handleAnswers(
  this,
  i,
  {
    L1C1: { value: prix },
  },
  { formatInteractif: 'tableau-mathlive' },
)
```

Le helper injecte un custom element `tableau-mathlive`.

## QCM

À utiliser pour cocher une ou plusieurs propositions.

```ts
import { addMathaleaQcm } from '../../lib/customElements/MathaleaQcm'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const propositions = [
  { texte: '$4$', statut: true },
  { texte: '$5$', statut: false },
  { texte: '$6$', statut: false },
]

texteCorr += 'La bonne réponse est $4$.'

handleAnswers(
  this,
  i,
  {
    qcm: {
      enonce: texte,
      propositions,
      correction: texteCorr,
      options: { ordered: false, radio: true },
    },
  },
  { formatInteractif: 'mathalea-qcm' },
)

texte += addMathaleaQcm(this, i, { radio: true })
```

`addMathaleaQcm()` injecte un custom element `mathalea-qcm`. Pour un nouvel exercice, préférer ce format moderne à l'ancien helper `propositionsQcm()`, qui reste utile pour maintenir les exercices existants.

## Liste déroulante

À utiliser pour choisir une réponse dans un menu.

```ts
import { choixDeroulant } from '../../lib/customElements/ListeDeroulanteElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const choices = [
  { label: 'Choisir', value: '' },
  { label: 'rectangle', value: 'rectangle' },
  { label: 'triangle', value: 'triangle' },
]

texte += choixDeroulant(this, i, { choices, choix0: false })
texteCorr += 'La figure est un rectangle.'

handleAnswers(
  this,
  i,
  { reponse: { value: 'rectangle' } },
  { formatInteractif: 'liste-deroulante' },
)
```

Le helper injecte un custom element `liste-deroulante`.

## Multi Mathfield

À utiliser quand plusieurs champs MathLive doivent être coordonnés, mais sans passer par un texte à trous simple.

```ts
import { addMultiMathfield } from '../../lib/customElements/MultiMathfield'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

texte += addMultiMathfield(this, i, {
  dataTemplate: '$x=%{field0}$ et $y=%{field1}$',
  dataOptions: {
    field0: { texteAvant: '' },
    field1: { texteAvant: '' },
  },
})

texteCorr += `$x=${x}$ et $y=${y}$.`

handleAnswers(
  this,
  i,
  {
    field0: { value: x },
    field1: { value: y },
  },
  { formatInteractif: 'multi-mathfield' },
)
```

Le helper injecte un custom element `multi-mathfield`.

## Sélection de SVG

À utiliser quand l'élève doit sélectionner un ou plusieurs dessins. La réponse est la somme des valeurs des SVG sélectionnés.

```ts
import { addSvgSelection } from '../../lib/customElements/SvgSelectionElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const svgs = [
  { svg: svgA, value: 1 },
  { svg: svgB, value: 2 },
  { svg: svgC, value: 4 },
]

texte += addSvgSelection(this, i, { svgs })
texteCorr += 'Il fallait sélectionner les deux premiers dessins.'

handleAnswers(
  this,
  i,
  { reponse: { value: 3 } },
  { formatInteractif: 'svg-selection' },
)
```

Ici, sélectionner `svgA` et `svgB` donne `1 + 2 = 3`.

## Figure cliquable

À utiliser quand les figures existent déjà dans l'énoncé et que l'élève doit cliquer sur certaines d'entre elles.

```ts
import { addCliqueFigure } from '../../lib/customElements/CliqueFigureElement'

this.cliqueFiguresArray ??= []
this.cliqueFiguresArray[i] = [
  { id: `figureAEx${this.numeroExercice}Q${i}`, solution: true },
  { id: `figureBEx${this.numeroExercice}Q${i}`, solution: false },
]

texte += `<div id="figureAEx${this.numeroExercice}Q${i}">${svgA}</div>`
texte += `<div id="figureBEx${this.numeroExercice}Q${i}">${svgB}</div>`
texte += addCliqueFigure(this, i)

texteCorr += 'Il fallait cliquer sur la figure A.'
```

Le helper injecte un custom element `clique-figure` et renseigne le `formatInteractif`. Ici, on n'appelle pas `handleAnswers()` : la réponse attendue est portée par `this.cliqueFiguresArray[i]`.

## Glisser-déposer

À utiliser quand l'élève doit placer des étiquettes dans des zones.

```ts
import DragAndDrop from '../../lib/interactif/DragAndDrop'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const leDragAndDrop = new DragAndDrop({
  exercice: this,
  question: i,
  consigne: 'Compléter avec les étiquettes disponibles.',
  enonceATrous: '$3+4$ donne %{rectangle1}.',
  etiquettes: [
    [
      { id: 'sept', contenu: '$7$' },
      { id: 'huit', contenu: '$8$' },
    ],
  ],
})

this.dragAndDrops ??= []
this.dragAndDrops[i] = leDragAndDrop

texte += leDragAndDrop.ajouteDragAndDrop({
  melange: true,
  duplicable: false,
})

texteCorr += '$3+4=7$.'

handleAnswers(
  this,
  i,
  {
    rectangle1: { value: 'sept' },
  },
  { formatInteractif: 'drag-and-drop' },
)
```

`DragAndDrop.ajouteDragAndDrop()` injecte un custom element `drag-and-drop`. Les zones s'appellent `rectangle1`, `rectangle2`, etc.

## Champs dans une figure 2D

À utiliser quand un champ doit être posé dans une figure produite par `mathalea2d()`.

```ts
import { MetaInteractif2d } from '../../lib/2d/interactif2d'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { mathalea2d } from '../../modules/mathalea2d'

const input = new MetaInteractif2d(
  [
    {
      content: '%{champ1}\\text{ cm}^2',
      x: 2,
      y: 1,
      classe: '',
      blanc: '\\ldots ',
      opacity: 1,
      index: 0,
    },
  ],
  { exercice: this, question: i },
)

texte += mathalea2d({ xmin: 0, ymin: 0, xmax: 5, ymax: 3 }, [figure, input])
texteCorr += mathalea2d({ xmin: 0, ymin: 0, xmax: 5, ymax: 3 }, [figure])
texteCorr += `Aire : $${aire}\\text{ cm}^2$.`

handleAnswers(
  this,
  i,
  {
    field0: {
      value: aire,
      options: { unite: true },
    },
  },
  { formatInteractif: 'meta-interactif-2d' },
)
```

`mathalea2d()` injecte les custom elements `meta-interactif-2d` autour des champs. Les réponses s'appellent `field0`, `field1`, etc., selon l'`index` des inputs.

## Demi-droite interactive

À utiliser pour placer un ou plusieurs points sur une demi-droite graduée.

```ts
import { demiDroiteInteractive } from '../../lib/customElements/demi_droite_interactive'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

texte += demiDroiteInteractive(this, i, {
  x0: 0,
  minT: 0,
  maxT: 10,
  partsCount: 10,
  points: [],
})

texteCorr += 'Le point attendu est en $3$.'

handleAnswers(
  this,
  i,
  {
    reponse: {
      value: JSON.stringify({
        x0: 0,
        maxT: 10,
        partsCount: 10,
        showwNegative: false,
        points: [{ pointValue: 3, label: 'A' }],
      }),
    },
  },
  { formatInteractif: 'demi-droite-interactive' },
)
```

La réponse attendue est une configuration sérialisée, pas seulement l'abscisse du point. L'objet `points` contient les points que l'élève doit placer, avec leur `pointValue` et leur `label`. La clé `showwNegative` correspond au nom historique attendu par la vérification. Vérifier un exercice existant proche, par exemple `6N3D-2.ts`, si plusieurs points ou des fractions sont attendus.

## Cercle trigonométrique

À utiliser pour sélectionner une position sur le cercle trigonométrique.

```ts
import {
  selectionCercleTrigo,
  trigoCircleSelectionValue,
} from '../../lib/customElements/TrigoCircleSelectionElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const solutions = question.solutions

handleAnswers(
  this,
  i,
  {
    reponse: {
      value: trigoCircleSelectionValue(
        solutions.map((solution) => solution.angleRad),
      ),
    },
  },
  { formatInteractif: 'trigo-circle-selection' },
)

texte += selectionCercleTrigo(this, i, {
  showAngleLabels: true,
  showCoordinateLabels: Boolean(this.sup2),
  style: 'display:block; max-width: 46rem;',
})

texteCorr += 'Il fallait sélectionner les points correspondant aux solutions.'
```

`trigoCircleSelectionValue()` transforme la liste des angles attendus en valeur numérique vérifiable par le custom element. Chaque angle vient de `solution.angleRad`, comme dans l'exercice `2mTrigoFct-3.ts`. Les options exactes dépendent du type de sélection voulu ; partir de cet exercice si le cercle doit gérer plusieurs réponses.

## Horloge interactive

À utiliser pour faire régler une heure.

```ts
import { addInteractiveClock } from '../../lib/customElements/InteractiveClock'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import Hms from '../../modules/Hms'

texte += addInteractiveClock(this, i, {
  interactivityOn: this.interactif,
  showHands: this.interactif,
})

texteCorr += addInteractiveClock(this, i, {
  id: `interactive-clock-correctionEx${this.numeroExercice}Q${i}`,
  hour,
  minute,
  interactivityOn: false,
  showHands: true,
})

handleAnswers(
  this,
  i,
  {
    reponse: {
      value: new Hms({ hour, minute }).toString(),
    },
  },
  { formatInteractif: 'interactive-clock' },
)
```

La réponse attendue est la chaîne produite par `Hms.toString()`. Le custom element sauvegarde la réponse élève comme objet sérialisé, puis la vérification reconstruit l'heure attendue avec `Hms.fromString()`, comme dans l'exercice `canc3D04.ts`.

## Guide-âne

À utiliser pour un guide-âne interactif dans une construction géométrique.

```ts
import { addGuideAne } from '../../lib/customElements/GuideAne'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const targetAB = 12
const targetN = 5
const targetP = 3
const targetFraction = `\\dfrac{${targetP}}{${targetN}}`
const targetValue = (targetAB * targetP) / targetN

texte += addGuideAne(this, i, {
  alpha: 45,
  targetAB,
  targetFraction,
  targetValue,
  snapToCentimeter: true,
  disableADrag: true,
  displayTargetOn: false,
})

texteCorr += `$AD=${targetFraction}\\times AB=${targetValue}$ cm.`

handleAnswers(
  this,
  i,
  {
    reponse: {
      value: JSON.stringify({
        n: targetN,
        p: targetP,
        lengthAD: targetValue,
        lengthAB: targetAB,
      }),
    },
  },
  { formatInteractif: 'guide-ane' },
)
```

La réponse attendue est une configuration sérialisée du rapport à construire. `alpha` règle l'inclinaison du guide-âne, mais ce n'est pas la réponse vérifiée. Le custom element vérifie que la construction atteint la cible, comme dans l'exercice `4G30-0.ts`.

## Tableur

À utiliser quand l'élève doit compléter une petite feuille de calcul.

```ts
import { addSheet } from '../../lib/customElements/MySpreadSheet'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

texte += addSheet(this, i, {
  data: [
    ['Nombre', 'Double'],
    [3, ''],
  ],
  minDimensions: [2, 2],
  columns: [{ width: 90 }, { width: 90 }],
  interactif: this.interactif,
  showVerifyButton: false,
})

texteCorr += 'Voici la formule à saisir en cellule B2 : `=A2*2`.'

handleAnswers(
  this,
  i,
  {
    sheetAnswer: {
      goodAnswerFormulas: [
        {
          ref: 'B2',
          formula: '=A2*2',
        },
      ],
      sheetTestDatas: [
        {
          ref: 'A2',
          rangeValues: [1, 20],
        },
      ],
    },
  },
  { formatInteractif: 'my-spreadsheet' },
)
```

La réponse attendue décrit les formules à vérifier, pas les valeurs affichées dans les cellules. Pour un exemple plus complet avec plusieurs situations, partir de `6I1B-7.ts`.

Le tableur a beaucoup d'options. Pour un nouvel exercice, copier d'abord un cas existant proche.

## Tableau de signes ou de variations

À utiliser pour faire compléter un tableau de signes ou de variations.

```ts
import { addTableauSignesVariations } from '../../lib/customElements/TableauSignesVariationsElement'

texte += addTableauSignesVariations(this, i, {
  tableau: tableauInteractif,
  correction: tableauCorrection,
})

texteCorr += 'Le tableau complété est donné ci-dessus.'
```

Ce helper déclare lui-même les données nécessaires à la vérification. Lire aussi `src/lib/interactif/tableauSignesVariations/DOCUMENTATION.md` avant de créer un nouveau tableau.

## Scratch et Blockly

Ces éléments servent surtout aux exercices de programmation visuelle.

```ts
import { addScratchEditor } from '../../lib/customElements/ScratchEditor'

texte += addScratchEditor(this, i, {
  height: '250px',
  width: '640px',
  interactivityOn: true,
})
```

```ts
import { addBloklyEditor } from '../../lib/customElements/BlocklyEditor'

texte += addBloklyEditor(this, i, {
  toolbox,
  solutionBlocks,
  height: '250px',
  width: '640px',
  interactivityOn: true,
})
```

Lire [ScratchEditor](scratch-editor.md) ou [BlocklyEditor](blockly-editor.md) avant de créer un exercice avec ces composants. Les exemples à copier sont `src/exercices/5e/5I1C.ts` pour une traduction de calcul en blocs et `src/exercices/5e/5I1D.ts` pour un programme avec variables et callback de vérification.

## Correction non interactive

Quel que soit le custom element, `texteCorr` ne doit pas dépendre du widget interactif. Écrire une correction lisible en texte, LaTeX ou figure statique :

```ts
texteCorr += `On calcule $${a}\\times ${b}=${a * b}$.`
```

Pour une figure, utiliser une version non interactive :

```ts
texteCorr += mathalea2d(paramsFigure, objetsCorrection)
```

Ou utiliser le composant en désactivant l'interactivité : `interactivityOn: false`.

```ts
texteCorr += demiDroiteInteractive(this, i, {
  x0: 0,
  minT: 0,
  maxT: 10,
  partsCount: 10,
  points: [{ pointValue: 3, label: 'A' }],
})
```

## Vérifier localement

Après avoir ajouté une interaction :

```bash
pnpm check
pnpm prebuild-unit-tests
```

Pour tester un seul exercice dans la vérification d'interactivité :

```bash
CHANGED_FILES=src/exercices/6e/6M2B-1.ts pnpm exec vitest run tests/integration/interactivity_all.test.ts
```

Remplacer le chemin par celui de l'exercice modifié.
