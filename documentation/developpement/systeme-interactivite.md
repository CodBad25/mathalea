# Système d'interactivité

## Vue d'ensemble

Le système d'interactivité permet aux exercices de devenir interactifs : les élèves répondent directement dans le navigateur, puis leurs réponses sont automatiquement vérifiées par rapport aux valeurs attendues.

---

## 1. Tous les types d'interactivité

Définis dans `src/lib/types.ts` :

```typescript
export type InteractivityType =
  | 'qcm'
  | 'mathlive'
  | 'fillInTheBlank'
  | 'tableauMathlive'
  | 'texte'
  | 'cliqueFigure'
  | 'dnd'
  | 'listeDeroulante'
  | 'custom'
  | 'tableur'
  | 'MetaInteractif2d'
  | 'svgSelection'
  | 'multiMathfield'
```

### 1.1 `mathlive` (par défaut)

Champ MathLive `<math-field>` pour les expressions mathématiques en LaTeX. C'est le mode le plus courant. L'élève saisit une expression mathématique, puis la saisie est comparée avec `fonctionComparaison()`.
**Fichier :** `src/lib/interactif/questionMathLive.ts`

### 1.2 `fillInTheBlank`

Champ MathLive en lecture seule avec des emplacements `\placeholder[name]{}` intégrés que les élèves complètent. La syntaxe `%{name}` est convertie en emplacements MathLive. Chaque trou possède sa propre entrée de réponse (`champ1`, `champ2`, etc.).
**Fichier :** `questionMathLive.ts`, fonction `remplisLesBlancs()`

### 1.3 `tableauMathlive`

Tableau HTML avec cellules MathLive. Chaque cellule est indexée par `L{row}C{col}`.
**Fichier :** `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`

### 1.4 `texte`

Champ texte HTML `<input>` simple, sans MathLive. Utilisé pour les réponses textuelles.
**Fichier :** `questionMathLive.ts`, fonction `ajouteChampTexte()`

### 1.5 `qcm`

Questions à choix multiple avec cases à cocher ou boutons radio. Les exercices définissent des `propositions` avec `{texte, statut, feedback}`. Options prises en charge : `radio` (sélection unique), `vertical`, `ordered`, `lastChoice`.
**Fichier :** `src/lib/interactif/qcm.ts`

### 1.6 `listeDeroulante`

Web Component personnalisé `<liste-deroulante>`. Les choix peuvent contenir des libellés, du LaTeX, des images ou du SVG.
**Fichier :** `src/lib/interactif/questionListeDeroulante.ts`

### 1.7 `dnd`

Glisser-déposer. Les exercices définissent des objets `Etiquette` (libellés avec identifiant et contenu). Les utilisateurs déposent les étiquettes dans des zones "rectangle". Prend en charge la souris et le tactile, les étiquettes `duplicable`, `multi` (plusieurs étiquettes par zone) et `ordered`.
**Fichier :** `src/lib/interactif/DragAndDrop.ts`

### 1.8 `cliqueFigure`

Les figures SVG reçoivent des gestionnaires de clic. Un clic bascule leur `etat`. À la vérification, chaque `etat` de figure est comparé à sa `solution`.
**Fichiers :** `src/lib/interactif/cliqueFigure.js` (historique), `src/lib/interactif/gestionInteractif.ts`

### 1.9 `svgSelection`

Web Component `<svg-selection>`. Les SVG sont présentés en lignes ou colonnes, chacun avec une valeur numérique `value`. La sélection encode la somme des valeurs.
**Fichier :** `src/lib/interactif/questionSvgSelection/questionSvgSelection.ts`

### 1.10 `custom`

L'exercice fournit sa propre fonction `correctionInteractive(i)`, qui retourne `'OK'` ou `'KO'`.

### 1.11 `tableur`

Interaction de type feuille de calcul.
**Fichier :** `src/lib/tableur/outilsTableur.ts`

### 1.12 `MetaInteractif2d`

Utilisé pour la géométrie 2D avec plusieurs champs MathLive intégrés dans des constructions géométriques.

### 1.13 `multiMathfield`

Web Component `<multi-mathfield>` pour une réponse composée de plusieurs champs MathLive synchronisés avec un même gabarit. Les champs sont indexés par `field0`, `field1`, etc.
**Fichier :** `src/lib/interactif/MultiMathfield/MultiMathfield.ts`, vérification dans `src/lib/interactif/gestionInteractif.ts`

---

## 2. Fonctionnement de `handleAnswers()`

**Fichier :** `src/lib/interactif/gestionInteractif.ts`

```typescript
export function handleAnswers(
  exercice: IExercice,
  question: number,
  reponses: Valeur,
  params: ReponseParams | undefined = {},
)
```

C'est la **fonction moderne privilégiée** pour définir les réponses attendues :

1. Détermine `formatInteractif` depuis les paramètres ou utilise `'mathlive'` par défaut.
   - Si `champ1` est présent, le format est déduit comme `fillInTheBlank`.
   - Si des clés `L{row}C{col}` sont présentes, le format est déduit comme `tableauMathlive`.
   - Sinon, le format existant de `autoCorrection[question]` est conservé si présent.
2. En contexte AMC, initialise `autoCorrectionAMC[question]` et tente d'inférer une réponse AMC pour les réponses `mathlive` numériques simples (`number`, `string`, `FractionEtendue`, `Decimal`).
3. Initialise `autoCorrection[question]` si nécessaire.
4. **Normalise les valeurs de réponse** via `handleDefaultValeur()` :
   - `FractionEtendue` → chaîne LaTeX `.texFraction`
   - `Decimal`, `Grandeur`, `Hms`, `number` → `.toString()`
   - définit `compare` à `fonctionComparaison` par défaut
   - détecte automatiquement les nombres valides et active `nombreDecimalSeulement: true`
5. Stocke le résultat dans `exercice.autoCorrection[question].valeur` et `.param`.

### Interface `Valeur`

```typescript
export interface Valeur {
  bareme?: (listePoints: number[]) => [number, number]
  feedback?: (saisies: Record<string, string>) => string
  reponse?: AnswerType
  champ1?: AnswerType // champs fillInTheBlank
  champ2?: AnswerType // ... jusqu'à champ6
  rectangle1?: AnswerType // zones de glisser-déposer
  // ... jusqu'à rectangle8
  field0?: AnswerType // champs multiMathfield, jusqu'à field8
  L1C1?: AnswerType // cellules tableauMathlive, jusqu'à L3C5
  sheetAnswer?: SheetAnswerType // interaction tableur
  callback?: Function // vérification personnalisée avec score détaillé
}
```

Chaque `AnswerType` contient :

- `value` : la réponse attendue (chaîne, tableau de chaînes ou types spéciaux avant normalisation)
- `compare` : fonction de comparaison (par défaut `fonctionComparaison`)
- `options` : `OptionsComparaisonType` qui contrôle le comportement de comparaison

---

## 3. Fonctionnement de `setReponse()` (historique)

**Fichier :** `src/lib/interactif/gestionInteractif.ts`

Un **adaptateur déprécié** autour de `handleAnswers()` traduit les anciens formats :

| Ancien format | Effet |
| --- | --- |
| `calcul` (par défaut) | Nettoie les chaînes, appelle `handleAnswers` avec `fonctionComparaison` |
| `Num` | Extrait le numérateur depuis `FractionEtendue` |
| `Den` | Extrait le dénominateur depuis `FractionEtendue` |
| `texte` | Texte avec respect de la casse |
| `ignorerCasse` | Comparaison en minuscules |
| `fractionEgale` | Transmet directement `FractionEtendue` |
| `unites` | Transmet `Grandeur` avec précision d'unité |
| `intervalleStrict` | Vérification d'intervalle `]a;b[` |
| `intervalle` | Vérification d'intervalle `[a;b]` |
| `puissance` | Comparaison de puissances ou d'exposants |

---

## 4. Vérification des réponses par type

Le point de distribution central est `exerciceInteractif()` dans `gestionInteractif.ts`. Il parcourt toutes les questions et redirige selon `formatInteractif`.

### MathLive / fillInTheBlank / tableauMathlive / texte → `verifQuestionMathLive()`

**Fichier :** `src/lib/interactif/mathLive.ts`

- **Champ unique :** lit `champTexteEx{exo}Q{i}.value`, appelle `compareFunction(saisie, reponse, options)`, puis affiche un retour avec emoji.
- **Texte à trous :** lit chaque emplacement via `mfe.getPromptValue(key)`, compare indépendamment, définit l'état du champ à `'correct'` ou `'incorrect'`, puis agrège avec `bareme`.
- **Tableau :** lit chaque cellule `L{row}C{col}`, compare indépendamment, puis affiche un retour par cellule.
- **Rappel :** si `reponses.callback` existe, l'appelle directement.

### MultiMathfield → `verifQuestionMultiMathfield()`

**Fichier :** `src/lib/interactif/gestionInteractif.ts`

Lit les valeurs du composant `<multi-mathfield>`, compare chaque champ `field*` avec sa réponse attendue, affiche un retour par champ et agrège le score.

### QCM → `verifQuestionQcm()`

**Fichier :** `src/lib/interactif/qcm.ts`

- Compte les réponses attendues comme correctes depuis `propositions[k].statut`.
- Vérifie l'état `checked` de chaque case.
- Retourne `'OK'` seulement si toutes les bonnes réponses sont cochées et aucune mauvaise ne l'est.
- Affiche un retour par item.

### Liste déroulante → `verifQuestionListeDeroulante()`

Comparaison exacte simple : `value === reponse`.

### Sélection SVG → `verifQuestionSvgSelection()`

Compare la valeur encodée de la sélection à la valeur attendue. Prend en charge un tableau de valeurs acceptées.

### Glisser-déposer → `verifDragAndDrop()`

- Retire tous les écouteurs de glisser-déposer et de tactile.
- Pour chaque rectangle, vérifie quels identifiants d'étiquette sont à l'intérieur.
- Prend en charge `ordered`, la comparaison non ordonnée et les réponses alternatives séparées par `|`.
- Retour visuel par classes CSS (vert ou rouge).

### Clic sur figure → `verifQuestionCliqueFigure()`

Compare chaque `eltFigure.etat` à `objetFigure.solution`.

### Personnalisé → `verifExerciceCustom()`

Appelle `exercice.correctionInteractive(i)`, qui retourne `'OK'` ou `'KO'`.

---

## 5. Fonction principale de comparaison : `fonctionComparaison()`

**Fichier :** `src/lib/interactif/comparisonFunctions.ts`

Répartit selon les options :

| Option | Comparaison |
| --- | --- |
| `HMS` | Heures, minutes et secondes |
| `fonction` | Évaluation de fonction sur un domaine |
| `intervalle` | Comparaison de notation d'intervalle |
| `estDansIntervalle` | Vérifie si la saisie appartient à un intervalle |
| `ecritureScientifique` | Écriture scientifique |
| `unite` | Comparaison avec unité et tolérance |
| `factorisation` | Forme factorisée via ComputeEngine |
| `puissance` | Expressions avec puissances ou exposants |
| `texteAvecCasse` | Texte sensible à la casse |
| `texteSansCasse` | Texte sans prise en compte de la casse |
| `coordonnees` | Coordonnées de points |
| `egaliteExpression` | Égalité d'équations |
| `nombreAvecEspace` | Nombres avec espaces |
| `expressionNumerique` | Expressions numériques |
| `ensembleDeNombres` / `kUplet` | Ensembles ou tuples |
| `suiteDeNombres` / `suiteRangeeDeNombres` | Suites de nombres, ordonnées si `suiteRangeeDeNombres` est activé |
| `fractionSimplifiee` / `fractionReduite` / `fractionIrreductible` / `fractionDecimale` / `fractionEgale` / `fractionIdentique` | Vérifications spécialisées de fractions |
| `developpementEgal` | Égalité de forme développée |
| `calculFormel` | Comparaison symbolique |
| **Par défaut** | `expressionDeveloppeeEtReduiteCompare` — utilise ComputeEngine pour comparer la forme canonique |

**Nettoyage de la saisie :** `generateCleaner()` produit une chaîne de fonctions de nettoyage : `fractions`, `virgules` (virgules → points), `espaces`, `parentheses`, `puissances`, `divisions`, `latex`, `mathrm`, `operatorName`, `imaginaires`, etc.

---

## 6. Types de valeurs de réponse

```typescript
export type AnswerValueType =
  | string
  | string[]
  | number
  | number[]
  | IFractionEtendue
  | IFractionEtendue[]
  | Decimal
  | Decimal[]
  | IGrandeur
  | IGrandeur[]
  | Hms
  | Hms[]
  | Complexe
  | Complexe[]
```

`handleDefaultValeur()` normalise tout en chaînes :

- `FractionEtendue` → `.texFraction` (par exemple `\frac{3}{4}`)
- `Decimal` → `.toString()`
- `Grandeur` → `.toString()` (nombre + unité)
- `Hms` → `.toString()`
- `number` → `String(value)`

---

## 7. Barème

### Par question

Chaque fonction de vérification retourne : `{ isOk, feedback, score: { nbBonnesReponses, nbReponses } }`

### Fonction de barème

Deux barèmes intégrés :

- **`toutPourUnPoint`** (par défaut) : `[min(...points), 1]` — tout ou rien, 1 point maximum
- **`toutAUnPoint`** : `[sum(points), points.length]` — 1 point par sous-réponse correcte

### À l'échelle de l'exercice

`exerciceInteractif()` accumule les scores des questions et appelle `afficheScore()`, qui affiche `nbBonnesReponses / total`.

### Mode CAN

Dans `gestionCan.ts`, chaque question possède son propre bouton de vérification. Le score est accumulé dans `context.nbBonnesReponses` / `context.nbMauvaisesReponses`.

---

## 8. Flux complet : définition → affichage → vérification

**Étape 1 — Définition de l'exercice** (dans `nouvelleVersion()`) :

```typescript
// Simple:
this.reponse = '42'

// Moderne :
handleAnswers(
  this,
  i,
  {
    reponse: {
      value: '42',
      compare: fonctionComparaison,
      options: { nombreDecimalSeulement: true },
    },
  },
  { formatInteractif: 'mathlive' },
)

// Historique :
setReponse(this, i, 42, { formatInteractif: 'calcul' })
```

L'exercice définit aussi `this.interactifReady = true` et `this.interactifType`.

**Étape 2 — Génération HTML** (dans le code de construction des questions) :

```typescript
texte += ajouteChampTexteMathLive(this, i, keyboardType.clavierDeBase)
// ou : propositionsQcm(this, i), choixDeroulant(), new DragAndDrop().ajouteDragAndDrop(), etc.
```

**Étape 3 — Affichage :** le HTML est inséré dans le DOM, puis l'événement `exercicesAffiches` est émis.

**Étape 4 — Interaction utilisateur :** l'élève interagit avec les champs.

**Étape 5 — Validation :** clic sur le bouton "Vérifier" → `exerciceInteractif()` :

1. Parcourt les entrées de `autoCorrection`.
2. Redirige vers la fonction `verifQuestion*` adaptée selon `formatInteractif`.
3. Chaque fonction lit la saisie de l'élève dans le DOM, compare, affiche le retour et renvoie le score.
4. `afficheScore()` affiche le total.

**Étape 6 — Retour utilisateur :**

- Par champ : emoji dans le span `resultatCheckEx{exo}Q{i}`
- Par question : texte dans la div `feedbackEx{exo}Q{i}`
- Par exercice : affichage du score
- Selon le type : états des emplacements (`fillInTheBlank`), couleurs de fond (QCM, glisser-déposer)

---

## Référence des fichiers clés

| Fichier | Rôle |
| --- | --- |
| `src/lib/interactif/gestionInteractif.ts` | Orchestrateur central : `handleAnswers()`, `setReponse()`, `exerciceInteractif()` |
| `src/lib/interactif/comparisonFunctions.ts` | `fonctionComparaison()` et tous les comparateurs spécialisés |
| `src/lib/interactif/mathLive.ts` | `verifQuestionMathLive()` pour `mathlive`, `fillInTheBlank` et `tableauMathlive` |
| `src/lib/interactif/questionMathLive.ts` | Génération HTML : `ajouteChampTexteMathLive()`, `remplisLesBlancs()` |
| `src/lib/interactif/qcm.ts` | `verifQuestionQcm()`, `propositionsQcm()` |
| `src/lib/interactif/DragAndDrop.ts` | Classe de glisser-déposer et vérification |
| `src/lib/interactif/MultiMathfield/MultiMathfield.ts` | Web Component `multiMathfield` |
| `src/lib/interactif/questionListeDeroulante.ts` | Création et vérification des listes déroulantes |
| `src/lib/interactif/questionSvgSelection/questionSvgSelection.ts` | Création et vérification des sélections SVG |
| `src/lib/interactif/cliqueFigure.js` | Implémentation historique du clic sur figure |
| `src/lib/interactif/gestionCan.ts` | Mode CAN chronométré |
| `src/lib/interactif/afficheScore.ts` | Utilitaire d'affichage du score |
| `src/lib/types.ts` | Toutes les définitions de types |
| `src/exercices/Exercice.ts` | Classe de base des exercices |
| `tests/e2e/helpers/filter.ts` | Découverte des exercices |
| `tests/e2e/helpers/run.ts` | Découpage des tests et gestion de page Playwright |
| `tests/e2e/helpers/testAllViews.ts` | Test des combinaisons de paramètres |
| `tests/e2e/helpers/issue.ts` | Création de tickets GitLab |
