# Console Errors E2E Test System

The `console_errors` test (`tests/e2e/tests/console_errors/console_errors.test.ts`) is a comprehensive E2E test that loads every exercise in a real Chromium browser via Playwright, interacts with it (changing parameters, zooming, toggling interactivity), and captures any console errors, page crashes, or uncaught exceptions. When errors are found in CI, it can automatically create GitLab issues.

There is also a debug variant (`console_errors.debug.test.ts`) with `pauseOnError` support (pauses the browser for 30 minutes on error) and `lastAction` tracking.

---

## 1. Exercise Discovery (`findUuid`, `findStatic`)

**File:** `tests/e2e/helpers/filter.ts`

Two discovery mechanisms depending on the filter string:

### `findUuid(filter)` — Regular exercises

- Reads `src/json/uuidsToUrlFR.json` from disk (cached after first read).
- This JSON maps UUIDs to file paths like `"abc123": "6e/6G2A.ts"`.
- The filter can contain multiple sub-filters separated by `^` (caret). Each sub-filter is tested with `uuid[1].startsWith(e)`.
- Returns `[uuid, filename]` tuples.

### `findStatic(filter)` — Static exam exercises (DNB, Bac, E3C, CRPE, EVACOM)

- Reads `src/json/referentielStaticFR.json` and `src/json/referentielStaticCH.json`.
- Merges them, removing "by-theme" duplicate entries.
- Extracts objects with a `uuid` property matching the filter prefix.
- Returns `[uuid, uuid]` tuples.

### Selection logic in `testRunAllLots`

```typescript
const uuids =
  filter.includes('dnb') || filter.includes('bac') || filter.includes('e3c')
    ? await findStatic(filter)
    : await findUuid(filter)
```

After discovery, exercises whose filename contains "test" or "beta" (case-insensitive) are excluded:

```typescript
const filteredUuids = uuids.filter(([uuid, name]) => {
  const nameLower = name.toLowerCase()
  return !nameLower.includes('test') && !nameLower.includes('beta')
})
```

---

## 2. Test Batching and Execution (`runSeveralTests`)

**File:** `tests/e2e/helpers/run.ts`

Exercises are processed in batches of **20**:

```typescript
for (let i = 0; i < filteredUuids.length && i < prefs.nbExosParLot; i += 20) {
```

- `prefs.nbExosParLot` (set to 300) caps the total number of exercises tested.
- Each test function is named after the exercise file path using `Object.defineProperty(f, 'name', ...)`.

### `runSeveralTests` mechanics

- Creates a Vitest `describe` block per batch.
- Creates a **single Playwright page** shared across all tests in the batch (`afterAll` closes page and browser).
- On the first test, calls `getDefaultPage()` to create the page, then sets up `createDefaultRoutes()` (intercepts video requests from `podeduc.apps.education.fr` to avoid loading them).
- For each test function, creates a Vitest `it()` test case named `"{exerciseName} works with chromium"`.
- If a test fails (returns `false` or throws), `expect(result).toBe(true)` makes Vitest report the failure.

---

## 3. Console Error Capture and Filtering

**File:** `console_errors.test.ts`, function `getConsoleTest`

Three Playwright event listeners are attached:

### `page.on('pageerror')` — Uncaught JavaScript exceptions

- Captures URL + stack trace.
- **Filtered out:** `'Erreur de chargement de Mathgraph'` (exercise 3G22).

### `page.on('crash')` — Browser tab crashes

### `page.on('console')` — All browser console messages

Messages are **excluded** if they contain any of these strings:

| Excluded string | Reason |
|---|---|
| `[vite]` | Vite dev server messages |
| `[bugsnag] Loaded!` | Bugsnag error reporter |
| `No character metrics for` | KaTeX warnings |
| `LaTeX-incompatible input` | KaTeX warnings |
| `mtgLoad` / `MG32div0` | MathGraph (3G22) |
| `Figure destroyed successfully` | apigeom cleanup |
| `UserFriendlyError: Le chargement de mathgraph` | MathGraph error |
| `Invalid 'X-Frame-Options' header` | HTTP header issue |
| `Blockly.Workspace.getAllVariables was deprecated in v12` | Blockly deprecation |
| `A-Frame Version:` / `THREE Version` | 3D library info |
| `WARNING: Too many active WebGL contexts` | WebGL resource warning |
| `GPU stall due to ReadPixels` | GPU performance |
| `: le motif contient plus` | Pattern overflow |
| `The column width is less than 0` | Layout warning |
| `placeholderMetrics 0.7 0.2` | MathLive metrics |
| `<HeaderExercice>` | Svelte component message |
| `location().url` includes `mathgraph32` | All MathGraph messages |

All non-excluded messages are pushed into a `messages[]` array with a type prefix (`'console:'`, `'error:'`, or `'crach:'`).

---

## 4. Parameter Combination Testing (`checkEachCombinationOfParams`)

**File:** `tests/e2e/helpers/testAllViews.ts`

This function discovers all configurable form elements in the exercise's settings panel and tests parameter combinations.

### Form discovery (`getForms`)

Looks for up to 5 instances of each form type in the `#settings0` container:

| Form type | Selector pattern | Values tested |
|---|---|---|
| `formText` | `#settings-formText{1-5}-0` | Extracted numbers from label |
| `check` (checkboxes) | `#settings-check{1-5}-0` | `[false, true]` |
| `num` (number inputs) | `#settings-formNum{1-5}-0` (input) | `[min, min+1, max]` |
| `select` (dropdowns) | `#settings-formNum{1-5}-0` (select) | All option values |
| Correction detaillee | `#settings-correction-detaillee-0` | `[false, true]` |

### Test strategy

- **`simpleTest`** (default for console_errors): iterates each form independently, cycling through its values while other forms stay at their last-set value. Much faster — tests each parameter value at least once but not cross-parameter interactions.
- **`fullTest`** (when `isFullCombinations: true`): nested loop over all combinations of up to 5 forms (cartesian product). Very slow.

---

## 5. Page Interaction Flow

For each parameter combination, the `action` callback performs:

1. **Click "Nouvel énoncé"** — regenerates the exercise with a new random seed.

2. **Zoom test** — reads current zoom `z` from URL. If `z < 1.4`, clicks zoom-in; otherwise zoom-out. Uses `waitForExercicesAffiches` which:
   - Registers a listener for a custom DOM event `exercicesAffiches`
   - Clicks the zoom button
   - Races between the event and a 5-second timeout

3. **Interactivity test** — if the "Rendre interactif" button is visible:
   - Clicks it to enable interactive mode
   - Waits for question elements (`li[id^="exercice0Q"]`)
   - Clicks the "Vérifier" button (`#verif0`) to validate (empty) answers
   - Waits for the result div (`article + div`)
   - Clicks "Nouvel énoncé" 3 more times

### URL construction

```
http://localhost:{5173|80}/alea/?uuid={uuid}&id={filename_without_extension}&alea=e906e&testCI
```

- Port 80 in CI, 5173 locally
- `alea=e906e` is a fixed seed for reproducibility
- `testCI` is a query flag indicating test mode

---

## 6. Issue Creation

**File:** `tests/e2e/helpers/issue.ts`

- **Gate conditions:** Only in CI when `CI_TEST_TICKETS === 'CREATE'` (or local `connection` constant is `true`, hardcoded to `false`).
- **Rate limiting:** Max 10 issues per run.
- **Deduplication:** Queries GitLab API for existing open issues with same title before creating.
- **Issue format:** Title `"TI bug: {exercise_id}"`, body includes URL and error messages, labels `testIntegration,console`.
- **API:** GitLab forge at `forge.apps.education.fr`, project 451.

---

## 7. Retry Logic

Each exercise is attempted up to **3 times**:

- If an exception occurs (e.g., timeout) and it's not the last attempt, loop continues.
- On last attempt: creates issue (unless `net::ERR_CONNECTION_REFUSED`) and returns `'KO'`.
- If no exception but `messages.length > 0`: creates issue and returns `'KO'` immediately (no retry for console errors without exceptions).
- If clean: returns `'OK'`.

---

## 8. Entry Modes

The test has three entry points:

1. **`NIV` env var** — Manual/CI mode for a specific level. Example: `NIV=4e pnpm test:e2e:console_errors`
2. **`CHANGED_FILES` env var** — CI mode testing only exercises whose source files changed. Filters for files in `src/exercices/` (not resources/apps), transforms paths, runs `testRunAllLots` for each.
3. **Neither set** — Prints usage instructions and creates a skipped test.

---

## 9. Vitest Configuration

**File:** `tests/e2e/vitest.config.console_errors.js`

- **testTimeout:** 1,000 seconds (16.7 minutes per test case)
- **hookTimeout:** 120 seconds
- **pool:** `threads` with `maxWorkers: 1`, `isolate: false` — sequential single-thread execution
- **reporters:** html, junit, json, default

---
