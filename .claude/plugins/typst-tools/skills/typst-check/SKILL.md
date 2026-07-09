---
name: typst-check
description: Valider et corriger le rendu Typst d'un exercice MathALÉA. Utiliser quand l'utilisateur demande de "vérifier typst", "checker typst", "corriger typst", cite un identifiant d'exercice suivi de "typst" (ex: "6N2C-1 typst"), veut "lancer typst:check", ou demande de réparer une erreur de compilation Typst. Aussi utile pour analyser reports/typst-status.json et proposer des correctifs dans src/components/setup/typst/latexToTypst.ts.
version: 1.0.0
---

# Skill : typst-check

Ce skill valide le rendu Typst d'un ou plusieurs exercices MathALÉA en utilisant le même compilateur WASM qu'en production.

## Prérequis

Le serveur de développement doit être lancé : `pnpm dev` (http://localhost:5173).

## Commandes disponibles

```sh
# Tester un exercice par référence ou UUID
uuid=6N2C-1 pnpm --pm-on-fail=ignore typst:check

# Tester par UUID numérique
uuid=10148 pnpm --pm-on-fail=ignore typst:check

# Tester tous les exercices (avec limite)
ALL=1 LIMIT=50 pnpm --pm-on-fail=ignore typst:check

# Retester seulement les exercices en échec
FAILING=1 pnpm --pm-on-fail=ignore typst:check

# Retester seulement les exercices non testés
UNTESTED=1 LIMIT=100 pnpm --pm-on-fail=ignore typst:check
```

## Résultats

Les résultats sont sauvegardés dans `reports/typst-status.json`.
Les captures d'écran sont dans `screenshots/typst-check/<uuid>/`.

## Workflow quand invoqué par Claude

1. **Lancer le test** sur l'exercice demandé
2. **Lire** `reports/typst-status.json` pour obtenir le statut et les diagnostics
3. **Analyser** les captures d'écran (typst.png vs html.png) visuellement
4. **Selon le failureMode :**

### compile_error
- Lire les `diagnostics` dans typst-status.json
- Identifier la ligne problématique dans le `.typ` généré (accessible via le CodeMirror de la vue Typst)
- Remonter à la cause dans `src/components/setup/typst/latexToTypst.ts`
- Proposer un fix ciblé (ex: nouveau cas dans `latexMathToTypst`, nouveau pattern dans `htmlToTypst`)

### unprocessed_math
- Le pattern `{...}` visible dans le SVG signifie que `tex2typst` n'a pas converti la macro LaTeX
- Identifier la macro concernée en cherchant dans le code source de l'exercice
- Ajouter un pré-traitement dans `latexMathToTypst()` (lignes ~600-700 de `latexToTypst.ts`)

### missing_figure
- Une figure SVG n'a pas été correctement embarquée
- Vérifier `svgToTypstImage()` et la collection de figures dans `htmlToTypst()`
- Souvent lié à un élément `.mathalea2d` non détecté par le sélecteur

### missing_package
- Un paquet Typst (`@preview/...`) n'est pas disponible
- Vérifier la connexion réseau pour le téléchargement du paquet

### interactive_only
- L'exercice n'a pas de rendu statique (figureApigeom sans fallback)
- Marquer comme `skip` dans le statut et passer à la suite

5. **Appliquer le correctif** dans `latexToTypst.ts`
6. **Relancer le test** pour vérifier
7. **Logger le fix** dans `reports/typst-fixes-log.md` (créer si absent)

## Fichiers clés

- `src/components/setup/typst/latexToTypst.ts` — Convertisseur HTML→Typst (1300+ lignes)
- `src/components/setup/typst/buildTypstDocument.ts` — Générateur de document
- `src/components/setup/typst/typstCompiler.ts` — Wrapper WASM
- `reports/typst-status.json` — Base de données de suivi
- `reports/typst-svg-inventory.json` — Inventaire des figures SVG

## Format de typst-status.json

```json
{
  "exercises": {
    "6N2C-1": {
      "uuid": "10148",
      "status": "failing",
      "failureMode": "compile_error",
      "diagnostics": ["main.typ:42:1: error: undefined variable: fig-1"],
      "notes": "...",
      "typstScreenshot": "screenshots/typst-check/10148/typst.png",
      "htmlScreenshot": "screenshots/typst-check/10148/html.png"
    }
  }
}
```
