# Architecture des exercices

MathALÉA génère des exercices capables de produire plusieurs sorties : HTML interactif ou non interactif, LaTeX, exports et rapports de test.

## Emplacement

Les exercices non statiques sont principalement dans `src/exercices/`. Les helpers transverses sont dans :

- `src/lib/` pour les fonctions et composants utilitaires ;
- `src/modules/` pour des classes et modules partagés ;
- `src/components/` pour l'interface Svelte ;
- `src/lib/interactif/` pour les formats interactifs.

## Cycle de génération

Un exercice construit une version dans `nouvelleVersion()`. Cette méthode prépare généralement :

- les données aléatoires ;
- `listeQuestions` et `listeCorrections` ;
- les informations d'interactivité dans `autoCorrection` via `handleAnswers()` ou via les helpers QCM ;
- les métadonnées de l'exercice : titre, nombre de questions, paramètres, références.

La génération doit rester déterministe pour une graine donnée et éviter les doublons avec les mécanismes existants comme `questionJamaisPosee()`.

## Sorties HTML et LaTeX

Les exercices doivent tenir compte du contexte de rendu. Le HTML peut accepter des composants interactifs ou des éléments de formulaire ; le LaTeX doit rester imprimable et lisible.

Quand une question possède un rendu interactif, prévoir une alternative non interactive : texte, QCM équivalent, correction détaillée ou figure statique.

## Classes d'exercices

Les exercices classiques héritent de la classe commune `Exercice` définie dans `src/exercices/Exercice.ts`. Des helpers spécialisés existent pour des besoins récurrents, par exemple les QCM dans `src/lib/interactif/qcm.ts` et `src/lib/interactif/qcmBuilder.ts`. Avant de créer une nouvelle classe, vérifier les modèles et usages existants dans `src/exercices/` et `src/lib/`.

## Interactivité et correction

L'interactivité moderne passe par `handleAnswers()` dans `src/lib/interactif/gestionInteractif.ts`. Les formats et le pipeline sont décrits dans [système d'interactivité](systeme-interactivite.md).

## Synchronisation de l'URL

Les composants qui modifient le store `exercicesParams` doivent appeler `exercicesParams.update()`, sans réécrire eux-mêmes l'URL. `App.svelte` centralise cette synchronisation via son abonnement au store. Les appels explicites à `mathaleaUpdateUrlFromExercicesParams()` restent réservés aux tableaux de paramètres qui ne sont pas le store global.

## Tests

Les tests et rapports sont décrits dans [tests et CI](../../tests/README.md). Avant commit, la commande de référence pour les tests unitaires est :

```sh
pnpm prebuild-unit-tests
```

Pour les changements TypeScript ou Svelte, lancer aussi :

```sh
pnpm check
```
