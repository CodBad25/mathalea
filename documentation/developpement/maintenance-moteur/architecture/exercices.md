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

L'interactivité moderne passe par `handleAnswers()` dans
`src/lib/interactif/gestionInteractif.ts`. Les formats et le pipeline sont
décrits dans [système d'interactivité](../interactivite/systeme-interactivite.md).

## Synchronisation de l'URL

Les composants qui modifient le store `exercicesParams` doivent appeler `exercicesParams.update()`, sans réécrire eux-mêmes l'URL. `App.svelte` centralise cette synchronisation via son abonnement au store. Les appels explicites à `mathaleaUpdateUrlFromExercicesParams()` restent réservés aux tableaux de paramètres qui ne sont pas le store global.

### Le paramètre `es` (réglages de la vue élève)

Le store `globalOptions` (`src/lib/stores/globalOptions.ts`) contient les réglages de la vue élève classique (présentation, interactivité, corrections). Plutôt qu'un paramètre d'URL par réglage, ces booléens/énumérations sont compressés dans une seule chaîne `es` : un caractère par réglage, dans un ordre fixe.

- Construction : `buildEsParams()` dans `src/lib/components/urls.ts`. Chaque réglage est ajouté à la chaîne dans l'ordre `presMode|setInteractive|isSolutionAccessible|isInteractiveFree|oneShot|twoColumns|isTitleDisplayed|isReferenceDisplayed|isCorrectionOnlyOnError`.
- Décodage : la fonction `mathaleaUpdateExercicesParamsFromUrl()` dans `src/lib/mathalea.ts` lit `es` et affecte chaque caractère (`es.charAt(i)`) au réglage correspondant.
- Rétrocompatibilité : le décodage teste `es.length` (6, 7, 8, 9 caractères actuellement) et choisit la branche qui correspond, pour que les anciennes URLs partagées (avec moins de réglages) restent valides. Chaque nouvelle branche reprend le décodage complet des caractères précédents avant d'ajouter le nouveau.

Pour ajouter un nouveau réglage `es` :

1. Ajouter le champ à `InterfaceGlobalOptions` dans `src/lib/types.ts` et sa valeur par défaut dans `src/lib/stores/globalOptions.ts`.
2. Ajouter un caractère à la fin de la chaîne dans `buildEsParams()`.
3. Ajouter une nouvelle branche `es.length === N` (N = longueur actuelle + 1) dans `mathaleaUpdateExercicesParamsFromUrl()`, sans modifier les branches existantes, et inclure le nouveau champ dans l'objet retourné par la fonction.
4. Ajouter le toggle correspondant dans `ConfigEleve.svelte` (`src/components/setup/configEleve/ConfigEleve.svelte`), en suivant le pattern `ButtonToggleAlt` existant dans la section concernée.

## Tests

Les tests et rapports sont décrits dans
[tests et CI](../../../tests/README.md). Avant commit, la commande de référence
pour les tests unitaires est :

```sh
pnpm prebuild-unit-tests
```

Pour les changements TypeScript ou Svelte, lancer aussi :

```sh
pnpm check
```
