# Rendre un exercice interactif

Ce guide explique comment transformer un exercice existant en exercice interactif, de la première modification jusqu'à la vérification locale. La référence d'architecture est dans [système d'interactivité](../reference/systeme-interactivite.md) ; ici, l'objectif est de savoir quoi coder, dans quel ordre, et quoi vérifier.

## Principe en une phrase

Pour chaque question, il faut afficher un élément de saisie dans l'énoncé, puis enregistrer la réponse attendue dans `this.autoCorrection[i]`. Dans les nouveaux développements, on le fait presque toujours avec :

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
```

`handleAnswers(this, i, reponses, params)` crée ou complète `this.autoCorrection[i]`, fixe le `formatInteractif` de la question et associe chaque champ à un comparateur.

## Prérequis

Avant de modifier l'exercice, repérer :

- le fichier de l'exercice dans `src/exercices/...` ;
- la boucle de `nouvelleVersion()` qui construit `texte`, `texteCorr`, `this.listeQuestions[i]` et `this.listeCorrections[i]` ;
- la variable d'indice de question, souvent `i` ;
- la réponse attendue déjà calculée dans le code ;
- le comportement non interactif attendu : HTML non interactif, LaTeX, AMC si l'exercice est exportable.

Ajouter ensuite les exports en haut du fichier, près des autres métadonnées :

```ts
export const interactifReady = true
export const interactifType = 'mathLive'
```

`interactifType` reste une métadonnée globale de l'exercice. Pour les questions vérifiées par `handleAnswers()`, le vrai routage de correction est le `formatInteractif` stocké question par question. Utiliser `mathLive` en métadonnée pour un champ MathLive simple, `qcm` pour un QCM, `listeDeroulante` pour une liste, `dnd` pour du glisser-déposer, etc. Le type `custom` doit rester exceptionnel.

Dans `nouvelleVersion()`, garder le modèle habituel :

```ts
for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50;) {
  let texte = ''
  let texteCorr = ''

  // Construire la question.

  if (this.questionJamaisPosee(i, donneesSignificatives)) {
    this.listeQuestions[i] = texte
    this.listeCorrections[i] = texteCorr
    i++
  }
  cpt++
}
listeQuestionsToContenu(this)
```

Si l'exercice écrit déjà `this.autoCorrection[i]` pour un QCM, une liste ou un format spécial, conserver cette initialisation. Sinon, `handleAnswers()` crée l'entrée nécessaire.

## Choisir le bon format

Choisir le format selon ce que l'élève doit faire, pas selon la forme interne de la réponse.

| Besoin côté élève | Format | Helper principal | Déclaration de réponse |
| --- | --- | --- | --- |
| Saisir un nombre, une fraction, une expression, une unité | `mathlive` | `ajouteChampTexteMathLive()` | `reponse` |
| Saisir plusieurs valeurs dans une phrase ou une formule | `fillInTheBlank` | `remplisLesBlancs()` | `champ1`, `champ2`, ... |
| Saisir des valeurs dans un tableau | `tableauMathlive` | `AddTabPropMathlive` ou `AddTabDbleEntryMathlive` | `L1C1`, `L1C2`, ... |
| Saisir du texte libre sans MathLive | `texte` | `ajouteChampTexte()` | `reponse`, avec `{ formatInteractif: 'texte' }` |
| Cocher une ou plusieurs propositions | `qcm` | `propositionsQcm()` | `this.autoCorrection[i].propositions` |
| Choisir une valeur dans un menu | `listeDeroulante` | `choixDeroulant()` | `reponse`, avec `{ formatInteractif: 'listeDeroulante' }` |
| Déplacer des étiquettes | `dnd` | `new DragAndDrop(...)` | `rectangle1`, `rectangle2`, ... |
| Sélectionner des SVG | `svgSelection` | `selectionSvg()` | `reponse`, avec `{ formatInteractif: 'svgSelection' }` |
| Cliquer dans une figure | `cliqueFigure` | objets SVG + `cliqueFiguresArray` | `this.autoCorrection[i].formatInteractif = 'cliqueFigure'` |
| Vérification impossible avec les formats existants | `custom` | code propre à l'exercice | `correctionInteractive(i)` |

Commencer par le format le plus simple. Si un champ MathLive avec les bonnes options de comparaison suffit, ne pas écrire de correction personnalisée.

## Cas courant : champ MathLive simple

### 1. Ajouter les imports

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
```

Le chemin relatif dépend du dossier de l'exercice. Depuis `src/exercices/6e/`, il est généralement `../../lib/...`. Depuis `src/exercices/can/6e/`, il est généralement `../../../lib/...`.

### 2. Ajouter le champ dans l'énoncé

Ajouter le champ à l'endroit où l'élève doit répondre :

```ts
texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)
```

Le troisième argument est une chaîne de classes et de claviers. Utiliser `KeyboardType.clavierNumbers` pour un nombre, `KeyboardType.clavierDeBase` pour des opérations simples, `KeyboardType.clavierFullOperations` pour un calcul plus complet, `KeyboardType.alphanumeric` pour une réponse alphanumérique, etc. Ces noms sont définis dans `src/lib/interactif/claviers/keyboard.ts`.

On peut ajouter du texte avant ou après le champ :

```ts
texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers, {
  texteAvant: '$x=$',
  texteApres: '$\\text{ cm}$',
})
```

Ne pas entourer tout le champ avec un `$...$` sans vérifier le rendu : le helper génère un élément HTML, pas seulement du LaTeX.

### 3. Enregistrer la réponse

Juste après avoir construit la réponse attendue, appeler `handleAnswers()` :

```ts
handleAnswers(this, i, {
  reponse: { value: resultat },
})
```

`value` peut être une chaîne, un nombre, un `FractionEtendue`, un `Decimal`, une `Grandeur`, un `Hms`, un `Complexe` ou certains tableaux de ces valeurs. La fonction normalise ces valeurs avant comparaison.

### 4. Garder un rendu non interactif

`ajouteChampTexteMathLive()` retourne une chaîne vide si le contexte n'est pas HTML interactif. L'énoncé doit donc rester compréhensible sans le champ. Si nécessaire, ajouter une phrase ou un blanc dans le texte non interactif :

```ts
texte = this.interactif
  ? `$${a}+${b}=$ ${ajouteChampTexteMathLive(this, i, KeyboardType.clavierNumbers)}`
  : `$${a}+${b}=\\ldots$`
```

## Chemin minimal

Pour rendre interactif un exercice déjà fonctionnel avec un seul champ MathLive, suivre ce chemin avant de regarder les formats avancés :

1. Ajouter `export const interactifReady = true` et un `interactifType` cohérent, souvent `'mathLive'`.
2. Importer `handleAnswers()` et `ajouteChampTexteMathLive()`.
3. Ajouter le champ dans `texte`, à l'endroit de la réponse.
4. Appeler `handleAnswers(this, i, { reponse: { value: reponseAttendue } })` pour la même question `i`.
5. Vérifier que l'énoncé reste lisible quand `this.interactif` est faux ou quand le rendu est LaTeX.
6. Ouvrir l'exercice en local avec son `uuid`, saisir une bonne réponse puis une mauvaise réponse.

## Texte à trous

Utiliser `remplisLesBlancs()` quand plusieurs champs doivent apparaître dans la même expression.

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { remplisLesBlancs } from '../../lib/interactif/questionMathLive'

texte += remplisLesBlancs(
  this,
  i,
  '%{champ1}+%{champ2}=%{champ3}',
  '',
  '\\ldots',
)

handleAnswers(this, i, {
  champ1: { value: a },
  champ2: { value: b },
  champ3: { value: a + b },
})
```

Les noms dans le modèle (`%{champ1}`, `%{champ2}`, ...) doivent être exactement les mêmes que les clés passées à `handleAnswers()`. La présence de `champ1` fait déduire le format `fillInTheBlank`.

Le barème par défaut de `verifQuestionMathLive()` est `toutPourUnPoint` : la question vaut 1 point seulement si tous les champs sont justes. C'est le bon choix quand les champs forment une seule réponse, par exemple une égalité complète ou une fraction.

Si chaque champ doit rapporter son propre point, importer `toutAUnPoint` depuis `src/lib/interactif/mathLive.ts` et le passer en `bareme` :

```ts
import { toutAUnPoint } from '../../lib/interactif/mathLive'

handleAnswers(this, i, {
  champ1: { value: a },
  champ2: { value: b },
  champ3: { value: a + b },
  bareme: toutAUnPoint,
})
```

À retenir : `toutPourUnPoint` est all-or-nothing sur 1 point ; `toutAUnPoint` additionne les champs corrects sur autant de points qu'il y a de champs.

## Tableau MathLive

Utiliser les helpers de `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`.

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { AddTabDbleEntryMathlive } from '../../lib/interactif/tableaux/AjouteTableauMathlive'

const tableau = AddTabDbleEntryMathlive.convertTclToTableauMathlive(
  ['', 'Prix'],
  ['Quantité'],
  [''],
)

const tableauInteractif = AddTabDbleEntryMathlive.create(
  this.numeroExercice,
  i,
  tableau,
  '',
  this.interactif,
  {},
)

texte += tableauInteractif.output

handleAnswers(
  this,
  i,
  {
    L1C1: { value: prix },
  },
  { formatInteractif: 'tableauMathlive' },
)
```

Les cellules interactives sont nommées `L1C1`, `L1C2`, `L2C1`, etc. Les clés dans `handleAnswers()` doivent correspondre aux cellules réellement éditables du tableau.

## Champ texte HTML

Pour une réponse textuelle simple sans MathLive :

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexte } from '../../lib/interactif/questionMathLive'

texte += ajouteChampTexte(this, i, '', { placeholder: 'Réponse' })
handleAnswers(
  this,
  i,
  {
    reponse: {
      value: 'parallèles',
      options: { texteSansCasse: true },
    },
  },
  { formatInteractif: 'texte' },
)
```

Utiliser `{ texteAvecCasse: true }` si la casse doit être respectée, `{ texteSansCasse: true }` si elle ne doit pas l'être.

## QCM

Un QCM ne passe pas par `handleAnswers()` pour ses propositions. Il faut remplir `this.autoCorrection[i]`, puis appeler `propositionsQcm()`.

```ts
import { propositionsQcm } from '../../lib/interactif/qcm'

this.autoCorrection[i] = {
  enonce: texte,
  propositions: [
    { texte: '$4$', statut: true },
    { texte: '$5$', statut: false },
    { texte: '$6$', statut: false },
  ],
  options: { ordered: false, radio: true },
}

const monQcm = propositionsQcm(this, i)
texte += monQcm.texte
```

Options utiles :

- `radio: true` pour une seule réponse attendue ;
- `ordered: true` pour garder l'ordre des propositions ;
- `vertical: true` pour une présentation verticale ;
- `lastChoice` pour ne mélanger que le début de la liste.

Pour AMC, les QCM sont les formats les plus simples à maintenir : garder `amcReady` et `amcType` cohérents avec le nombre de bonnes réponses (`qcmMono` ou `qcmMult`) si l'exercice est exportable.

## Liste déroulante

Une liste déroulante affiche des choix, mais la correction compare les `value`.

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import {
  choixDeroulant,
  listeDeroulanteToQcm,
} from '../../lib/interactif/questionListeDeroulante'
import { context } from '../../modules/context'

const choix = [
  { label: 'Choisir une réponse', value: '' },
  { label: 'Oui', value: 'oui' },
  { label: 'Non', value: 'non' },
]
const reponse = condition ? 'oui' : 'non'

if (this.interactif) {
  texte += choixDeroulant(this, i, choix, false)
  handleAnswers(
    this,
    i,
    { reponse: { value: reponse } },
    { formatInteractif: 'listeDeroulante' },
  )
} else if (context.isAmc) {
  listeDeroulanteToQcm(this, i, choix, reponse, {
    ordered: true,
    vertical: true,
  })
}
```

Le quatrième argument de `handleAnswers()` est obligatoire ici. Sans `{ formatInteractif: 'listeDeroulante' }`, le moteur cherchera un champ MathLive.

## Glisser-déposer

Le format `dnd` repose sur `DragAndDrop` et des réponses `rectangle1`, `rectangle2`, ...

```ts
import DragAndDrop from '../../lib/interactif/DragAndDrop'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

const enonceATrous = '$3+4$ donne %{rectangle1}.'
const etiquettes = [
  [
    { id: 'sept', contenu: '$7$' },
    { id: 'huit', contenu: '$8$' },
  ],
]

const leDragAndDrop = new DragAndDrop({
  exercice: this,
  question: i,
  consigne: 'Compléter avec les étiquettes disponibles.',
  enonceATrous,
  etiquettes,
})

texte += leDragAndDrop.ajouteDragAndDrop({
  melange: true,
  duplicable: false,
})

handleAnswers(
  this,
  i,
  {
    rectangle1: { value: 'sept' },
  },
  { formatInteractif: 'dnd' },
)
```

Si plusieurs étiquettes sont acceptées pour une zone, les exemples existants utilisent des identifiants séparés par `|` dans `value`. Les options de comparaison `ordered` et `multi` existent pour les besoins de glisser-déposer ; vérifier un exercice proche avant de les utiliser.

## Sélection SVG

`selectionSvg()` affiche une grille de SVG sélectionnables. La valeur retournée est la somme des `value` des éléments sélectionnés.

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { selectionSvg } from '../../lib/interactif/questionSvgSelection/questionSvgSelection'

const items = [
  { svg: svgA, value: 1 },
  { svg: svgB, value: 2 },
  { svg: svgC, value: 4 },
]

texte += selectionSvg(this, i, items)
handleAnswers(
  this,
  i,
  { reponse: { value: 3 } },
  { formatInteractif: 'svgSelection' },
)
```

Ici, sélectionner `svgA` et `svgB` donne `3`. `value` peut aussi être un tableau si plusieurs sommes finales sont acceptées.

## Figure cliquable et formats spécialisés

Pour `cliqueFigure`, `MetaInteractif2d`, `multiMathfield`, `tableur` et les usages avancés, partir d'un exercice existant proche. Ces formats ont des conventions supplémentaires :

- `cliqueFigure` utilise `this.cliqueFiguresArray` avec des identifiants SVG et une propriété `solution` ;
- `MetaInteractif2d` utilise les champs intégrés aux objets MathALÉA 2D et des clés `field0`, `field1`, ... ;
- `multiMathfield` coordonne plusieurs champs MathLive et utilise aussi `field0`, `field1`, ... ;
- `tableur` utilise `sheetAnswer`.

Dans tous les cas, le `formatInteractif` de la question doit correspondre à une valeur de `InteractivityType` dans `src/lib/types.ts`.

## Choisir la comparaison

Chaque entrée de réponse peut contenir :

```ts
{
  value: reponseAttendue,
  compare: fonctionDeComparaison,
  options: { ... }
}
```

Dans la majorité des cas, ne pas fournir `compare` : `handleAnswers()` utilise `fonctionComparaison()` depuis `src/lib/interactif/comparisonFunctions.ts`. Il suffit de choisir les bonnes `options`.

Options fréquentes :

| Réponse attendue | Exemple |
| --- | --- |
| Nombre final uniquement | `{ nombreDecimalSeulement: true }` |
| Calcul et pas seulement résultat | `{ expressionNumerique: true }` |
| Addition uniquement | `{ additionSeulementEtNonResultat: true }` |
| Fraction égale, pas forcément irréductible | `{ fractionEgale: true }` |
| Fraction exactement identique | `{ fractionIdentique: true }` |
| Fraction irréductible | `{ fractionIrreductible: true }` |
| Fraction simplifiée | `{ fractionSimplifiee: true }` ou `{ fractionReduite: true }` |
| Fraction décimale | `{ fractionDecimale: true }` |
| Notation scientifique | `{ ecritureScientifique: true }` |
| Puissance | `{ puissance: true }` |
| Intervalle | `{ intervalle: true }` |
| Nombre dans un intervalle | `{ estDansIntervalle: true }` |
| Ensemble de nombres | `{ ensembleDeNombres: true }` |
| Suite de nombres | `{ suiteDeNombres: true }` |
| Coordonnées | `{ coordonnees: true }` |
| Expression littérale équivalente | `{ egaliteExpression: true }` ou `{ fonction: true }` selon le cas |
| Grandeur avec unité | `{ unite: true }` |
| Texte sensible à la casse | `{ texteAvecCasse: true }` |
| Texte sans tenir compte de la casse | `{ texteSansCasse: true }` |

Exemples :

```ts
handleAnswers(this, i, {
  reponse: {
    value: '\\dfrac{2}{3}',
    options: { fractionIrreductible: true },
  },
})
```

```ts
handleAnswers(this, i, {
  reponse: {
    value: '3+4\\times 5',
    options: { expressionNumerique: true },
  },
})
```

```ts
handleAnswers(this, i, {
  reponse: {
    value: 'parallélogramme',
    options: { texteSansCasse: true },
  },
})
```

Attention : quand aucune option n'est fournie et que `value` ressemble à un nombre, `handleAnswers()` ajoute par défaut `{ nombreDecimalSeulement: true }`. Si l'élève doit pouvoir saisir un calcul égal à ce nombre, fournir explicitement une option adaptée, ou passer une chaîne/expression avec l'option attendue.

Pour des critères complexes, les checks composables de `src/lib/interactif/checks/` peuvent servir de `compare`. Exemple de forme :

```ts
import { all } from '../../lib/interactif/checks'
import { isEqual } from '../../lib/interactif/checks/isEqual'
import { isReduced } from '../../lib/interactif/checks/isReduced'

handleAnswers(this, i, {
  reponse: {
    value: '\\dfrac{2}{3}',
    compare: all([isEqual(), isReduced()]),
  },
})
```

Avant d'ajouter un nouveau comparateur, rechercher un exemple existant avec `rg "compare: all|compare: seq|options: .*fraction" src/exercices`.

## Barème et feedback

Pour une question à plusieurs champs, on peut ajouter :

- `bareme`, qui reçoit la liste des points par champ et retourne `[pointsObtenus, pointsMaximum]` ;
- `feedback`, qui reçoit les saisies et retourne un message HTML.

```ts
handleAnswers(this, i, {
  champ1: { value: numerateur, options: { nombreDecimalSeulement: true } },
  champ2: { value: denominateur, options: { nombreDecimalSeulement: true } },
  bareme: (listePoints) => [
    Math.min(listePoints[0], listePoints[1]),
    1,
  ],
  feedback: (saisies) =>
    saisies.champ2 === '0' ? 'Le dénominateur ne peut pas être nul.' : '',
})
```

Garder le feedback court et utile pour l'élève.

## Compatibilité non interactive, LaTeX et AMC

Un exercice interactif doit rester utilisable dans les autres contextes.

- HTML non interactif : l'énoncé ne doit pas perdre l'information demandée si le helper retourne une chaîne vide.
- LaTeX : éviter d'insérer du HTML hors `context.isHtml`; fournir une version mathématique lisible.
- AMC : vérifier l'existant avant de modifier. `qcm` est naturellement proche d'AMC. `listeDeroulante` peut être convertie avec `listeDeroulanteToQcm()`. Pour certains champs MathLive simples, `handleAnswers()` renseigne des données AMC, mais les cas complexes doivent être vérifiés un par un.

Si un ancien exercice utilise `setReponse()`, ne pas le convertir mécaniquement sans vérifier l'export AMC. `setReponse()` existe encore comme adaptateur historique ; pour un nouveau code interactif HTML, préférer `handleAnswers()`.

## Validation locale

Après modification, tester au moins un tirage dans l'interface.

1. Lancer le serveur si besoin :

```bash
pnpm --pm-on-fail=ignore dev
```

2. Copier le `uuid` dans le fichier de l'exercice :

```ts
export const uuid = 'ccb71'
```

Puis ouvrir l'exercice avec ce `uuid` et forcer l'interactif dans l'URL :

```text
http://localhost:5173/alea/?uuid=UUID_DE_L_EXERCICE&i=1
```

Selon les routes disponibles localement, l'option peut aussi être portée par les paramètres globaux de l'interface. Si le `uuid` n'est pas pratique, tester aussi par l'identifiant ou la référence de l'exercice quand la route le permet, par exemple la valeur déclarée dans `refs`. Vérifier visuellement que les champs apparaissent.

3. Tester :

- une bonne réponse ;
- une mauvaise réponse ;
- une réponse vide ;
- une réponse équivalente que l'on veut accepter ;
- une réponse équivalente que l'on veut refuser ;
- le bouton "Nouvelles données".

4. Pour afficher les réponses attendues dans la console en local, ajouter `triche` à l'URL :

```text
http://localhost:5173/alea/?uuid=UUID_DE_L_EXERCICE&i=1&triche
```

5. Vérifier le rendu non interactif et la correction. Si l'exercice est compatible AMC, vérifier aussi l'export.

Avant commit, lancer au minimum :

```bash
pnpm --pm-on-fail=ignore prebuild-unit-tests
```

Si un fichier TypeScript ou Svelte a été modifié, lancer aussi :

```bash
pnpm --pm-on-fail=ignore check
```

Pour une modification très ciblée, ajouter ou adapter un test seulement si le comportement interactif, le comparateur ou l'export change durablement.

Pour une modification interactive dans un exercice, lancer aussi les vérifications ciblées décrites dans [tests de rapport d'exercices](../../tests/rapports-exercices.md), en remplaçant le chemin par le fichier modifié :

```bash
INTERACTIF_REPORT=1 CHANGED_FILES='src/exercices/2e/2G34-3.ts' pnpm --pm-on-fail=ignore vitest src/lib/amc/report-interactif.test.ts --run
```

Ce rapport vérifie notamment que les exercices `interactifReady=true` remplissent bien `autoCorrection`.

```bash
INTERACTIF_REPORT=1 CHANGED_FILES='src/exercices/2e/2G34-3.ts' pnpm --pm-on-fail=ignore vitest tests/integration/interactivity_all.test.ts --run
```

Ce test d'intégration vérifie que les réponses attendues sont acceptées par les comparateurs et par le DOM simulé. Pour plusieurs fichiers, mettre un chemin par ligne dans `CHANGED_FILES`.

## Erreurs fréquentes

- Oublier `export const interactifReady = true` : l'interface ne propose pas l'interactivité.
- Utiliser `mathLive` comme `formatInteractif` dans `handleAnswers()` : les formats internes sont en minuscules, `mathlive`, sauf la métadonnée historique `interactifType = 'mathLive'`.
- Ajouter un champ dans `texte` mais oublier `handleAnswers()` : le champ s'affiche, mais la validation ne connaît pas la réponse.
- Appeler `handleAnswers()` avec `{ value: ... }` au lieu de `{ reponse: { value: ... } }` pour un champ simple.
- Utiliser `champ1` dans `remplisLesBlancs()` et `reponse` dans `handleAnswers()` : les noms doivent correspondre.
- Oublier `{ formatInteractif: 'listeDeroulante' }`, `{ formatInteractif: 'dnd' }` ou `{ formatInteractif: 'svgSelection' }` pour les formats non MathLive.
- Comparer le `label` d'une liste déroulante au lieu de sa `value`.
- Utiliser un clavier trop limité : l'élève ne peut pas saisir une fraction, une unité ou une lettre nécessaire.
- Mettre le helper interactif uniquement dans une branche `if (context.isHtml)` et oublier le rendu LaTeX.
- Réinitialiser ou écraser `this.autoCorrection[i]` après `handleAnswers()`.
- Mélanger des indices : utiliser `i + 1` pour le champ mais `i` pour la réponse.

## Dépannage

**Le champ ne s'affiche pas.**  
Vérifier `interactifReady`, `this.interactif`, le contexte HTML, l'URL avec interactif activé et l'appel au helper dans la branche réellement exécutée.

**Le bouton de validation affiche toujours faux.**  
Ajouter `&triche` en local et comparer la réponse attendue normalisée avec la saisie. Vérifier aussi que la clé (`reponse`, `champ1`, `L1C1`, `rectangle1`) correspond au champ affiché.

**Une réponse équivalente devrait être acceptée mais ne l'est pas.**  
Changer les `options` de comparaison avant d'écrire un comparateur. Par exemple, utiliser `fractionEgale`, `fractionIrreductible`, `expressionNumerique`, `ensembleDeNombres`, `unite`, etc.

**Une réponse trop permissive est acceptée.**  
Préciser une option plus stricte : `nombreDecimalSeulement`, `fractionIdentique`, `texteAvecCasse`, `expressionNumerique`, ou une combinaison de checks.

**La liste déroulante ne se corrige pas.**  
Vérifier que chaque choix a une `value`, que la réponse attendue est une de ces `value`, et que `handleAnswers()` reçoit `{ formatInteractif: 'listeDeroulante' }`.

**Le QCM ne s'affiche pas ou ne se corrige pas.**  
Vérifier que `this.autoCorrection[i].propositions` contient au moins deux propositions, que chaque proposition a un `statut` booléen, puis que `propositionsQcm(this, i)` est bien appelé avant d'affecter `this.listeQuestions[i]`.

**Les réponses restent celles du tirage précédent.**  
Ne pas utiliser `push()` dans `autoCorrection` si l'exercice affecte les questions par indice. Préférer `this.autoCorrection[i] = ...` ou laisser `handleAnswers()` remplir l'entrée courante.

**Le LaTeX contient du HTML.**  
Encadrer la partie HTML avec `context.isHtml` ou `this.interactif`, et fournir une chaîne LaTeX de remplacement.

**AMC a régressé.**  
Comparer avec l'ancien comportement. Pour QCM et listes déroulantes, garder les données `autoCorrection` attendues par AMC. Pour un champ MathLive complexe, il peut être préférable de conserver une branche AMC dédiée avec `context.isAmc`.

## Checklist de fin

- Les exports `interactifReady` et `interactifType` sont présents et cohérents.
- Chaque champ affiché a une réponse enregistrée.
- Chaque `formatInteractif` est correct.
- Les options de comparaison correspondent à l'intention pédagogique.
- Une bonne réponse, une mauvaise réponse et une réponse vide ont été testées.
- Le rendu non interactif et LaTeX reste lisible.
- L'export AMC a été vérifié si l'exercice l'annonce.
- Les commandes de validation adaptées ont été lancées.
