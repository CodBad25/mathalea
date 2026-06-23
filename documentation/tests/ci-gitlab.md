# Rapport d'analyse de la CI GitLab

Ce document résume ce que teste la CI définie dans [.gitlab-ci.yml](../../.gitlab-ci.yml), à quel moment les tâches se lancent, et comment reproduire localement les vérifications principales.

## Vue d'ensemble

La CI actuelle couvre principalement :

- installation et cache `pnpm`
- tests Vitest unitaires (`tests/unit`)
- tests Vitest dans `src`
- typecheck Svelte/TypeScript avec `pnpm --pm-on-fail=ignore check`
- tests des exercices modifiés, regroupés dans un job consolidé
- tests e2e Playwright/Vitest sur les vues, la cohérence et l'interactivité
- tests e2e Playwright/Vitest de détection d'erreurs console par niveaux
- tests d'exports PDF, DNB, BAC et E3C
- construction de l'image CI PDF via Kaniko

Le SAST GitLab est inclus mais les jobs `semgrep-sast` et `sast` sont désactivés par les règles actuelles.

## Stages

Les stages déclarés sont :

1. `setup`
2. `planified`
3. `test`
4. `playwright-test`
5. `build-projet`
6. `compile-pdf`
7. `playwright`
8. `playwright-pdfDNB`
9. `playwright-pdfBAC`
10. `build_ci_pdf`

## Préparation commune

La plupart des jobs Node utilisent `.pnpm_setup` :

```bash
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm --pm-on-fail=ignore config set store-dir .pnpm-store
```

Les jobs Playwright démarrent ensuite l'application avec `pnpm --pm-on-fail=ignore start` et attendent `http://localhost:80/alea/`.

Pour reproduire localement un test e2e sans lier le port 80, lancer le serveur sur 5173 puis forcer le port côté tests :

```bash
pnpm --pm-on-fail=ignore install
pnpm --pm-on-fail=ignore start
CI=1 PLAYWRIGHT_SERVER_PORT=5173 pnpm --pm-on-fail=ignore test:e2e:views
```

Ordre de priorité du port dans les helpers Playwright :

1. `PLAYWRIGHT_SERVER_PORT` si définie
2. `80` si `CI` est définie
3. `5173` sinon

## Setup

### `setup`

Installe les dépendances avec le lockfile et alimente le cache pnpm :

```bash
pnpm --pm-on-fail=ignore install --frozen-lockfile --prefer-offline --silent
```

Déclenchement :

- demandes de fusion
- `main`
- `guironne-jobs`
- pipelines planifiés
- branche `pipeline`

## Tests unitaires et source

### `tests-unitaires`

Exécute :

```bash
pnpm --pm-on-fail=ignore run makeJson
NODE_OPTIONS=--max-old-space-size=4096 pnpm --pm-on-fail=ignore test:unit
```

Déclenchement :

- `main`
- `guironne-jobs`
- pipelines planifiés
- branche `pipeline` en manuel

### `tests-src`

Exécute :

```bash
pnpm --pm-on-fail=ignore run makeJson
NODE_OPTIONS=--max-old-space-size=4096 pnpm --pm-on-fail=ignore test:src
```

Déclenchement identique à `tests-unitaires`.

Reproduction locale condensée :

```bash
pnpm --pm-on-fail=ignore run makeJson
pnpm --pm-on-fail=ignore run prebuild-unit-tests
```

## Typecheck

### `testTypescriptOk`

Exécute :

```bash
pnpm --pm-on-fail=ignore run makeJson
pnpm --pm-on-fail=ignore check
```

Déclenchement :

- demandes de fusion
- `main`
- désactivé sur `guironne-jobs`

Le job est actuellement `allow_failure: true`.

## Exercices modifiés

### `testExosModifiedConsolidated`

Ce job remplace les anciens jobs séparés `testExosModifiedWithoutPlayWright`, `testExosModified`, `testExosModifiedInteractif` et `testExosModifiedAmcnum`.

Il récupère les fichiers modifiés sur une fenêtre allant jusqu'à 5 commits, les place dans `CHANGED_FILES`, puis lance quatre sous-tests :

```bash
CHANGED_FILES="$CHANGED_FILES" pnpm --pm-on-fail=ignore test:e2e:console_errors
CHANGED_FILES="$CHANGED_FILES" pnpm --pm-on-fail=ignore vitest --config tests/e2e/vitest.config.all_exercises.js --run
INTERACTIF_REPORT=1 CHANGED_FILES="$CHANGED_FILES" pnpm --pm-on-fail=ignore vitest tests/integration/interactivity_all.test.ts --run
AMCNUM_REPORT=1 CHANGED_FILES="$CHANGED_FILES" pnpm --pm-on-fail=ignore vitest src/lib/amc/report-amcnum.test.ts --run
```

Le job échoue si au moins un sous-test échoue.

Déclenchement :

- demandes de fusion
- `main`
- `guironne-jobs` en manuel

### `testExosModifiedLatex`

Job séparé car il utilise l'image CI avec LaTeX. Il récupère les fichiers modifiés sur la même fenêtre de 5 commits puis lance :

```bash
CHANGED_FILES="$CHANGED_FILES" pnpm --pm-on-fail=ignore test:e2e:pdfexports
```

Déclenchement :

- demandes de fusion
- `main`
- `guironne-jobs` en manuel

## Console Playwright

### `playwright-console-consolidated`

Lance `pnpm --pm-on-fail=ignore test:e2e:console_errors` pour les filtres suivants :

- `6e/6`
- `5e/5`
- `4e/4`
- `3e/3`
- `2e/2`
- `1e/1`
- `TEx^TSpe^techno`
- `QCM`
- `can/6e^can/5e`
- `can/4e^can/3e`
- `can/2e^can/1e`
- `can/Ex^can/TSpe`

Déclenchement via le template `.testCI` :

- condition historique restrictive `CI_COMMIT_BRANCH == "main" && CI_PIPELINE_SOURCE == "merge_request_event"`
- `guironne-jobs`
- pipelines planifiés
- branche `pipeline` en manuel

Le template `.testCI` est `allow_failure: true`.

Reproduction locale :

```bash
pnpm --pm-on-fail=ignore start
NIV=6e/6 pnpm --pm-on-fail=ignore test:e2e:console_errors
```

## Playwright globaux planifiés

Ces jobs s'exécutent en pipeline planifié ou sur la branche `pipeline` en manuel.

| Job | Commande | `allow_failure` |
| --- | --- | --- |
| `playwright-caneleve` | `pnpm --pm-on-fail=ignore test:e2e:views` | `true` |
| `playwright-consistency` | `pnpm --pm-on-fail=ignore test:e2e:consistency` | `true` |
| `playwright-interactivity` | `pnpm --pm-on-fail=ignore test:e2e:interactivity` | `false` |

Reproduction locale :

```bash
pnpm --pm-on-fail=ignore start
pnpm --pm-on-fail=ignore test:e2e:views
pnpm --pm-on-fail=ignore test:e2e:consistency
pnpm --pm-on-fail=ignore test:e2e:interactivity
```

## All exercises JSDOM

### `jsdom-all-exercises`

Job planifié qui lance `pnpm --pm-on-fail=ignore test:e2e:all_exercises` avec `NB_EXOS_PAR_LOT=1000` sur les filtres CAN et collège :

- `can/2e^can/1e`
- `can/6e^can/5e`
- `can/4e^can/3e`
- `6e/6`
- `5e/5`
- `4e/4`
- `3e/3`

Déclenchement :

- pipelines planifiés
- branche `pipeline` en manuel

## Exports PDF

Les jobs PDF utilisent l'image `$DOCKER_IMAGE` (`ci/tex-node:node22-texlive-2026-06`) et le template `.testCIPDF`.

### `playwright-pdf-consolidated`

Lance `pnpm --pm-on-fail=ignore test:e2e:pdfexports` sur :

- `can/2e^can/1e`
- `can/6e^can/5e`
- `can/4e^can/3e`
- `6e/6`
- `5e/5`
- `4e/4`
- `3e/3`

### `playwright-pdf-dnb-consolidated`

Clone le dépôt DNB dans `public/static/dnb`, déplace `sujets_decoupes`, puis teste :

- `dnb_2013^dnb_2014^dnb_2015`
- `dnb_2016^dnb_2017^dnb_2018^dnb_2019`
- `dnb_2020^dnb_2021^dnb_2022^dnb_2023^dnb_2024`

### `playwright-pdf-bac-consolidated`

Clone le dépôt BAC dans `public/static/bac`, puis teste :

- `e3c_2024^e3c_2023^e3c_2022^e3c_2021`
- `bac_2024^bac_2023^bac_2022^bac_2021`

Déclenchement PDF via `.testCIPDF` :

- `guironne-jobs`
- `mathalea-jobs`
- pipelines planifiés, notamment `CI_TEST_MA == "PDF"`
- branche `pipeline` en manuel

Reproduction locale ciblée :

```bash
pnpm --pm-on-fail=ignore start
CI=1 NIV=6e/6 pnpm --pm-on-fail=ignore test:e2e:pdfexports
```

## Image CI PDF

### `build_ci_pdf`

Construit l'image Docker PDF avec Kaniko depuis `docker/ci-pdf/Dockerfile` et pousse :

```text
$CI_REGISTRY_IMAGE/ci/tex-node:node22-texlive-2026-06
```

Déclenchement :

- branche `pipeline` en manuel
- `guironne-jobs` en manuel

## Commandes utiles de synthèse

### Pré-commit recommandé localement

```bash
pnpm --pm-on-fail=ignore run makeJson
pnpm --pm-on-fail=ignore run prebuild-unit-tests
pnpm --pm-on-fail=ignore check
```

### E2E globaux

```bash
pnpm --pm-on-fail=ignore start
pnpm --pm-on-fail=ignore test:e2e:views
pnpm --pm-on-fail=ignore test:e2e:consistency
pnpm --pm-on-fail=ignore test:e2e:interactivity
```

### Exercice modifié

```bash
pnpm --pm-on-fail=ignore start
CHANGED_FILES="$(git diff --name-only HEAD~5..HEAD)" pnpm --pm-on-fail=ignore test:e2e:console_errors
CHANGED_FILES="$(git diff --name-only HEAD~5..HEAD)" pnpm --pm-on-fail=ignore vitest --config tests/e2e/vitest.config.all_exercises.js --run
INTERACTIF_REPORT=1 CHANGED_FILES="$(git diff --name-only HEAD~5..HEAD)" pnpm --pm-on-fail=ignore vitest tests/integration/interactivity_all.test.ts --run
AMCNUM_REPORT=1 CHANGED_FILES="$(git diff --name-only HEAD~5..HEAD)" pnpm --pm-on-fail=ignore vitest src/lib/amc/report-amcnum.test.ts --run
```

## Points d'attention

- `pnpm --pm-on-fail=ignore check` est bien lancé en CI via `testTypescriptOk`, mais ce job est `allow_failure: true`.
- `tests-unitaires` et `tests-src` sont séparés et aussi `allow_failure: true`.
- Les checks d'exercices modifiés sont consolidés et bloquants via `testExosModifiedConsolidated`.
- Les e2e par niveaux restent `allow_failure: true` via `.testCI`.
- Les PDF consolidés collège/CAN sont bloquants, tandis que les jobs DNB/BAC sont `allow_failure: true`.
- La fenêtre de comparaison des exercices modifiés va jusqu'à 5 commits.
