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

# liste des éléments interactifs

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

### Ajouter des touches propres à une question

Les `KeyboardType` sont des claviers figés. Quand une question a besoin de
touches qui lui sont propres (une variable, une notation, un modèle
d'expression), utiliser `KeyboardType.clavierPersonnalisable` — chiffres et
opérations de base — et lui passer ces touches :

```ts
texte += ajouteChampTexteMathLive(
  this,
  i,
  KeyboardType.clavierPersonnalisable,
  { dataKeys: ['u_n', 'q', 'POW', '+\\infty'] },
)
```

Elles apparaissent dans un bloc « Pour cette question », en tête du clavier.
Chaque touche est décrite par une chaîne :

- un nom de raccourci prédéfini (`POW`, `SQRT`, `VECT`, `SIGMA`,
  `PMATRIX11`…) donne la touche correspondante ;
- toute autre chaîne est du LaTeX inséré tel quel, affiché sur la touche entre
  `$…$` (`a`, `\pi`, `u_n`, `\overrightarrow{AB}`…) ;
- les emplacements MathLive (`#0`, `#1`, `#@`) sont affichés comme des carrés
  et conservés à l'insertion, si bien que le curseur se place dans le trou :
  `f(#0)` affiche `f(□)`.

Les raccourcis disponibles et cette mécanique vivent dans
`src/components/keyboard/lib/touchesPersonnalisees.ts`. Le clavier lit ces
touches dans l'attribut `data-keys` du champ au moment où il prend le focus :
elles changent donc d'une question à l'autre.

## Bouton de réponse prédéfinie

À utiliser quand une réponse revient telle quelle et serait pénible à saisir au
clavier MathLive, typiquement « Pas factorisable » quand l'énoncé demande de
factoriser « si possible ».

```ts
import { boutonReponsePredefinie } from '../../lib/interactif/boutonReponsePredefinie'

handleAnswers(this, i, {
  reponse: { value: '\\text{Pas factorisable}' },
})

if (this.interactif) {
  texte += boutonReponsePredefinie({
    numeroExercice: this.numeroExercice,
    indiceQuestion: i,
    label: 'Pas factorisable',
  })
}
```

Le bouton remplit le champ MathLive de la question avec `valeur` (par défaut
`\text{label}`). Il n'a de sens qu'en interactif, d'où le test sur
`this.interactif`.

Si une seule question de l'exercice appelle cette réponse, ajouter le bouton à
**toutes** les questions : sinon il désigne la bonne réponse. Voir
[2N41-7](../../../../src/exercices/2e/2N41-7.ts), [1AL21-41](../../../../src/exercices/1e/1AL21-41.ts)
et [1AL21-42](../../../../src/exercices/1e/1AL21-42.ts).

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

## Tableau hybride

À utiliser quand certaines cellules d'un tableau doivent être complétées par des
nombres et d'autres par des réponses textuelles choisies dans une liste
déroulante.

```ts
import { creeTableauHybrideElement } from '../../lib/customElements/TableauHybride'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

texte += creeTableauHybrideElement({
  numeroExercice: this.numeroExercice,
  questionIndex: i,
  tableau: {
    rows: [
      [
        { type: 'text', texte: 'Jour', header: true },
        { type: 'text', texte: 'Lundi', header: true },
      ],
      [
        { type: 'text', texte: '8h - 9h', header: true },
        {
          type: 'select',
          id: 'L1C1',
          choices: [
            { label: 'Choisir', value: '' },
            { label: 'Mathématiques', value: 'Mathématiques' },
            { label: 'Français', value: 'Français' },
          ],
          choix0: true,
        },
      ],
    ],
  },
})

handleAnswers(
  this,
  i,
  {
    L1C1: { value: 'Mathématiques' },
  },
  { formatInteractif: 'tableau-hybride' },
)
```

Les cellules à compléter gardent les identifiants `LxCy`, comme
`tableau-mathlive`. Une cellule `type: 'mathfield'` est corrigée avec la
comparaison MathLive habituelle ; une cellule `type: 'select'` attend une valeur
exacte parmi les choix proposés.

Les cellules `type: 'text'` peuvent porter `header: true` pour styliser les
en-têtes de ligne ou de colonne. Pour une liste déroulante avec une valeur
d'attente, placer par convention `{ label: 'Choisir', value: '' }` en premier
choix et activer `choix0: true`.

Le helper suit le contrat des autres custom elements : `interactivityOn: false`
produit un tableau statique à compléter, en laissant des `...` dans les cellules
interactives. `correctionOn: true` produit un tableau complété statique. Dans ce
mode de correction, les cellules `mathfield` et `select` doivent porter leur
`value` ; les valeurs numériques sont affichées avec `miseEnEvidence`, les
valeurs textuelles avec `texteEnCouleurEtGras`. Hors HTML, `create()` renvoie un
tableau LaTeX statique ; en Typst, il renvoie le même rendu statique que le HTML
sans interactivité.

Lors de la vérification interactive, le composant passe en lecture seule sans
reconstruire le tableau afin de conserver les saisies visibles dans les champs.

### Des champs dans les cellules d'un tableau

Une cellule vide de `AddTabDbleEntryMathlive` ne contient qu'un seul champ. Quand une cellule doit contenir plusieurs trous (par exemple `\ldots + \dfrac{\ldots}{10} + \dfrac{\ldots}{100}`), on y place un `fill-in-the-blank` : la cellule est alors une cellule HTML (`latex: false`) dont le texte est le custom element.

```ts
import { FillInTheBlankElement } from '../../lib/customElements/FillInTheBlank'

const cellule: Icell = {
  texte: FillInTheBlankElement.create({
    id: `champTexteEx${numeroExercice}Q0L${ligne}C${colonne}`, // id du math-field
    elementId: `fill-in-the-blankEx${numeroExercice}Q0L${ligne}C${colonne}`, // id de l'élément
    numeroExercice,
    questionIndex: 0,
    dataKeyboard,
    content: '\\placeholder[a]{}+\\dfrac{\\placeholder[b]{}}{10}',
  }),
  latex: false,
  gras: false,
  color: 'black',
}
```

`elementId` est indispensable dès qu'une question contient plusieurs `fill-in-the-blank` : sans lui, tous les éléments partagent l'identifiant `fill-in-the-blankEx<n>Q<i>`.

La vérification par cellule de `verifyTableauMathLive()` ne sait pas lire les trous d'un champ : il faut fournir un `callback` à `handleAnswers()`, qui lit chaque trou avec `getPromptValue(nom)`, le compare avec `fonctionComparaison()`, colore le trou avec `setPromptState(nom, 'correct' | 'incorrect', true)` et renvoie `{ isOk, feedback, score }`. Exemple complet : [`src/exercices/6e/auto6N2B-1.ts`](../../../../src/exercices/6e/auto6N2B-1.ts).

## Éditeur Instrumenpoche

À utiliser pour faire compléter un programme de construction aux instruments.
Voir la page dédiée :
[éditeur Instrumenpoche](editeur-iep.md).

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

## QCM ramifié

À utiliser quand un choix de QCM détermine la question de justification à
afficher. Chaque proposition peut porter son propre barème et sa propre question
de suite.

```ts
import { addMathaleaBranchingQcm } from '../../lib/customElements/MathaleaBranchingQcm'

texte += addMathaleaBranchingQcm(this, i, {
  choices: [
    {
      texte: 'Vrai',
      statut: true,
      points: 1,
      followup: {
        prompt: 'Donner une expression réduite commune.',
        expected: {
          value: '4x',
          options: { developpementEgal: true },
        },
        points: 3,
      },
    },
    {
      texte: 'Faux',
      statut: false,
      points: 1,
      followup: {
        prompt: 'Donner un contre-exemple.',
        texteAvant: '$x=$',
        callback: (answer) => ({
          isOk: answer === '0',
          feedback: 'Ce nombre ne fournit pas un contre-exemple.',
        }),
        points: 3,
      },
    },
  ],
})
```

Le composant injecté est `mathalea-branching-qcm`. La branche affichée est celle
choisie par l'élève, et la vérification additionne les points du choix initial et
ceux de la justification associée.

## Points cliquables dans une figure MathALEA2D

À utiliser quand l'élève doit sélectionner des points dans une figure produite par `mathalea2d()`.

```ts
import {
  addPointsCliquables,
  type PointCliquableData,
} from '../../lib/customElements/PointsCliquablesElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const figureId = `figEx${this.numeroExercice}Q${i}`
const points: PointCliquableData[] = [
  { x: 0, y: 0, id: 'P0', etat: false },
  { x: 1, y: 0, id: 'P1', etat: false },
]
const pointsAttendus: PointCliquableData[] = [
  { x: 0, y: 0, id: 'P0', etat: false },
  { x: 1, y: 0, id: 'P1', etat: true },
]

texte += mathalea2d(
  { id: figureId, xmin: -1, ymin: -1, xmax: 2, ymax: 1 },
  objets,
)
texte += addPointsCliquables({
  numeroExercice: this.numeroExercice ?? 0,
  questionIndex: i,
  figureId,
  points,
})

handleAnswers(
  this,
  i,
  { reponse: { value: JSON.stringify(pointsAttendus) } },
  { formatInteractif: 'points-cliquables' },
)
```

Le custom element `points-cliquables` injecte les groupes SVG dans la figure repérée par `figureId`, gère les clics, ajoute le `span#resultatCheck...` et le `div#feedback...`, puis expose dans `value` la liste JSON des points avec leur état courant. La réponse attendue passée à `handleAnswers()` utilise le même format, avec `etat: true` pour les points qui doivent être cliqués.

## Fractions cliquables

`fractionCliquable()` produit un schéma de fraction dans une figure `mathalea2d()` et l'associe au custom element `fraction-cliquable`. Sans métadonnées d'exercice, il peut encore servir de brouillon interactif.

Pour l'utiliser comme vraie réponse élève dans un nouvel exercice, passer `numeroExercice` et `questionIndex` dans les options, puis déclarer la réponse attendue avec la valeur du schéma :

```ts
const schema = fractionCliquable(0, 0, 2, 4, {
  numeroExercice: this.numeroExercice,
  questionIndex: i,
})

texte += mathalea2d({ xmin: -0.2, xmax: 10, ymin: -1, ymax: 2 }, schema)

handleAnswers(
  this,
  i,
  { reponse: { value: schema.value } },
  { formatInteractif: 'fraction-cliquable' },
)
```

`fraction-cliquable.value` expose la liste JSON des parts avec leur `id` et leur état `etat`. Le setter `value` restaure ces états, ce qui permet la reprise d'une réponse élève.

## Objets cliquables dans une figure MathALEA2D

À utiliser quand l'élève doit sélectionner plusieurs types d'objets dans une figure `mathalea2d()` : point, segment, droite, cercle, polygone ou polyline.

```ts
import {
  addObjetsCliquables,
  type ObjetCliquableData,
} from '../../lib/customElements/ObjetsCliquablesElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const figureId = `figEx${this.numeroExercice}Q${i}`
const objets: ObjetCliquableData[] = [
  { type: 'segment', id: 'AB', x1: 0, y1: 0, x2: 3, y2: 1, etat: false },
  { type: 'cercle', id: 'c', x: 2, y: 2, r: 1, etat: false },
  {
    type: 'polyline',
    id: 'ligne-brisee',
    points: [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 0 },
    ],
    etat: false,
  },
]
const objetsAttendus = objets.map((objet) => ({
  ...objet,
  etat: objet.id === 'AB',
}))

texte += mathalea2d(
  { id: figureId, xmin: -1, ymin: -1, xmax: 5, ymax: 4 },
  objets2d,
)
texte += addObjetsCliquables(this, i, { figureId, objets })

handleAnswers(
  this,
  i,
  { reponse: { value: JSON.stringify(objetsAttendus) } },
  { formatInteractif: 'objets-cliquables' },
)
```

Le custom element `objets-cliquables` injecte une couche SVG superposée à la figure. Les zones de clic sont transparentes et élargies avec `hitWidth`, tandis que les objets sélectionnés sont rendus visibles avec `selectedColor`. Le setter `value` restaure l'état depuis le JSON stocké dans `exercice.answers`, notamment pour Capytale. Le helper ajoute aussi le `span#resultatCheck...` et le `div#feedback...`.

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

### Une liste déroulante parmi les champs

Un champ dont les options contiennent `choices` n'est pas un MathLive mais une
liste déroulante (le custom element `liste-deroulante` est imbriqué dans le
`multi-mathfield`). C'est le seul moyen de mélanger un menu et des champs
MathLive dans une même question, puisqu'une question n'a qu'un seul
`formatInteractif`.

```ts
texte += addMultiMathfield(this, i, {
  dataTemplate: `a) Quelle inconnue choisir ? %{field0}
b) Écrire l'équation : %{field1}`,
  dataOptions: {
    field0: { choices, ldots: true },
    field1: { keyboard: KeyboardType.clavierDeBaseAvecEgal, ldots: true },
  },
})

handleAnswers(
  this,
  i,
  {
    field0: { value: ['d0', 'd1'] },
    field1: { value: equation, options: { egaliteExpression: true } },
  },
  { formatInteractif: 'multi-mathfield' },
)
```

Points à connaître :

- `choices` a le même format que pour `choixDeroulant()` ; ajouter en tête un
  choix neutre `{ label: 'Choisir…', value: '' }` car le premier choix sert
  d'invite et n'est pas sélectionnable (`choix0: false` par défaut) ;
- la comparaison est une égalité stricte avec `value` ; un tableau de valeurs
  permet d'accepter plusieurs choix ;
- les libellés sont du **texte** : éviter le LaTeX, qui n'est pas rendu dans le
  shadow DOM de la liste.

### Un QCM parmi les champs

Un champ dont les options contiennent `qcm` n'est pas un MathLive mais un QCM
radio imbriqué dans le `multi-mathfield`. Cela permet de mélanger, dans une
même question interactive, des calculs saisis et des choix de conclusion.

```ts
texte += addMultiMathfield(this, i, {
  dataTemplate: `a) Le membre de gauche vaut %{field0}.
b) Le membre de droite vaut %{field1}.
c) Le nombre proposé est-il solution ? %{field2}`,
  dataOptions: {
    field0: { keyboard: KeyboardType.clavierNumbers, ldots: true },
    field1: { keyboard: KeyboardType.clavierNumbers, ldots: true },
    field2: {
      qcm: [
        { label: 'Oui', value: 'oui' },
        { label: 'Non', value: 'non' },
      ],
    },
  },
})

handleAnswers(
  this,
  i,
  {
    field0: { value: membreGauche },
    field1: { value: membreDroit },
    field2: { value: 'oui' },
  },
  { formatInteractif: 'multi-mathfield' },
)
```

Points à connaître :

- `qcm` a le même format de choix que `choixDeroulant()` ;
- la comparaison est une égalité stricte avec `value` ; un tableau de valeurs
  permet d'accepter plusieurs choix ;
- ajouter `vertical: true` dans les options du champ pour afficher les choix les
  uns sous les autres.

### Barème personnalisé

La clé `bareme` de `handleAnswers()` reçoit la liste des points des champs
(dans l'ordre de déclaration) et renvoie `[pointsObtenus, pointsPossibles]`.
Elle sert notamment à obtenir un total constant quand le nombre de champs
dépend de la question tirée :

```ts
// Cinq étapes valant chacun un point, même si l'étape b) a plusieurs champs.
const bareme = (points: number[]): [number, number] => [
  points[0] + Math.min(...points.slice(1, 1 + nbChampsEtapeB)) + /* … */ 0,
  5,
]
```

Un exemple complet (liste déroulante, barème constant et corrections dépendant
du choix fait dans la liste) : [`src/exercices/4e/4L13-2.ts`](../../../../src/exercices/4e/4L13-2.ts).

### Corriger selon la réponse donnée dans un autre champ

`compare` peut être une fermeture qui lit l'état courant du composant au moment
de la vérification. C'est ainsi que 4L13-2 corrige les étapes b) à d) en
fonction de l'inconnue choisie à l'étape a) :

```ts
const varianteChoisie = () => {
  const multi = document.getElementById(
    `multi-mathfieldEx${this.numeroExercice}Q${i}`,
  )
  const liste = multi?.shadowRoot?.querySelector(
    'liste-deroulante[data-name="field0"]',
  ) as { value?: string } | null
  return variantes.find((variante) => variante.cle === liste?.value)
}
```

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

## Relier les étiquettes

À utiliser pour un appariement : deux colonnes d'étiquettes carrées que l'élève relie deux à deux.

```ts
import {
  addRelierEtiquettes,
  type LienRelier,
} from '../../lib/customElements/RelierEtiquettesElement'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const gauche = [
  { id: 'G0', texte: 'positif' },
  { id: 'G1', texte: 'strictement positif' },
]
const droite = [
  { id: 'D0', texte: '$n > 0$' },
  { id: 'D1', texte: '$n \\geqslant 0$' },
]
const liens: LienRelier[] = [
  { gauche: 'G0', droite: 'D1' },
  { gauche: 'G1', droite: 'D0' },
]

texte += addRelierEtiquettes(this, i, {
  gauche,
  droite,
  interactivityOn: this.interactif,
})

handleAnswers(
  this,
  i,
  { reponse: { value: JSON.stringify(liens) } },
  { formatInteractif: 'relier-etiquettes' },
)
```

Points à connaître :

- les étiquettes se passent en chaînes (`['positif', 'négatif']`, identifiants `G0`, `G1`… et `D0`, `D1`… attribués automatiquement) ou en objets `{ id, texte }` quand l'exercice a besoin d'identifiants stables ;
- le contenu d'une étiquette est du **texte** éventuellement mêlé de LaTeX entre `$` (rendu par KaTeX), pas du HTML ;
- l'élève relie au clic (une étiquette puis l'autre), au doigt ou en glissant d'une colonne à l'autre ; un lien déjà tracé se retire en le refaisant ou en cliquant dessus ;
- par défaut une étiquette ne porte qu'un seul lien (un nouveau lien remplace le précédent) ; passer `multiple: true` pour lever cette limite ;
- `value` est le JSON des liens `{ gauche, droite }` ; c'est aussi le format attendu par `handleAnswers()` et par la restauration des copies ;
- la correction colore les traits (vert juste, rouge faux, pointillés verts pour un lien manquant) et le score est proportionnel au nombre de liens justes ;
- pour afficher la solution dans `texteCorr`, appeler `RelierEtiquettesElement.create({ id: …, gauche, droite, liens, interactivityOn: false })` avec un **id distinct** de celui de l'énoncé.

Le composant produit aussi les sorties imprimées : une figure TikZ en LaTeX et une figure Typst native (sans paquet externe), avec les mêmes couleurs de traits. Voir [le custom element](../../maintenance-moteur/interactivite/relier-etiquettes.md).

## Multiples champs dans une figure 2D

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

À utiliser pour placer un ou plusieurs points sur une demi-droite graduée (qui peut se transformer en droite avec l'option showNegative)

```ts
import { demiDroiteInteractive } from '../../lib/customElements/demi_droite_interactive'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

texte += demiDroiteInteractive(this, i, {
  x0: 0,
  minT: 0,
  maxT: 10,
  partsCount: 10,
  subdivisionMode: 'axis',
  showEqualityMarks: false,
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

La réponse attendue est une configuration sérialisée, pas seulement l'abscisse du point. L'objet `points` contient les points que l'élève doit placer, avec leur `pointValue` et leur `label`. `showEqualityMarks: false` masque les marques d'égalité de longueur quand les graduations sont très serrées. `axisMin` permet de fixer la borne gauche visible quand `showNegative` ne doit pas produire une portion symétrique par rapport à 0. La clé `showwNegative` correspond au nom historique encore accepté par certains affichages de réponses. Vérifier un exercice existant proche, par exemple `6N3D-2.ts`, si plusieurs points ou des fractions sont attendus.

`subdivisionMode` choisit l'interprétation de `partsCount` :

- `'axis'` (valeur par défaut) partage toute la portion visible en
  `partsCount` parts ;
- `'unit'` partage chaque unité en `partsCount` parts. Dans ce second mode,
  avec `partsCount: 1` au départ, les clics successifs sur le bouton `+`
  produisent des demis, des tiers, des quarts, etc. Ce mode convient pour
  représenter $\frac{3}{7}$ comme trois fois $\frac{1}{7}$.

Hors HTML, `demiDroiteInteractive()` produit une figure statique :

- en LaTeX : un `tikzpicture` ;
- en Typst : une image SVG embarquée dans un marqueur `<mathalea-typst>`.

Quand `interactivityOn` vaut `true`, la demi-droite graduée est affichée sans
les points à placer. Quand `interactivityOn` vaut `false`, les points fournis
dans l'option `points` sont dessinés, ce qui convient au rendu de correction.

## Cercle trigonométrique

À utiliser pour sélectionner une position sur le cercle trigonométrique.

```ts
import {
  addTrigoCircleSelection,
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

texte += addTrigoCircleSelection(this, i, {
  showAngleLabels: true,
  showCoordinateLabels: Boolean(this.sup2),
  style: 'display:block; max-width: 46rem;',
  interactivityOn: this.interactif,
})

texteCorr += 'Il fallait sélectionner les points correspondant aux solutions.'
texteCorr += addTrigoCircleSelection(this, i, {
  id: `trigo-circle-selection-correctionEx${this.numeroExercice}Q${i}`,
  showAngleLabels: true,
  showCoordinateLabels: true,
  interactivityOn: false,
  markedPoints: solutions.map((solution) => ({
    angle: solution.angleRad,
    color: '#f15929',
  })),
})
```

`trigoCircleSelectionValue()` transforme la liste des angles attendus en valeur numérique vérifiable par le custom element. Chaque angle vient de `solution.angleRad`, comme dans l'exercice `2mTrigoFct-3.ts`. L'appel à `addTrigoCircleSelection()` est contextuel : en HTML interactif, il produit le custom element ; en LaTeX, il produit un cercle trigonométrique via `mathalea2d` ; en Typst, il embarque un SVG statique. Quand `interactivityOn` vaut `true`, aucun point attendu n'est marqué sur le rendu statique. Quand `interactivityOn` vaut `false`, les points fournis par `markedPoints` sont dessinés, ou à défaut les points déduits de `value`.

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

`addInteractiveClock()` gère directement les contextes de sortie :

- en HTML standard, il injecte le custom element interactif ou figé ;
- en LaTeX, il retourne une horloge `mathalea2d` statique ;
- en Typst, il retourne une image SVG embarquée dans un marqueur
  `<mathalea-typst>`.

Quand `showHands` vaut `false`, l'horloge est rendue sans aiguilles, ce qui
convient à l'énoncé interactif. Quand `interactivityOn` vaut `false` avec
`showHands: true`, l'heure fournie est dessinée pour la correction.

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
import {
  addTableauSignesVariations,
  creerTableauSignesVariations,
} from '../../lib/customElements/TableauSignesVariationsElement'

texte += addTableauSignesVariations(this, i, {
  config,
  interactivityOn: this.interactif,
})

texteCorr += creerTableauSignesVariations(configCorrigee, {
  readonly: true,
  numeroExercice: this.numeroExercice,
  numeroQuestion: i,
})
```

Ce helper déclare lui-même les données nécessaires à la vérification. Lire aussi `src/lib/interactif/tableauSignesVariations/DOCUMENTATION.md` avant de créer un nouveau tableau.

## Couteau suisse

À utiliser quand une même question doit enchaîner plusieurs custom elements
interactifs autonomes. Lire la page dédiée :
[Mathalea Couteau Suisse](couteau-suisse.md).

Exemple de référence : `src/exercices/2e/2F21-9.ts`.

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

## DiagramPieAssessmentElement

Ce composant permet de créer un diagramme circulaire interactif.

```ts
import { DiagramPieAssessmentElement } from '../../lib/customElements/DiagramPieAssessmentElement'

texte += addDiagramPieAssessment(this, i, {
            items: [
              {label: 'A', effectif:12},{label: 'B', effectif:8},{label: 'C': effectif: 16}
            ],
            mode: 'angle' as PieAssessmentMode,
            shape: 'pie' as PieAssessmentShape,
            infosStatus: false,
          })
```

Il peut être utilisé selon 3 modes :

- 'angle' demande l'angle associé à chaque label (cas d'usage dans 5D1D-1)
- 'effectif' demande l'effectif associé à chaque label
- 'label' demande le label associé à au choix : l'effectif ou l'angle fourni.

Quand `interactivityOn` vaut `false`, le composant n'affiche plus les
champs interactifs : le diagramme reste vide avec sa légende en dessous, et la
table devient une table statique de conversion. La colonne correspondant au
mode demandé (`angle`, `effectif` ou `label`) contient des cellules vides ; les
autres colonnes visibles sont remplies avec les valeurs fournies ou calculées.
Si une valeur non demandée vaut `null` (`effectif` en mode `angle`, ou `angle`
en mode `effectif`), la cellule statique affiche aussi des pointillés afin de
ne jamais rendre le texte `null`. La valeur `0` reste affichée comme une donnée
valide.
L'option `colorOn`, à `true` par défaut, contrôle les couleurs de légende dans
les rendus statiques. Avec `colorOn: false`, les carrés de légende sont blancs
avec un contour afin de laisser les élèves choisir leurs propres couleurs.

Pour un exemple d'utilisation, un exemple à étudier est `src/exercices/5e/5D1D-1.ts`.
Il contient les versions 'pie' et 'semi-pie' (shape), mais aussi d'autre diagrammes comme le DiagramBarAssessmentElement décrit ci-après.

## DiagramBarAssessmentElement

Ce composant permet de créer un diagramme en barres interactif.

```ts
import { DiagramBarAssessmentElement } from '../../lib/customElements/DiagramBarAssessmentElement'

texte += addDiagramBarAssessment(this, i,{
            unitValue: 200,
            unitLabel: `individus`,
            yMax: 1000,
            mode: 'hauteur' as BarAssessmentMode,
            infosStatus: false,
            interactivityOn: true,
            items:[
              {label: 'A', effectif:12},{label: 'B', effectif:8},{label: 'C': effectif: 16}
            ]})
```

Il peut être utilisé selon 3 modes :

- 'hauteur' demande la hauteur de la barre associée à chaque label (cas d'usage dans 5D1D-1)
- 'effectif' demande l'effectif associé à chaque label (on fournira les hauteurs par exemple)
- 'label' demande le label associé à chaque barre donnée par au choix : sa hauteur ou son effectif.

Quand `interactivityOn` vaut `false`, le diagramme en barres affiche une table
statique complète (`Catégorie`, `Effectifs`, `Hauteurs`) avec des pointillés
pour les valeurs `null`. Sans `correctionOn`, le repère reste vide ; en
correction, passer `correctionOn: true` pour afficher les barres. L'option
`colorOn`, à `true` par défaut, contrôle la couleur des barres ; avec
`colorOn: false`, le rendu HTML et LaTeX utilise des hachures, et le rendu Typst
des niveaux de gris.

Pour un exemple d'utilisation, un exemple à étudier est `src/exercices/5e/5D1D-1.ts`.

## Correction maison (`custom`)

Quand aucun custom element ne convient — c'est le cas des exercices apiGeom, où l'élève construit une figure —, l'exercice corrige lui-même :

```ts
export const interactifReady = true
// Ne pas exporter `interactifType` : le format est déclaré question par question.

export default class MonExercice extends Exercice {
  correctionInteractive = (i: number) => {
    // Sauvegarde de la réponse pour le LMS : la clé doit être l'id de la figure
    this.answers[this.figuresApiGeom![i].id] = figureAnswerJson(
      this.figuresApiGeom![i],
    )
    const divFeedback = document.querySelector(
      `#feedbackEx${this.numeroExercice}Q${i}`,
    )
    const { isValid, message } = this.figuresApiGeom![i].checkAngle({
      angle: 90,
      label1: 'A',
      label2: 'B',
      label3: 'C',
    })
    if (divFeedback != null) divFeedback.innerHTML = message
    return isValid ? 'OK' : 'KO'
  }
}
```

`correctionInteractive(i)` renvoie `'OK'` ou `'KO'`. Pour qu'une question rapporte plusieurs points, poser `this.exoCustomResultat = true` dans le constructeur et renvoyer un tableau (`['OK', 'KO', 'OK']`) : chaque entrée vaut un point.

Le moteur n'affiche rien à la place de l'exercice : c'est à `correctionInteractive` d'écrire le feedback dans `#feedbackEx{numeroExercice}Q{i}` et, s'il y a lieu, de figer la figure (`figure.isDynamic = false`).

Le modèle complet est `src/exercices/modèlesExos/20_exercice_classique_apigeom.ts`.

### Toujours indexer par `i`

C'est la condition pour que l'exercice puisse être repris comme une question parmi d'autres par un méta-exercice — une CAN ou une « Sélection d'automatismes » (`1A`, `3A`). Dans ce cas, `correctionInteractive` est appelée avec l'index de la question **dans l'exercice affiché**, qui n'est plus 0.

- `#feedbackEx${this.numeroExercice}Q${i}`, jamais `Q0` ni `Q${0}` ;
- `this.figuresApiGeom[i]`, jamais `[0]` ;
- `figureApigeom({ exercice: this, i, figure })` avec l'indice de la boucle de `nouvelleVersion()`, et la figure rangée dans `this.figuresApiGeom[i]`.

Aucun décalage n'est à gérer dans l'exercice : `figureApigeom()` s'en charge à partir de `this.indexQuestionHote`, posé par le méta-exercice. Le détail du mécanisme est dans [le système d'interactivité](../../maintenance-moteur/interactivite/systeme-interactivite.md#réhébergement-dune-question-custom).

## fin de la liste des éléments

# Bonnes pratiques

## Affichage de la correction

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
