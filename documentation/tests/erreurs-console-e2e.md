# Système de test E2E des erreurs console

Le test `console_errors` (`tests/e2e/tests/console_errors/console_errors.test.ts`) charge chaque exercice dans un vrai navigateur Chromium via Playwright, interagit avec lui (changement de paramètres, zoom, activation de l'interactivité), puis capture les erreurs console, les plantages de page et les exceptions non interceptées. Quand des erreurs sont trouvées en CI, il peut créer automatiquement des tickets GitLab.

Il existe aussi une variante de débogage (`console_errors.debug.test.ts`) avec prise en charge de `pauseOnError` (pause du navigateur pendant 30 minutes en cas d'erreur) et suivi de `lastAction`.

---

## 1. Découverte des exercices (`findUuid`, `findStatic`)

**Fichier :** `tests/e2e/helpers/filter.ts`

Deux mécanismes de découverte sont utilisés selon la chaîne de filtre.

### `findUuid(filter)` — exercices ordinaires

- Lit `src/json/uuidsToUrlFR.json` depuis le disque (avec cache après la première lecture).
- Ce JSON associe les UUID à des chemins de fichiers comme `"abc123": "6e/6G2A.ts"`.
- Le filtre peut contenir plusieurs sous-filtres séparés par `^`. Chaque sous-filtre est testé avec `uuid[1].startsWith(e)`.
- Retourne des tuples `[uuid, filename]`.

### `findStatic(filter)` — exercices statiques d'examen (DNB, Bac, E3C, CRPE, EVACOM)

- Lit `src/json/referentielStaticFR.json` et `src/json/referentielStaticCH.json`.
- Les fusionne après suppression des entrées de tags et des catégories "par thème" qui créent des doublons.
- Extrait les objets dont la propriété `uuid` correspond au préfixe du filtre.
- Retourne des tuples `[uuid, uuid]`.

### Logique de sélection dans `testRunAllLots`

```typescript
const uuids =
  filter.includes('dnb') || filter.includes('bac') || filter.includes('e3c')
    ? await findStatic(filter)
    : await findUuid(filter)
```

Après la découverte, les exercices dont le nom de fichier contient "test" ou "beta" (sans tenir compte de la casse) sont exclus :

```typescript
const filteredUuids = uuids.filter(([uuid, name]) => {
  const nameLower = name.toLowerCase()
  return !nameLower.includes('test') && !nameLower.includes('beta')
})
```

---

## 2. Découpage et exécution des tests (`runSeveralTests`)

**Fichier :** `tests/e2e/helpers/run.ts`

Les exercices sont traités par lots de **20** :

```typescript
for (let i = 0; i < filteredUuids.length && i < prefs.nbExosParLot; i += 20) {
```

- `prefs.nbExosParLot` limite le nombre total d'exercices testés. Il vaut 75 par défaut pour les modes `NIV` et `CHANGED_FILES`, ou la valeur de `NB_EXOS_PAR_LOT` si elle est définie.
- Chaque fonction de test reçoit comme nom le chemin du fichier d'exercice avec `Object.defineProperty(f, 'name', ...)`.

### Fonctionnement de `runSeveralTests`

- Crée un bloc Vitest `describe` par lot.
- Crée une **seule page Playwright** partagée par tous les tests du lot (`afterAll` ferme la page et le navigateur).
- Au premier test, appelle `getDefaultPage()` pour créer la page, puis configure `createDefaultRoutes()` (interception des requêtes vidéo vers `podeduc.apps.education.fr` pour éviter leur chargement).
- Pour chaque fonction de test, crée un cas Vitest `it()` nommé `"{exerciseName} works with chromium"`.
- Si un test échoue (retourne `false` ou lève une exception), `expect(result).toBe(true)` fait remonter l'échec dans Vitest.

---

## 3. Capture et filtrage des erreurs console

**Fichier :** `console_errors.test.ts`, fonction `getConsoleTest`

Trois écouteurs Playwright sont attachés.

### `page.on('pageerror')` — exceptions JavaScript non interceptées

- Capture l'URL et la pile d'appels.
- **Filtré :** `'Erreur de chargement de Mathgraph'` (exercice 3G22).

### `page.on('crash')` — plantages d'onglet navigateur

### `page.on('console')` — tous les messages console du navigateur

Les messages sont **exclus** s'ils contiennent l'une des chaînes suivantes :

| Chaîne exclue | Raison |
| --- | --- |
| `[vite]` | Messages du serveur de développement Vite |
| `[bugsnag] Loaded!` | Rapporteur d'erreurs Bugsnag |
| `No character metrics for` | Avertissements KaTeX |
| `LaTeX-incompatible input` | Avertissements KaTeX |
| `mtgLoad` / `MG32div0` | MathGraph (3G22) |
| `Figure destroyed successfully` | Nettoyage apigeom |
| `UserFriendlyError: Le chargement de mathgraph` | Erreur MathGraph |
| `Invalid 'X-Frame-Options' header` | Problème d'en-tête HTTP |
| `Blockly.Workspace.getAllVariables was deprecated in v12` | Dépréciation Blockly |
| `A-Frame Version:` / `THREE Version` | Informations des bibliothèques 3D |
| `WARNING: Too many active WebGL contexts` | Avertissement de ressources WebGL |
| `GPU stall due to ReadPixels` | Performance GPU |
| `: le motif contient plus` | Débordement de motif |
| `The column width is less than 0` | Avertissement de mise en page |
| `placeholderMetrics 0.7 0.2` | Métriques MathLive |
| `<HeaderExercice>` | Message de composant Svelte |
| `location().url` contient `mathgraph32` | Tous les messages MathGraph |

Tous les messages non exclus sont ajoutés à un tableau `messages[]` avec un préfixe de type (`'console:'`, `'pageerror:'`, `'crash:'` ou `'exception:'`).

---

## 4. Test des combinaisons de paramètres (`checkEachCombinationOfParams`)

**Fichier :** `tests/e2e/helpers/testAllViews.ts`

Cette fonction découvre tous les éléments de formulaire configurables dans le panneau de paramètres de l'exercice, puis teste les combinaisons de paramètres.

### Découverte des formulaires (`getForms`)

Recherche jusqu'à 5 instances de chaque type de formulaire dans le conteneur `#settings0` :

| Type de formulaire | Sélecteur | Valeurs testées |
| --- | --- | --- |
| `formText` | `#settings-formText{1-5}-0` | Nombres extraits du libellé |
| `check` (cases à cocher) | `#settings-check{1-5}-0` | `[false, true]` |
| `num` (champs numériques) | `#settings-formNum{1-5}-0` (input) | `[min, min+1, max]` |
| `select` (listes déroulantes) | `#settings-formNum{1-5}-0` (select) | Toutes les valeurs d'option |
| Correction détaillée | `#settings-correction-detaillee-0` | `[false, true]` |

### Stratégie de test

- **`simpleTest`** (par défaut pour `console_errors`) : parcourt chaque formulaire indépendamment, en testant ses valeurs pendant que les autres formulaires conservent leur dernière valeur. C'est beaucoup plus rapide et chaque valeur de paramètre est testée au moins une fois, sans croiser toutes les interactions entre paramètres.
- **`fullTest`** (quand `isFullCombinations: true`) : boucle imbriquée sur toutes les combinaisons de 5 formulaires au maximum (produit cartésien). Ce mode est très lent.

---

## 5. Déroulement des interactions avec la page

Pour chaque combinaison de paramètres, le rappel `action` effectue les étapes suivantes :

1. **Clic sur "Nouvel énoncé"** : régénère l'exercice avec une nouvelle graine aléatoire.

2. **Test du zoom** : lit le zoom courant `z` dans l'URL. Si `z < 1.4`, clique sur le zoom avant ; sinon clique sur le zoom arrière. Utilise `waitForExercicesAffiches`, qui :
   - enregistre un écouteur sur l'événement DOM personnalisé `exercicesAffiches` ;
   - clique sur le bouton de zoom ;
   - attend soit l'événement, soit un délai maximal de 5 secondes.

3. **Test de l'interactivité** : si le bouton "Rendre interactif" est visible :
   - clique dessus pour activer le mode interactif ;
   - attend les éléments de question (`li[id^="exercice0Q"]`) ;
   - clique sur le bouton "Vérifier" (`#verif0`) pour valider des réponses vides ;
   - attend la div de résultat (`article + div`) ;
   - clique 3 fois de plus sur "Nouvel énoncé".

### Construction de l'URL

```
http://localhost:{5173|80}/alea/?uuid={uuid}&id={filename_without_extension}&alea=e906e&testCI
```

- Port `PLAYWRIGHT_SERVER_PORT` si défini, sinon 80 en CI et 5173 en local.
- `alea=e906e` est une graine fixe pour la reproductibilité.
- `testCI` est un paramètre d'URL qui indique le mode test.

---

## 6. Création de tickets

**Fichier :** `tests/e2e/helpers/issue.ts`

- **Conditions d'activation :** uniquement en CI quand `CI_TEST_TICKETS === 'CREATE'` (ou en local si la constante `connection` vaut `true`, mais elle est codée à `false`).
- **Limitation :** au maximum 10 tickets par exécution.
- **Déduplication :** interroge l'API GitLab pour chercher un ticket ouvert avec le même titre avant d'en créer un.
- **Format du ticket :** titre `"TI bug: {exercise_id}"`, corps contenant l'URL et les messages d'erreur, labels `testIntegration,console`.
- **API :** forge GitLab `forge.apps.education.fr`, projet 451.

---

## 7. Logique de nouvelle tentative

Chaque exercice est tenté jusqu'à **3 fois** :

- Si une exception survient (par exemple un délai dépassé) et qu'il ne s'agit pas de la dernière tentative, la boucle continue.
- À la dernière tentative : crée un ticket (sauf pour `net::ERR_CONNECTION_REFUSED`) et retourne `'KO'`.
- S'il n'y a pas d'exception mais que `messages.length > 0`, crée un ticket et retourne immédiatement `'KO'` (pas de nouvelle tentative pour les erreurs console sans exception).
- Si tout est propre : retourne `'OK'`.

---

## 8. Modes d'entrée

Le test a trois points d'entrée :

1. **Variable d'environnement `NIV`** : mode manuel ou CI pour un niveau précis. Exemple : `NIV=4e pnpm test:e2e:console_errors`.
2. **Variable d'environnement `CHANGED_FILES`** : mode CI qui teste uniquement les exercices dont les fichiers source ont changé. Filtre les fichiers dans `src/exercices/` (hors `ressources` et `apps`), transforme les chemins, puis lance `testRunAllLots` pour chacun.
3. **Aucune des deux variables** : affiche les consignes d'utilisation et crée un test ignoré.

---

## 9. Configuration Vitest

**Fichier :** `tests/e2e/vitest.config.console_errors.js`

- **`testTimeout` :** 1 000 secondes (16,7 minutes par cas de test).
- **`hookTimeout` :** 120 secondes.
- **`pool` :** `threads` avec `maxWorkers: 1`, `isolate: false`, `disableConsoleIntercept: true` — exécution séquentielle dans un seul thread.
- **`reporters` :** `html`, `junit`, `json`, `default`.
