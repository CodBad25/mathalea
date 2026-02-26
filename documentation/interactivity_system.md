# Interactivity System

## Overview

The interactivity system allows exercises to become interactive — students answer questions directly in the browser, and their answers are automatically checked against expected values.

---

## 1. All Interactivity Types

Defined in `src/lib/types.ts`:

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
```

### 1.1 `mathlive` (default)

A MathLive `<math-field>` input for LaTeX mathematical expressions. Most common mode. Student types math, input compared via `fonctionComparaison()`.
**File:** `src/lib/interactif/questionMathLive.ts`

### 1.2 `fillInTheBlank`

A read-only MathLive field with embedded `\placeholder[name]{}` prompts that students fill in. Uses `%{name}` syntax converted to MathLive placeholders. Each blank has its own answer entry (`champ1`, `champ2`, etc.).
**File:** `questionMathLive.ts`, function `remplisLesBlancs()`

### 1.3 `tableauMathlive`

An HTML table with MathLive cells. Each cell keyed by `L{row}C{col}`.
**File:** `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`

### 1.4 `texte`

A plain HTML `<input>` text field (not MathLive). For text-based answers.
**File:** `questionMathLive.ts`, function `ajouteChampTexte()`

### 1.5 `qcm` (Multiple Choice)

Checkbox or radio-button questions. Exercises define `propositions` with `{texte, statut, feedback}`. Supports options: `radio` (single selection), `vertical`, `ordered`, `lastChoice`.
**File:** `src/lib/interactif/qcm.ts`

### 1.6 `listeDeroulante` (Dropdown)

A custom Web Component `<liste-deroulante>`. Choices support labels, LaTeX, images, SVG.
**File:** `src/lib/interactif/questionListeDeroulante.ts`

### 1.7 `dnd` (Drag and Drop)

Exercises define `Etiquette` objects (labels with id and content). Users drag labels into "rectangle" drop zones. Supports mouse + touch, `duplicable` labels, `multi` (multiple labels per zone), `ordered`.
**File:** `src/lib/interactif/DragAndDrop.ts`

### 1.8 `cliqueFigure` (Click on Figure)

SVG figures get click handlers. Clicking toggles `etat`. On verification, each figure's `etat` is compared against `solution`.
**Files:** `src/lib/interactif/cliqueFigure.js` (legacy), `src/lib/interactif/gestionInteractif.ts`

### 1.9 `svgSelection`

A Web Component `<svg-selection>`. SVGs in rows/columns, each with a numeric `value`. Selection encodes the sum of values.
**File:** `src/lib/interactif/questionSvgSelection/questionSvgSelection.ts`

### 1.10 `custom`

The exercise provides its own `correctionInteractive(i)` function returning `'OK'` or `'KO'`.

### 1.11 `tableur`

Spreadsheet-like interaction.
**File:** `src/lib/tableur/outilsTableur.ts`

### 1.12 `MetaInteractif2d`

For 2D geometry with multiple MathLive prompts embedded in geometric constructions.

---

## 2. How `handleAnswers()` Works

**File:** `src/lib/interactif/gestionInteractif.ts`, line 1089

```typescript
export function handleAnswers(
  exercice: IExercice,
  question: number,
  reponses: Valeur,
  params: ReponseParams | undefined = {},
)
```

This is the **preferred modern function** for defining expected answers:

1. Skips if `context.isAmc` is true.
2. Determines `formatInteractif` from params or defaults to `'mathlive'`.
3. Initializes `autoCorrection[question]` if absent.
4. **Normalizes answer values** via `handleDefaultValeur()`:
   - `FractionEtendue` → `.texFraction` LaTeX string
   - `Decimal`, `Grandeur`, `Hms`, `number` → `.toString()`
   - Sets default `compare` to `fonctionComparaison`
   - Auto-detects if answer is a valid number and sets `nombreDecimalSeulement: true`
5. Stores in `exercice.autoCorrection[question].reponse.valeur` and `.param`.

### The `Valeur` interface

```typescript
export interface Valeur {
  bareme?: (listePoints: number[]) => [number, number]
  feedback?: (saisies: Record<string, string>) => string
  reponse?: AnswerType
  champ1?: AnswerType    // fillInTheBlank fields
  champ2?: AnswerType    // ... up to champ6
  rectangle1?: AnswerType // drag-and-drop zones
  // ... up to rectangle6
  callback?: Function     // custom verification
  // L{row}C{col} keys for tableauMathlive
}
```

Each `AnswerType` has:

- `value`: the expected answer (string, string[], or special types before normalization)
- `compare`: comparison function (defaults to `fonctionComparaison`)
- `options`: `OptionsComparaisonType` controlling comparison behavior

---

## 3. How `setReponse()` Works (Legacy)

**File:** `src/lib/interactif/gestionInteractif.ts`, line 508

A **deprecated wrapper** around `handleAnswers()` translating legacy format specifiers:

| Legacy format | What it does |
|---|---|
| `calcul` (default) | Cleans string values, calls `handleAnswers` with `fonctionComparaison` |
| `Num` | Extracts numerator from `FractionEtendue` |
| `Den` | Extracts denominator from `FractionEtendue` |
| `texte` | Text with case sensitivity |
| `ignorerCasse` | Lowercase comparison |
| `fractionEgale` | Passes `FractionEtendue` directly |
| `unites` | Passes `Grandeur` with unit precision |
| `intervalleStrict` | `]a;b[` with interval checking |
| `intervalle` | `[a;b]` with interval checking |
| `puissance` | Power/exponent comparison |

---

## 4. Answer Checking for Each Type

The central dispatch is `exerciceInteractif()` in `gestionInteractif.ts` (line 125). It iterates all questions and routes by `formatInteractif`:

### MathLive / fillInTheBlank / tableauMathlive / texte → `verifQuestionMathLive()`

**File:** `src/lib/interactif/mathLive.ts`

- **Single-field:** reads `champTexteEx{exo}Q{i}.value`, calls `compareFunction(saisie, reponse, options)`, displays emoji feedback.
- **Fill-in-the-blank:** reads each prompt via `mfe.getPromptValue(key)`, compares independently, sets prompt state to `'correct'`/`'incorrect'`, aggregates via `bareme`.
- **Tableau:** reads each `L{row}C{col}` cell, compares independently, shows per-cell feedback.
- **Callback:** if `reponses.callback` exists, calls it directly.

### QCM → `verifQuestionQcm()`

**File:** `src/lib/interactif/qcm.ts`

- Counts expected correct answers from `propositions[k].statut`.
- Checks each checkbox's `checked` state.
- Returns `'OK'` only if all correct checked AND no wrong checked.
- Displays per-item feedback.

### Dropdown → `verifQuestionListeDeroulante()`

Simple exact string match: `value === reponse`.

### SVG Selection → `verifQuestionSvgSelection()`

Compares encoded selection value against expected. Supports array of valid values.

### Drag and Drop → `verifDragAndDrop()`

- Removes all drag/touch listeners.
- For each rectangle: checks which etiquette IDs are inside.
- Supports `ordered` and unordered matching, pipe-separated alternative answers.
- Visual feedback via CSS classes (green/red).

### Click Figure → `verifQuestionCliqueFigure()`

Compares each `eltFigure.etat` against `objetFigure.solution`.

### Custom → `verifExerciceCustom()`

Calls `exercice.correctionInteractive(i)` returning `'OK'` or `'KO'`.

---

## 5. The Main Comparison Function: `fonctionComparaison()`

**File:** `src/lib/interactif/comparisonFunctions.ts`, line 723

Dispatches based on option flags:

| Option | Comparison |
|---|---|
| `HMS` | Hours/minutes/seconds |
| `fonction` | Function evaluation over a domain |
| `intervalle` | Interval notation comparison |
| `estDansIntervalle` | Check if input is within interval |
| `ecritureScientifique` | Scientific notation |
| `unite` | With unit precision tolerance |
| `factorisation` | Factored form via ComputeEngine |
| `puissance` | Power/exponent expressions |
| `texteAvecCasse` | Case-sensitive text |
| `texteSansCasse` | Case-insensitive text |
| `egaliteExpression` | Equation equality |
| `nombreAvecEspace` | Numbers with spaces |
| `expressionNumerique` | Numeric expressions |
| `ensembleDeNombres` / `kUplet` | Sets or tuples |
| `suiteDeNombres` | Ordered sequences |
| `fractionSimplifiee`/`fractionReduite`/`fractionIrreductible`/`fractionDecimale`/`fractionEgale`/`fractionIdentique` | Specialized fraction checks |
| `developpementEgal` | Expanded form equality |
| `calculFormel` | Symbolic comparison |
| **Default** | `expressionDeveloppeeEtReduiteCompare` — uses ComputeEngine for canonical form comparison |

**Input Cleaning:** `generateCleaner()` produces a chain of cleaning functions: `fractions`, `virgules` (commas → dots), `espaces`, `parentheses`, `puissances`, `divisions`, `latex`, `mathrm`, `operatorName`, `imaginaires`, etc.

---

## 6. Answer Value Types

```typescript
export type AnswerValueType =
  | string | string[]
  | number | number[]
  | IFractionEtendue | IFractionEtendue[]
  | Decimal | Decimal[]
  | IGrandeur | IGrandeur[]
  | Hms | Hms[]
```

`handleDefaultValeur()` normalizes all to strings:

- `FractionEtendue` → `.texFraction` (e.g., `\frac{3}{4}`)
- `Decimal` → `.toString()`
- `Grandeur` → `.toString()` (number + unit)
- `Hms` → `.toString()`
- `number` → `String(value)`

---

## 7. Scoring

### Per-Question

Each verification function returns: `{ isOk, feedback, score: { nbBonnesReponses, nbReponses } }`

### Bareme (Grading Function)

Two built-in baremes:

- **`toutPourUnPoint`** (default): `[min(...points), 1]` — all-or-nothing, 1 point max
- **`toutAUnPoint`**: `[sum(points), points.length]` — 1 point per correct sub-answer

### Exercise-Level

`exerciceInteractif()` accumulates scores across questions and calls `afficheScore()` which displays `nbBonnesReponses / total`.

### CAN Mode

In `gestionCan.ts`, each question has its own verify button. Score accumulates in `context.nbBonnesReponses` / `context.nbMauvaisesReponses`.

---

## 8. Complete Flow: Definition → Display → Checking

**Step 1 — Exercise Definition** (in `nouvelleVersion()`):

```typescript
// Simple:
this.reponse = '42'

// Modern:
handleAnswers(this, i, {
  reponse: { value: '42', compare: fonctionComparaison, options: { nombreDecimalSeulement: true } }
}, { formatInteractif: 'mathlive' })

// Legacy:
setReponse(this, i, 42, { formatInteractif: 'calcul' })
```

Exercise also sets `this.interactifReady = true` and `this.interactifType`.

**Step 2 — HTML Generation** (in question-building code):

```typescript
texte += ajouteChampTexteMathLive(this, i, 'largeur25 inline')
// or: propositionsQcm(this, i), choixDeroulant(), new DragAndDrop().ajouteDragAndDrop(), etc.
```

**Step 3 — Display**: HTML inserted into DOM, `exercicesAffiches` event fires.

**Step 4 — User Interaction**: Student interacts with inputs.

**Step 5 — Validation**: "Vérifier" button clicked → `exerciceInteractif()`:

1. Loops through `autoCorrection` entries
2. Routes to appropriate `verifQuestion*` function by `formatInteractif`
3. Each function reads student input from DOM, compares, displays feedback, returns score
4. `afficheScore()` displays total

**Step 6 — Feedback**:

- Per-field: emoji in `resultatCheckEx{exo}Q{i}` span
- Per-question: text in `feedbackEx{exo}Q{i}` div
- Per-exercise: score display
- Type-specific: prompt states (fillInTheBlank), background colors (QCM, DnD)

---

## Key Files Reference

| File | Purpose |
|---|---|
| `src/lib/interactif/gestionInteractif.ts` | Central orchestrator: `handleAnswers()`, `setReponse()`, `exerciceInteractif()` |
| `src/lib/interactif/comparisonFunctions.ts` | `fonctionComparaison()` and all specialized comparators |
| `src/lib/interactif/mathLive.ts` | `verifQuestionMathLive()` for mathlive/fillInTheBlank/tableau |
| `src/lib/interactif/questionMathLive.ts` | HTML generation: `ajouteChampTexteMathLive()`, `remplisLesBlancs()` |
| `src/lib/interactif/qcm.ts` | `verifQuestionQcm()`, `propositionsQcm()` |
| `src/lib/interactif/DragAndDrop.ts` | Drag-and-drop class and verification |
| `src/lib/interactif/questionListeDeroulante.ts` | Dropdown creation and verification |
| `src/lib/interactif/questionSvgSelection/questionSvgSelection.ts` | SVG selection creation and verification |
| `src/lib/interactif/cliqueFigure.js` | Legacy click-on-figure implementation |
| `src/lib/interactif/gestionCan.ts` | CAN timed test mode |
| `src/lib/interactif/afficheScore.ts` | Score display utility |
| `src/lib/types.ts` | All type definitions |
| `src/exercices/Exercice.ts` | Base exercise class |
| `tests/e2e/helpers/filter.ts` | Exercise discovery |
| `tests/e2e/helpers/run.ts` | Test batching and Playwright page management |
| `tests/e2e/helpers/testAllViews.ts` | Parameter combination testing |
| `tests/e2e/helpers/issue.ts` | GitLab issue creation |
