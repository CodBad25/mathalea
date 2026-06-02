# Rapport d'analyse de la CI GitLab

Ce document résume ce que teste la CI définie dans [.gitlab-ci.yml](../.gitlab-ci.yml), à quel moment chaque job se lance, et comment reproduire localement chaque vérification.

## Vue d'ensemble

La CI couvre principalement cinq familles de vérifications :

- analyse de sécurité SAST avec Semgrep
- tests unitaires Vitest
- tests e2e Playwright/Vitest sur les vues, la cohérence et l'interactivité
- tests e2e Playwright/Vitest de détection d'erreurs console par niveaux
- tests e2e d'exports PDF

Elle contient aussi des jobs de build et de déploiement. Le build n'est pas un test à proprement parler, mais il valide que la génération des JSON et la compilation Vite passent correctement.

Point important : `pnpm check` n'est pas exécuté dans cette CI.

## Stages

Les stages déclarés sont les suivants :

1. `test`
2. `build-projet`
3. `playwright-testCanEleve`
4. `deploy-server`
5. `playwright-test`
6. `playwright-testLycee`
7. `playwright-pdf`
8. `playwright-pdfDNB`
9. `playwright-pdfBAC`

## Préparation commune des jobs e2e

Les jobs e2e non PDF héritent de la préparation définie dans `.install_dependencies` :

- installation et activation de `pnpm`
- installation des dépendances du projet
- ajout de `playwright` et `@playwright/test`
- démarrage de l'application avec `pnpm start`
- attente de disponibilité de `http://localhost:80/alea/`

Pour reproduire localement les tests concernés :

```bash
pnpm install
pnpm start
```

Puis, dans un autre terminal, lancer la commande du job voulu.

Les jobs PDF utilisent une préparation spécifique :

- vérification de `lualatex`
- installation des dépendances système nécessaires à Chromium
- installation du navigateur Chromium via Playwright
- démarrage de l'application

Les variantes DNB et BAC ajoutent en plus un clonage de dépôts annexes dans `public/static/`.

## Analyse de sécurité

### `semgrep-sast`

Ce job provient du template GitLab SAST et n'est activé que sur la branche `main`.

Déclenchement :

- automatique sur `main`

Reproduction locale :

- il n'existe pas de script `package.json` dédié dans le dépôt
- la reproduction exacte dépend de l'outillage GitLab SAST utilisé par le runner

## Tests unitaires

### `tests-unitaires`

Ce job exécute :

- `pnpm run makeJson`
- `NODE_OPTIONS=--max-old-space-size=4096 pnpm test:unit`
- `NODE_OPTIONS=--max-old-space-size=4096 pnpm test:src`

Cela correspond à :

- tests Vitest dans `tests/unit`
- tests Vitest directement dans `src`

Déclenchement :

- automatique sur toute Merge Request
- automatique sur `main`
- manuel sur `guironne-jobs`

Reproduction locale :

```bash
pnpm install
pnpm makeJson
NODE_OPTIONS=--max-old-space-size=4096 pnpm test:unit
NODE_OPTIONS=--max-old-space-size=4096 pnpm test:src
```

Commande condensée équivalente :

```bash
pnpm install
pnpm makeJson
NODE_OPTIONS=--max-old-space-size=4096 pnpm run prebuild-unit-tests
```

## Tests e2e globaux

### Port du serveur en local (mode CI)

Les tests e2e utilisent maintenant la variable `PLAYWRIGHT_SERVER_PORT` pour construire les URLs locales.

Ordre de priorité du port :

1. `PLAYWRIGHT_SERVER_PORT` si définie
2. `80` si `CI=1`
3. `5173` sinon

Cela permet de reproduire le comportement CI en local sans devoir binder le port 80.

Exemple pratique (local, mode CI, serveur sur 5173) :

```bash
pnpm install
pnpm start
CI=1 PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:views
CI=1 PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:consistency
CI=1 PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:interactivity
```

### `playwright-testCanEleve`

Ce job teste les vues via :

```bash
pnpm test:e2e:views
```

Déclenchement :

- automatique sur toute Merge Request
- automatique sur `main`
- manuel sur `guironne-jobs`

Reproduction locale :

```bash
pnpm install
pnpm start
pnpm test:e2e:views
```

### `playwright-testConsistency`

Ce job teste la cohérence fonctionnelle via :

```bash
pnpm test:e2e:consistency
```

Déclenchement :

- automatique sur toute Merge Request
- automatique sur `main`
- manuel sur `guironne-jobs`

Reproduction locale :

```bash
pnpm install
pnpm start
pnpm test:e2e:consistency
```

### `playwright-testInteractivity`

Ce job teste l'interactivité via :

```bash
pnpm test:e2e:interactivity
```

Déclenchement :

- automatique sur toute Merge Request
- automatique sur `main`
- la règle `guironne-jobs` semble incomplète dans le YAML, donc pas de `when: manual` explicite

Reproduction locale :

```bash
pnpm install
pnpm start
pnpm test:e2e:interactivity
```

## Tests e2e ciblés sur les exercices modifiés

### `testExosModifiedWithoutPlayWright`

Ce job récupère les fichiers modifiés sur une fenêtre allant jusqu'à 5 commits, les place dans `CHANGED_FILES`, active le mode CI, puis exécute :

```bash
CI=1 CHANGED_FILES="$CHANGED_FILES" pnpm vitest --config tests/e2e/vitest.config.all_exercises.js --run
```

Note : sans `CI=1`, la branche conditionnelle qui filtre sur les fichiers modifiés n'est pas activée dans `all_exercises.test.ts`.

Déclenchement :

- automatique sur toute Merge Request
- automatique sur `main`
- manuel sur `guironne-jobs`

Reproduction locale :

```bash
pnpm install
pnpm start
CI=1 CHANGED_FILES="$(git diff --name-only HEAD~5..HEAD)" pnpm vitest --config tests/e2e/vitest.config.all_exercises.js --run
```

### `testExosModified`

Ce job récupère lui aussi les fichiers modifiés, puis exécute les tests console ciblés :

```bash
CHANGED_FILES="$CHANGED_FILES" pnpm test:e2e:console_errors
```

Déclenchement :

- automatique sur toute Merge Request
- automatique sur `main`
- manuel sur `guironne-jobs`

Reproduction locale :

```bash
pnpm install
pnpm start
CHANGED_FILES="$(git diff --name-only HEAD~5..HEAD)" pnpm test:e2e:console_errors
```

## Tests e2e d'erreurs console par niveaux

Ces jobs héritent de `.testCI`.

Déclenchement commun :

- automatique si `CI_COMMIT_BRANCH == "main"` et `CI_PIPELINE_SOURCE == "merge_request_event"`
- automatique en pipeline planifié si `CI_TEST_MA == "CONSOLE"`
- manuel sur `guironne-jobs`

Remarque : cette règle est plus restrictive qu'un simple "toute Merge Request", car elle dépend explicitement de `CI_COMMIT_BRANCH == "main"` dans `.testCI`.

### Collège

#### `test6e`

```bash
NIV=6e/6 pnpm test:e2e:console_errors
```

#### `test5e`

```bash
NIV=5e/5 pnpm test:e2e:console_errors
```

#### `test4e`

```bash
NIV=4e/4 pnpm test:e2e:console_errors
```

#### `test3e`

```bash
NIV=3e/3 pnpm test:e2e:console_errors
```

### Lycée

#### `test2e`

```bash
NIV=2e/2 pnpm test:e2e:console_errors
```

#### `test1e`

```bash
NIV=1e/1 pnpm test:e2e:console_errors
```

#### `testTExOuTSpeOutechno`

```bash
NIV=TEx^TSpe^techno pnpm test:e2e:console_errors
```

### Autres ensembles

#### `testQCM`

```bash
NIV=QCM pnpm test:e2e:console_errors
```

#### `testCan6e5e`

```bash
NIV=can/6e^can/5e pnpm test:e2e:console_errors
```

#### `testCan4e3e`

```bash
NIV=can/4e^can/3e pnpm test:e2e:console_errors
```

#### `testCan2e1e`

```bash
NIV=can/2e^can/1e pnpm test:e2e:console_errors
```

#### `testCanExTSpe`

```bash
NIV=can/Ex^can/TSpe pnpm test:e2e:console_errors
```

## Tests e2e d'exports PDF

Ces jobs héritent de `.testCIPDF`.

Note : dans `pdfexports.test.ts`, les modes ciblés par `NIV` et `CHANGED_FILES` ne sont activés que si `CI` est défini. En local, il faut donc préfixer les commandes ciblées par `CI=1`.

Déclenchement commun :

- manuel sur `guironne-jobs`
- manuel sur `mathalea-jobs`
- automatique en pipeline planifié si `CI_TEST_MA == "PDF"`

### Export PDF par niveaux

#### `test6ePDF`

```bash
CI=1 NIV=6e/6 pnpm test:e2e:pdfexports
```

#### `test5ePDF`

```bash
CI=1 NIV=5e/5 pnpm test:e2e:pdfexports
```

#### `test4ePDF`

```bash
CI=1 NIV=4e/4 pnpm test:e2e:pdfexports
```

#### `test3ePDF`

```bash
CI=1 NIV=3e/3 pnpm test:e2e:pdfexports
```

### Export PDF CAN

#### `testCan6e5ePDF`

```bash
CI=1 NIV=can/6e^can/5e pnpm test:e2e:pdfexports
```

#### `testCan4e3ePDF`

```bash
CI=1 NIV=can/4e^can/3e pnpm test:e2e:pdfexports
```

#### `testCan2e1ePDF`

```bash
CI=1 NIV=can/2e^can/1e pnpm test:e2e:pdfexports
```

### Export PDF DNB

Ces jobs nécessitent en plus :

```bash
git clone https://forge.apps.education.fr/coopmaths/dnb.git ./public/static/dnb
mv ./public/static/dnb/sujets_decoupes/* ./public/static/dnb/
```

#### `testDNB20132015PDF`

```bash
CI=1 NIV=dnb_2013^dnb_2014^dnb_2015 pnpm test:e2e:pdfexports
```

#### `testDNB20162019PDF`

```bash
CI=1 NIV=dnb_2016^dnb_2017^dnb_2018^dnb_2019 pnpm test:e2e:pdfexports
```

#### `testDNB20202024PDF`

```bash
CI=1 NIV=dnb_2020^dnb_2021^dnb_2022^dnb_2023^dnb_2024 pnpm test:e2e:pdfexports
```

### Export PDF BAC et E3C

Ces jobs nécessitent en plus :

```bash
git clone https://forge.apps.education.fr/coopmaths/bac.git ./public/static/bac
```

#### `testBAC20202024PDF`

```bash
CI=1 NIV=bac_2024^bac_2023^bac_2022^bac_2021 pnpm test:e2e:pdfexports
```

#### `testE3C20202024PDF`

```bash
CI=1 NIV=e3c_2024^e3c_2023^e3c_2022^e3c_2021 pnpm test:e2e:pdfexports
```

## Build et déploiements

### `build`

Ce job ne lance pas de tests, mais vérifie que les étapes suivantes passent :

```bash
pnpm run makeJson
NODE_OPTIONS="--max-old-space-size=5096 --expose-gc" pnpm vite build
```

Déclenchement :

- automatique sur `main`
- manuel sur `guironne-jobs`

Reproduction locale :

```bash
pnpm install
pnpm run makeJson
NODE_OPTIONS="--max-old-space-size=5096 --expose-gc" pnpm vite build
```

### `deploy` et `deployftp`

Ces jobs sont des déploiements manuels, mais ils relancent implicitement des tests unitaires avant publication :

```bash
NODE_OPTIONS=--max-old-space-size=4096 pnpm run makeJson && pnpm run prebuild-unit-tests && pnpm vite build
```

Déclenchement :

- manuel sur `main`
- manuel sur `guironne-jobs`

## Commandes utiles de synthèse

### Reproduire les tests unitaires attendus avant build

```bash
pnpm install
pnpm makeJson
pnpm run prebuild-unit-tests
```

### Reproduire les e2e globaux les plus visibles

```bash
pnpm install
pnpm start
pnpm test:e2e:views
pnpm test:e2e:consistency
pnpm test:e2e:interactivity
```

### Reproduire un test console ciblé sur un niveau

```bash
pnpm install
pnpm start
NIV=6e/6 pnpm test:e2e:console_errors
```

### Reproduire un export PDF ciblé

```bash
pnpm install
pnpm start
CI=1 NIV=6e/6 pnpm test:e2e:pdfexports
```

## Points d'attention

- `pnpm check` n'est pas lancé dans la CI actuelle.
- `playwright-testInteractivity` semble avoir une règle incomplète pour `guironne-jobs`.
- les jobs e2e par niveaux sont marqués `allow_failure: true`
- les jobs PDF sont aussi marqués `allow_failure: true`
- les jobs ciblés sur exercices modifiés s'appuient sur une fenêtre de comparaison d'au plus 5 commits
