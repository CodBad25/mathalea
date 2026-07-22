# Guides développeur

Cette section regroupe les procédures concrètes pour contribuer au code de MathALÉA. Elle complète la [référence développeur](../reference/README.md) : la référence explique les systèmes durables, tandis que les guides indiquent dans quel ordre agir pour installer, coder, rendre interactif, exporter et vérifier.

Si vous débutez sur le dépôt, commencez par [Installation et workflows](installation-et-workflows.md). Revenez ensuite à cette page pour choisir le guide qui correspond à votre tâche.

## Parcours recommandés

### Découvrir le projet et faire une première modification

1. Lire [Installation et workflows](installation-et-workflows.md) pour installer les dépendances, lancer le site localement et connaître les commandes de base.
2. Lire [Coder un exercice classique](coder-un-exercice-classique.md) pour comprendre la structure minimale d'un exercice génératif.
3. Vérifier la modification avec les commandes adaptées :

```bash
pnpm prebuild-unit-tests
pnpm check
```

### Créer un exercice complet

1. Partir de [Coder un exercice classique](coder-un-exercice-classique.md) pour créer le fichier, générer les questions et prévoir les rendus HTML et LaTeX.
2. Ajouter les besoins mathématiques avec [Guides mathématiques](mathematiques/README.md) : décimaux, nombres, grandeurs, géométrie 2D, fonctions ou tableaux.
3. Si l'exercice demande une saisie élève, suivre [Rendre un exercice interactif](rendre-un-exercice-interactif.md).
4. Si l'exercice doit être compatible Auto Multiple Choice, compléter avec [Export AMC](export-amc.md).
5. Lancer au minimum les tests unitaires avant commit, puis le typecheck si des fichiers TypeScript ou Svelte ont été modifiés.

### Ajouter un QCM

1. Lire [Coder un QCM](coder-un-qcm.md) pour définir les propositions, les bonnes réponses, la correction et le rendu non interactif.
2. Lire la section QCM de [Rendre un exercice interactif](rendre-un-exercice-interactif.md) si le QCM doit être utilisable en mode interactif.
3. Vérifier les rendus non interactif et LaTeX, car un QCM ne doit pas dépendre uniquement de l'interface HTML.

### Ajouter ou corriger l'interactivité

1. Lire [Utiliser les custom elements dans un exercice](utiliser-les-custom-elements.md) pour copier une recette adaptée au composant interactif voulu.
2. Lire [Rendre un exercice interactif](rendre-un-exercice-interactif.md) pour choisir le bon format : champ MathLive, texte à trous, tableau, QCM, liste déroulante, glisser-déposer ou sélection SVG.
3. Lire [BlocklyEditor](blockly-editor.md) ou [ScratchEditor](scratch-editor.md) si l'exercice utilise un éditeur de programmation visuelle.
4. Lire [Créer un custom element (convention MathALÉA)](creer-un-custom-element.md) si vous créez ou refactorez un composant interactif maison.
5. Consulter [Système d'interactivité](../reference/systeme-interactivite.md) si vous devez comprendre les structures `handleAnswers`, les comparateurs ou les formats de réponses.
6. Vérifier que l'exercice reste lisible en HTML non interactif et en LaTeX.
7. Pour les exercices interactifs déclarés prêts, utiliser les rapports décrits dans [Rapports d'exercices](../../tests/rapports-exercices.md) si la modification touche `autoCorrection`, AMC ou les formats de réponse.

### Travailler sur un export imprimable ou AMC

1. Lire [Coder un exercice classique](coder-un-exercice-classique.md) pour vérifier que l'exercice a une alternative imprimable.
2. Lire [Export AMC](export-amc.md) pour identifier ce qui peut être inféré depuis l'interactivité et ce qui doit être déclaré explicitement.
3. Utiliser les rapports d'exercices quand l'exercice est concerné par `interactifReady`, `amcReady` ou `AMCNum`.

### Créer un exercice avec rendu 3D

1. Lire [Faire un exercice 3D](faire-un-exercice-3d.md) pour les points d'attention propres au rendu.
2. Ajouter l'interactivité uniquement avec les formats standards quand ils décrivent correctement la réponse.
3. Vérifier qu'une version imprimable ou LaTeX reste exploitable.

## Choisir le bon guide

| Objectif                                                | Commencer par                                                                    | Compléter avec                                                                                                                                                                                                   |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installer le projet, lancer le site, préparer un commit | [Installation et workflows](installation-et-workflows.md)                        | [Tests et CI](../../tests/README.md)                                                                                                                                                                             |
| Créer un exercice génératif simple                      | [Coder un exercice classique](coder-un-exercice-classique.md)                    | [Guides mathématiques](mathematiques/README.md)                                                                                                                                                                  |
| Créer un QCM                                            | [Coder un QCM](coder-un-qcm.md)                                                  | [Rendre un exercice interactif](rendre-un-exercice-interactif.md)                                                                                                                                                |
| Ajouter une saisie ou une correction interactive        | [Utiliser les custom elements dans un exercice](utiliser-les-custom-elements.md) | [Rendre un exercice interactif](rendre-un-exercice-interactif.md), [Créer un custom element (convention MathALÉA)](creer-un-custom-element.md), [Système d'interactivité](../reference/systeme-interactivite.md) |
| Ajouter un éditeur Blockly ou Scratch                   | [BlocklyEditor](blockly-editor.md) ou [ScratchEditor](scratch-editor.md)         | [Utiliser les custom elements dans un exercice](utiliser-les-custom-elements.md), exercices `5I1C.ts` et `5I1D.ts`                                                                                               |
| Préparer un export AMC                                  | [Export AMC](export-amc.md)                                                      | [Rapports d'exercices](../../tests/rapports-exercices.md)                                                                                                                                                        |
| Utiliser les helpers mathématiques                      | [Guides mathématiques](mathematiques/README.md)                                  | [Référence mathématique](../reference/mathematiques/README.md)                                                                                                                                                   |
| Ajouter une figure 3D                                   | [Faire un exercice 3D](faire-un-exercice-3d.md)                                  | [Rendre un exercice interactif](rendre-un-exercice-interactif.md)                                                                                                                                                |

## Vérifications courantes

Les commandes doivent être lancées avec `--pm-on-fail=ignore`.

```bash
pnpm prebuild-unit-tests
pnpm check
```

Pour une modification limitée à quelques exercices, consultez aussi [Rapports d'exercices](../../tests/rapports-exercices.md) et [Tests et CI](../../tests/README.md) afin de choisir le test ciblé pertinent plutôt que de lancer toute la suite e2e.

## Tous les guides

| Guide                                                                            | À utiliser quand...                                                                                    |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Installation et workflows](installation-et-workflows.md)                        | Vous préparez l'environnement local, lancez le site ou cherchez les commandes quotidiennes.            |
| [Coder un exercice classique](coder-un-exercice-classique.md)                    | Vous créez ou reprenez la structure d'un exercice génératif.                                           |
| [Coder un QCM](coder-un-qcm.md)                                                  | Vous ajoutez des propositions, une correction de QCM ou un rendu non interactif de QCM.                |
| [Utiliser les custom elements dans un exercice](utiliser-les-custom-elements.md) | Vous voulez copier une recette simple pour injecter un composant interactif et déclarer sa réponse.    |
| [Rendre un exercice interactif](rendre-un-exercice-interactif.md)                | Vous ajoutez une saisie élève, choisissez un comparateur ou adaptez `autoCorrection`.                  |
| [BlocklyEditor](blockly-editor.md)                                               | Vous ajoutez ou adaptez un exercice avec un éditeur Blockly.                                           |
| [ScratchEditor](scratch-editor.md)                                               | Vous ajoutez ou adaptez un exercice avec un éditeur Scratch.                                           |
| [Créer un custom element (convention MathALÉA)](creer-un-custom-element.md)      | Vous créez, refactorez ou standardisez un custom element du projet.                                    |
| [Export AMC](export-amc.md)                                                      | Vous rendez un exercice compatible avec Auto Multiple Choice.                                          |
| [Faire un exercice 3D](faire-un-exercice-3d.md)                                  | Vous travaillez sur un exercice avec rendu 3D.                                                         |
| [Guides mathématiques](mathematiques/README.md)                                  | Vous avez besoin d'un helper pour les nombres, décimaux, grandeurs, fonctions, tableaux ou figures 2D. |
