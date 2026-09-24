# Checks composables

`fonctionComparaison()` et ses [options](options-de-comparaison.md) rendent un
verdict juste ou faux, avec une seule famille d'options à la fois. Les checks
de `src/lib/interactif/checks/` permettent de combiner plusieurs critères, de
donner un score partiel et de choisir le feedback de chaque critère.

Ce n'est pas un remplacement : `fonctionComparaison()` reste la comparaison par
défaut, et plusieurs checks l'utilisent en interne.

## Utiliser un comparateur dans un exercice

On ne passe jamais un check seul : on combine une liste de checks avec `all()`
ou `seq()`, ce qui produit un comparateur à donner à la clé `compare` de la
réponse attendue.

```ts
import { all, isEqual, isReduced } from '../../lib/interactif/checks'

handleAnswers(this, i, {
  reponse: {
    value: '2x+3',
    compare: all([isEqual({ weight: 0.6 }), isReduced({ weight: 0.4 })]),
  },
})
```

`value` reste obligatoire : c'est la réponse attendue passée à chaque check, et
elle sert aux exports. Exemples dans le dépôt :
`src/exercices/3e/3L11-11.ts`, `src/exercices/TSpe/TSG2-41.ts`.

Le `score` du comparateur (entre 0 et 1) devient le nombre de points du champ :
un champ unique vaut donc 0,6 point si seul `isEqual` réussit ci-dessus.

## Combinateurs

### `all(checks)`

- Tous les checks sont évalués, même après un échec.
- `isOk` vaut `true` seulement si tous les checks réussissent.
- Avec des poids, le score est la somme des poids des checks réussis ; sans
  poids, il vaut 1 ou 0.

### `seq(checks)`

- Les checks sont évalués dans l'ordre et l'évaluation s'arrête au premier
  échec.
- Utile pour des critères hiérarchiques : inutile de vérifier la forme si la
  valeur est fausse, et seul le message du premier échec est affiché.
- Avec des poids, le score est la somme des poids des checks réussis avant
  l'échec.

### Résultat

```ts
type CompareResult = {
  isOk: boolean
  score: number // entre 0 et 1
  feedback: string // messages retenus, joints par \n
  details: Array<{ name: string; passed: boolean }>
}
```

Le feedback contient le message d'échec (`feedbackKo`) des checks ratés et le
message de réussite (`feedbackOk`) des checks réussis quand la réponse globale
est fausse. Quand elle est juste, seuls les checks avec
`feedbackOnSuccess: true` affichent leur message.

Contrôles faits à la création du comparateur (une erreur est levée sinon) :

- les noms de checks sont uniques dans le comparateur ;
- soit aucun check n'a de poids, soit tous en ont un et leur somme vaut 1.

## Options communes

Tous les checks acceptent ces options (`CheckOverrides` dans
`src/lib/interactif/checks/types.ts`) :

| Option              | Type      | Rôle                                                                                     |
| ------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `name`              | `string`  | Nom dans `details` ; à changer pour utiliser deux fois le même check                     |
| `weight`            | `number`  | Poids dans le score partiel                                                              |
| `feedbackEnabled`   | `boolean` | `false` : le check ne contribue pas au feedback                                          |
| `feedbackOnSuccess` | `boolean` | `true` : le message est affiché même quand la réponse est juste (remarque non bloquante) |
| `feedbackKo`        | `string`  | Remplace le message d'échec par défaut                                                   |
| `feedbackOk`        | `string`  | Message affiché quand ce check réussit mais que la réponse est fausse                    |

## Catalogue

Chaque titre porte le nom exporté par `src/lib/interactif/checks/index.ts`. Les
exemples « saisie → verdict » ont été vérifiés sur le code actuel ; quand la
réponse attendue n'est pas indiquée, le check ne regarde que la saisie.

### Égalité

#### `isEqual`

Égalité mathématique, via `fonctionComparaison()`.

```ts
isEqual()
isEqual({ tolerance: -2 }) // accepte un écart jusqu'à 10^-2
isEqual({ comparisonOptions: { fractionEgale: true } })
```

| Option              | Rôle                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `tolerance`         | Exposant : accepte un écart jusqu'à `10^tolerance`. Saisie et réponse doivent être des expressions arithmétiques (pas de `\pi`) ou des monômes simples comme `2.5x`. |
| `comparisonOptions` | [Options](options-de-comparaison.md) transmises à `fonctionComparaison()`                   |

| Saisie      | Réponse attendue | Option            | Verdict |
| ----------- | ---------------- | ----------------- | ------- |
| `\sqrt{36}` | `6`              |                   | ✓       |
| `1,5`       | `1.5`            |                   | ✓       |
| `3.14`      | `3.1416`         | `tolerance: -2`   | ✓       |
| `3.1`       | `3.1416`         | `tolerance: -2`   | ✗       |

Message de réussite par défaut : « La valeur est correcte. ».

#### `fromOptions`

Délègue entièrement à `fonctionComparaison()` avec les options données, pour
réutiliser n'importe quelle [option de comparaison](options-de-comparaison.md) :

```ts
fromOptions({ fractionIrreductible: true })
fromOptions({ ensembleDeNombres: true }, { name: 'ensemble', weight: 0.5 })
```

Le second argument reçoit les [options communes](#options-communes).

### Même objet

#### `sameWithUnit`

Grandeurs avec unités, conversions autorisées (option `unite` de
`fonctionComparaison()`).

| Option           | Rôle                                                     |
| ---------------- | -------------------------------------------------------- |
| `precision`      | Tolérance, transmise à `precisionUnite`                  |
| `strictSameUnit` | Exige l'unité de la réponse attendue                     |

| Saisie                            | Réponse attendue | Option                 | Verdict                                                                 |
| --------------------------------- | ---------------- | ---------------------- | ----------------------------------------------------------------------- |
| `100\operatorname{\mathrm{cm}}`   | `1m`             |                        | ✓                                                                       |
| `1,5\operatorname{\mathrm{kg}}`   | `1500g`          |                        | ✓                                                                       |
| `2\operatorname{\mathrm{km}}`     | `1m`             |                        | ✗                                                                       |
| `100\operatorname{\mathrm{cm}}`   | `1m`             | `strictSameUnit: true` | ✗ La grandeur est correcte mais l'unité attendue n'est pas respectée.   |

#### `sameCoordinates`

Coordonnées, dans l'ordre (option `coordonnees`). `(2;3)`, `(2 ; 3)` et `2;3`
sont acceptés pour `(2;3)` ; `(3;2)` est refusé avec « Coordonnée 1
incorrecte ».

#### `sameInterval`

Intervalles et réunions d'intervalles (option `intervalle`). `[2;3]\cup[4;5]`
est accepté pour lui-même ; `[2;6]` est refusé pour `[2;5]`.

#### `sameDuration`

Durées, comparées avec `Hms` quelle que soit l'écriture.

| Option | Rôle                                                                                   |
| ------ | -------------------------------------------------------------------------------------- |
| `unit` | `'any'` (défaut), `'hms'`, `'h'`, `'min'` ou `'s'` : unité que la saisie doit contenir |

| Saisie    | Réponse attendue | Option        | Verdict |
| --------- | ---------------- | ------------- | ------- |
| `1h30min` | `90min`          |               | ✓       |
| `5400s`   | `90min`          |               | ✓       |
| `1h30min` | `90min`          | `unit: 'hms'` | ✓       |
| `1.5h`    | `90min`          | `unit: 'hms'` | ✗       |

#### `sameNumberTuple`

Tuple ordonné entre parenthèses. `(2 ; 3 ; 5)` est accepté pour `(2;3;5)` ;
`(3;2;5)` est refusé (ordre), `2;3;5` aussi (« Un tuple doit être écrit entre
parenthèses, par exemple $(1;2;3)$. »).

#### `sameNumberList`

Liste de nombres séparés par des points-virgules, sans tenir compte de l'ordre
(option `suiteDeNombres`). `1;2;3` est accepté pour `3;1;2` ; `1;2` est refusé
avec « Toutes les valeurs sont correctes mais il en manque 1. ». Avec
`allowRepeatedNumbers: true`, les doublons de la saisie sont ignorés.

#### `sameOrderedNumberList`

Même chose en respectant l'ordre (option `suiteRangeeDeNombres`) : `3;2;1` est
refusé pour `1;2;3`.

#### `sameIntegerProgressionSet`

Deux expressions décrivent-elles le même ensemble quand leur variable parcourt
$\mathbb{Z}$ ? Utile pour les solutions d'équations trigonométriques ou les
congruences.

| Option                     | Rôle                                                                    |
| -------------------------- | ----------------------------------------------------------------------- |
| `variable`                 | Variable entière ; déduite des expressions si absente                   |
| `allowMultipleExpressions` | Accepte une liste de plusieurs progressions                            |

| Saisie     | Réponse attendue | Verdict                                              |
| ---------- | ---------------- | ---------------------------------------------------- |
| `2k\pi`    | `2k\pi-2\pi`     | ✓                                                    |
| `4n+1`     | `4n-3`           | ✓                                                    |
| `2x+2`     | `2x`             | ✓                                                    |
| `2x`       | `4x`             | ✗ Les expressions ne décrivent pas le même ensemble. |
| `2x+1`     | `2x+2`           | ✗                                                    |

#### `sameParametricLine`

La saisie, un système `\begin{cases}…\end{cases}` affine en une variable, est
une représentation paramétrique de la même droite. La réponse attendue est ce
même type de système ou un JSON
`{"point":[x0,y0,z0],"direction":[a,b,c]}`. Option `dimension` : `3` (défaut)
ou `2`.

Pour `{"point":[1,1,-1],"direction":[-3,0,4]}` :

| Saisie                                                    | Verdict                                                   |
| --------------------------------------------------------- | --------------------------------------------------------- |
| `\begin{cases}x=1-3t\\y=1\\z=-1+4t\end{cases}`            | ✓                                                         |
| `\begin{cases}x=1-6s\\y=1\\z=-1+8s\end{cases}`            | ✓ vecteur directeur colinéaire                            |
| `\begin{cases}x=-2-3u\\y=1\\z=3+4u\end{cases}`            | ✓ autre point de la droite                                |
| `\begin{cases}x=1-3t\\y=2\\z=-1+4t\end{cases}`            | ✗ La représentation paramétrique ne décrit pas la droite attendue. |
| `\begin{cases}x=1-3t^2\\y=1\\z=-1+4t\end{cases}`          | ✗ expression non affine                                   |

Pour une saisie répartie dans plusieurs champs, voir
`sameParametricLineFromFieldsCallback()` dans
`src/lib/interactif/checks/sameParametricLineFromFields.ts`.

#### `sameSet`

Ensembles en extension, sans ordre (option `ensembleDeNombres`). `\{-2;0;5\}`
est accepté pour `\{5;-2;0\}` ; `\{1;2\}` est refusé pour `\{1;2;3\}` (« Toutes
les valeurs sont correctes mais il en manque 1. ») ; `\{1;1;2\}` est refusé
(valeurs répétées).

#### `singleParameterVariable`

Le système paramétrique saisi utilise une seule variable.

| Option                    | Rôle                                                                       |
| ------------------------- | -------------------------------------------------------------------------- |
| `dimension`               | `3` (défaut) ou `2`                                                        |
| `expectedParameter`       | Nom ou liste de noms attendus                                              |
| `strictExpectedParameter` | `true` : un autre nom fait échouer le check ; `false` (défaut) : simple avertissement |

Associé à `feedbackOnSuccess: true`, l'avertissement s'affiche même quand la
droite est juste :

```ts
all([
  sameParametricLine(),
  singleParameterVariable({ expectedParameter: 'k', feedbackOnSuccess: true }),
])
```

Avec `t` au lieu de `k`, la réponse est juste et le message « La variable de
paramétrage attendue est $k$ plutôt que $t$. » s'affiche.

### Réduction et forme imposée

#### `isReduced`

Expression réduite : combine `noTrivialFactor`, `noNumericComputation`,
`termsGrouped` et `isDistributed`. Option `allowReducibleFractions` : laisse
passer les fractions numériques réductibles.

#### `noTrivialFactor`

Refuse `1x` et `x+0` ; accepte `x`, `xy`.

#### `noNumericComputation`

Refuse un calcul numérique restant : `1+1`, `2\times 3`, `\sqrt{4}` ; accepte
`2x`, `\sqrt{3}`.

#### `termsGrouped`

Refuse des termes semblables non regroupés : `x+x`, `2x+3x` ; accepte `2x+3y`.

#### `isDistributed`

Refuse un produit non développé : `2(x+1)`, `(1+x)y` ; accepte `2x+2`.

#### `onlyIrreducibleFractions`

Toutes les fractions de la saisie sont irréductibles. `\dfrac{1}{2}` et `3`
sont acceptés ; `\dfrac{2}{4}` et `x+\dfrac{6}{9}` sont refusés.

#### `fractionReducedFromExpected`

La saisie est une fraction égale à la réponse attendue, obtenue en divisant ses
termes par un entier supérieur à 1. Pour `\frac{90}{120}` : `\frac{9}{12}` et
`\frac{3}{4}` sont acceptés ; `\frac{90}{120}` et `\frac{60}{80}` sont refusés.

#### `noSquareRootInDenominator`

Refuse une racine carrée au dénominateur : `\frac{\sqrt{2}}{2}` est accepté,
`\frac{1}{\sqrt{2}}` refusé.

#### `noDecimal`

Refuse une écriture décimale non entière : `3.14` et `2,75` sont refusés ;
`3`, `3.0`, `\dfrac{1}{2}` et `\sqrt{2}` sont acceptés.

#### `extractedRadicands`

La saisie est égale à la réponse attendue et ses racines carrées sont
simplifiées. Pour `\sqrt{12}` : `2\sqrt{3}` est accepté, `\sqrt{12}` refusé
(« Les facteurs carrés doivent être extraits des racines carrées. »). Pour `2`,
`\sqrt{4}` est refusé.

#### `coordinatesReduced`

Chaque coordonnée est réduite : `(2;3)` et `(\sqrt{3};1)` sont acceptés ;
`(1+1;3)`, `(2x+x;3)` et `(\frac{4}{2};3)` sont refusés. La valeur n'est pas
vérifiée : combiner avec `sameCoordinates`.

#### `intervalBoundsReduced`

Chaque borne est réduite : `[1;3]`, `]-\sqrt{2};\frac{1}{3}[` et `\emptyset`
sont acceptés ; `[1+1;3]` et `[\frac{4}{2};3]` sont refusés. Combiner avec
`sameInterval` pour vérifier la valeur.

### Texte et motif

#### `stringEquals`

Comparaison textuelle, sans interprétation mathématique. Options `trim` et
`ignoreCase` (défaut `false`). Avec `{ ignoreCase: true, trim: true }`,
` Vrai ` est accepté pour `vrai`. `stringComparison()` est un alias.

#### `contains`

La saisie contient un texte ou vérifie une expression régulière :

```ts
contains('\\sin')
contains(/x\^2/i)
contains({ pattern: '\\sin', feedbackKo: 'Écrire la réponse avec sin.' })
```

#### `doesNotContain`

Inverse de `contains`, pour interdire une notation :
`doesNotContain({ pattern: '\\times', feedbackKo: 'Ne pas utiliser le signe ×.' })`.

### Type d'écriture

#### `isFraction`

La saisie est une fraction (`\frac`, `\dfrac`, `\tfrac`, `\cfrac` ou `/`) :
`\dfrac{3}{4}`, `3/4`, `\frac{-1}{2}` sont acceptés ; `0.75` et `3` refusés.

#### `isDecimalFraction`

Fraction de dénominateur 10, 100, 1000… : `\dfrac{3}{10}`, `75/1000` sont
acceptés ; `\dfrac{1}{3}` et `0.75` refusés.

#### `onlyDecimalNumbers`

Uniquement des nombres décimaux ou entiers : `3.14`, `42`, `-0.5` sont
acceptés ; `\dfrac{3}{4}` et `\sqrt{2}` refusés.

#### `isScientificNotation`

Forme `a\times10^n` ou `a\cdot10^n` avec $1\leqslant|a|<10$ :
`3.2 \times 10^4` et `1 \cdot 10^{-3}` sont acceptés ; `0.5 \times 10^5` et
`32000` refusés.

#### `isPowerForm`

La saisie est une puissance. Options `forbidExponentOne` (refuse `x^1`) et
`exactExpectedPower` (exige la même puissance que la réponse attendue). `2^3`
est accepté, `8` refusé.

#### `hasGroupedNumberSpacing`

La saisie reproduit la réponse attendue avec des espaces entre les classes de
chiffres. Pour `1234567` : `1 234 567` et `1\,234\,567` sont acceptés ;
`1234567` et `1 234567` sont refusés.

#### `noTrigonometry`

Refuse `cos`, `sin`, `tan`, avec ou sans antislash.

### Équations

#### `isEquation`

Exactement un signe `=` : `2x+1=5` est accepté, `2x+1` et `x=2=3` refusés.

#### `isEquivalentEquation`

Équation équivalente à la réponse attendue, testée en plusieurs points :
`2x=6` pour `x=3` et `4x-2=10` pour `2x-1=5` sont acceptés ; `x=4` est refusé
pour `x=3`.

#### `hasZeroMember`

Un membre est nul : `2x-6=0` et `0=x+1` sont acceptés ; `2x=6` refusé.

### Appartenance

#### `valueInInterval`

Nombre de l'intervalle donné comme réponse attendue (option
`estDansIntervalle`) : `2` est accepté pour `[2;5]` ; `7` pour `[2;5]` et
`1.9` pour `]2;5[` sont refusés.

### Primitives

Ces checks comparent des fonctions par
échantillonnage numérique. Options : `variable` (défaut `x`), `constant`
(défaut `c`), `domaine` (défaut `[-3, 3]`, à choisir dans le domaine de
définition).

| Check                              | Vérifie                                                                 | Exemple                                                                    |
| ---------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `samePrimitiveUpToConstant`        | Même fonction que la réponse attendue à une constante près              | Pour `x^2` : `x^2+c` et `x^2+5` ✓ ; `x^3` ✗                                 |
| `integrationConstantPresence`      | Présence de la constante (ou absence avec `expected: false`)            | `x^2+c` ✓ ; `x^2` ✗ « Il manque la constante d'intégration $+c$. »          |
| `sameFunctionWithConstantFeedback` | Égalité stricte, avec un message dédié si seule la constante diffère   | Pour `x^2+3` : `x^2+5` ✗ « … son terme constant ne vérifie pas la condition demandée. » |

`samePrimitiveUpToConstant({ requireConstantEffect: true })` exige en plus que
la saisie dépende de la constante.

## Exemples

Fraction irréductible, valeur à 70 % et forme à 30 % :

```ts
all([isEqual({ weight: 0.7 }), onlyIrreducibleFractions({ weight: 0.3 })])
```

Pour `\dfrac{1}{2}` : `\dfrac{2}{4}` obtient 0,7, `\dfrac{1}{3}` 0,3 (la
fraction est irréductible mais fausse), `\dfrac{1}{2}` 1.

Expression réduite, valeur à 60 % et réduction à 40 % : pour `2x+3`, la saisie
`x+x+3` obtient 0,6 avec le message « Cette expression n'est pas assez
réduite : les termes semblables doivent être regroupés. ».

```ts
all([isEqual({ weight: 0.6 }), isReduced({ weight: 0.4 })])
```

Forcer une notation après avoir vérifié la valeur :

```ts
seq([
  isEqual(),
  contains({ pattern: '\\sin', feedbackKo: 'Écrire la réponse avec sin.' }),
])
```

Un check sur mesure implémente directement le type `Check` :

```ts
import type { Check } from '../../lib/interactif/checks'

const sansSigneMoins: Check = {
  name: 'sansSigneMoins',
  run: (saisie) => ({
    passed: !saisie.includes('-'),
    feedbackKo: 'Ne pas mettre de signe moins dans la réponse.',
  }),
}

all([isEqual(), sansSigneMoins])
```

`run` reçoit toujours la saisie et la réponse attendue, et peut ignorer la
seconde s'il ne vérifie que la forme.

## Page de test

La vue `check-test` (`src/components/devtools/CheckTest.svelte`) permet
d'essayer les checks sans écrire de code :
`http://localhost:5173/alea/?v=check-test`.

Elle permet de saisir la réponse attendue et une réponse d'élève, d'ajouter et
de paramétrer des checks, de choisir `all` ou `seq`, de voir le résultat de
chaque check, de copier le code TypeScript correspondant et de partager un lien
préconfiguré. Chaque check de la page renvoie vers sa section ci-dessus.

## Maintenance

- Les tests sont à côté du code : `src/lib/interactif/checks/*.test.ts`
  (lancés par `pnpm test:src`).
- Un nouveau check est exporté par `src/lib/interactif/checks/index.ts`,
  ajouté à la page de test (`CheckKind`, `CHECK_GROUPS`) et documenté ici sous
  un titre portant son nom exact, que la page de test utilise comme ancre.
