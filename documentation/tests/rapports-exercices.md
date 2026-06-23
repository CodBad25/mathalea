# Tests de rapport d'exercices

Ce guide explique comment lancer les deux tests de rapport en local : **report-interactif** et **report-amcnum**.

Index parent : [documentation/tests/README.md](README.md). Rapports générés : [reports/README.md](../../reports/README.md).

## 📋 Aperçu

| Test                        | Rôle                                                                                                       | Sortie                                |
| --------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `report-interactif.test.ts` | Vérifie que les exercices interactifs (`interactifReady=true`) disposent d'une `autoCorrection`            | `reports/interactif-report.md`        |
| `report-amcnum.test.ts`     | Vérifie que les exercices AMCNum (`amcReady=true`, `amcType=AMCNum`) disposent d'une correction AMC valide | `reports/amcnum-report.md`           |

## 🎯 Lancement local

### 1. Mode analyse complète (tous les exercices)

**Interactif :**

```bash
INTERACTIF_REPORT=1 pnpm --pm-on-fail=ignore vitest src/lib/amc/report-interactif.test.ts --run
```

**AMCNum :**

```bash
AMCNUM_REPORT=1 pnpm --pm-on-fail=ignore vitest src/lib/amc/report-amcnum.test.ts --run
```

✅ Scanne **tous les fichiers** du répertoire `src/exercices/`
⏱️ Peut prendre plusieurs minutes (3000+ fichiers)
📊 Génère un rapport Markdown complet avec tous les problèmes détectés

---

### 2. Mode ciblé (fichiers spécifiques)

**Interactif :**

```bash
INTERACTIF_REPORT=1 CHANGED_FILES='src/exercices/2e/2G34-3.ts' pnpm --pm-on-fail=ignore vitest src/lib/amc/report-interactif.test.ts --run
```

**AMCNum :**

```bash
AMCNUM_REPORT=1 CHANGED_FILES='src/exercices/2e/2G34-3.ts' pnpm --pm-on-fail=ignore vitest src/lib/amc/report-amcnum.test.ts --run
```

✅ Scanne **uniquement les fichiers listés** dans `CHANGED_FILES`
⚡ Très rapide (quelques secondes)
📋 Utile pour tester des modifications récentes

---

### 3. Plusieurs fichiers

```bash
INTERACTIF_REPORT=1 CHANGED_FILES='src/exercices/2e/2G34-3.ts
src/exercices/2e/2G34-4.ts
src/exercices/2e/2G34-5.ts' pnpm --pm-on-fail=ignore vitest src/lib/amc/report-interactif.test.ts --run
```

✅ Utilisez `\n` (nouvelle ligne) pour séparer les fichiers
✅ Chaque fichier est analysé indépendamment

---

## 🔍 Résultats

### Quand des problèmes sont détectés

Un fichier Markdown est généré dans `reports/` :

- [interactif-report.md](../../reports/interactif-report.md) : Liste des exercices interactifs sans `autoCorrection`
- [amcnum-report.md](../../reports/amcnum-report.md) : Liste des exercices AMCNum sans correction valide

Exemple de rapport :

```markdown
| Numéro | Fichier                    | Tags                                       |
| ------ | -------------------------- | ------------------------------------------ |
| 1      | src/exercices/1e/1N31-1.ts | [autoCorrection-interactive-absente]       |
| 2      | src/exercices/2e/2N33-2.ts | [erreur-runtime] (Cannot read property...) |
```

### Quand aucun problème n'est trouvé

```
✅ Found 0 exercises with issues
```

Aucun rapport n'est généré.

---

## 🏗️ Tags de diagnostic

### report-interactif.test.ts

- `autoCorrection-interactive-absente` : L'exercice déclare `interactifReady=true` mais `autoCorrection` reste vide
- `erreur-runtime` : Erreur lors de l'instanciation ou génération
- `class-export-manquante` : Pas d'export default

### report-amcnum.test.ts

- `autoCorrectionAMC-manquante-ou-incomplete` : Structure AMC invalide ou manquante
- `autoCorrection-html-absente` : Pas de `autoCorrection` pour le mode HTML
- `autoCorrection-html-absente(interactif true)` : Pas de `autoCorrection` en mode interactif
- `erreur-runtime` : Erreur lors de l'instanciation ou génération
- `class-export-manquante` : Pas d'export default

---

## 🚀 Dans la CI

Les tests s'exécutent automatiquement sur demande de fusion et sur `main` via GitLab CI :

- **Job `testExosModifiedInteractif`** : Analyse les fichiers modifiés d'une MR
- **Job `testExosModifiedAmcnum`** : Analyse les fichiers modifiés d'une MR

La variable `CHANGED_FILES` est calculée automatiquement à partir du `git diff`.

---

## ⚙️ Astuces

### Exécuter et afficher les 50 premières lignes

```bash
INTERACTIF_REPORT=1 pnpm --pm-on-fail=ignore vitest src/lib/amc/report-interactif.test.ts --run 2>&1 | head -n 50
```

### Vérifier un exercice sans lancer le test complet

```bash
# Éditer la ligne du matcher dans le fichier test (vide par défaut)
# Exemple : const matcher = '2e/2G' // scannera seulement src/exercices/2e/2G*

# Puis :
INTERACTIF_REPORT=1 pnpm --pm-on-fail=ignore vitest src/lib/amc/report-interactif.test.ts --run
```

### Afficher le rapport généré

```bash
cat reports/interactif-report.md
cat reports/amcnum-report.md
```

---

## 📝 Notes

- Les deux tests ne s'exécutent **que** si leur variable d'environnement (`INTERACTIF_REPORT` ou `AMCNUM_REPORT`) est explicitement définie à `'1'`
- En l'absence de `CHANGED_FILES`, les tests scannent **tous les exercices**
- Les rapports sont **écrasés** à chaque lancement (ils ne s'ajoutent pas)
- Les fichiers dans `ressources/` et `apps/` sont toujours ignorés
