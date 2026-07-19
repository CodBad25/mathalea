# Refactoring de ScratchEditor

## Contexte

MathALÉA possède aujourd'hui deux éditeurs de programmes Scratch :

- `BlocklyEditor`, basé sur Blockly, fonctionnel.
- `ScratchEditor`, basé sur `scratch-gui`, qui ne fonctionne pas de manière satisfaisante dans le contexte de MathALÉA.

L'objectif est de supprimer la dépendance à `scratch-gui` au profit d'une implémentation légère et pérenne.

---

# Pourquoi abandonner scratch-gui ?

L'intégration de `scratch-gui` pose plusieurs problèmes.

## Dépendances très lourdes

L'éditeur officiel repose notamment sur :

- React
- Redux
- scratch-vm
- scratch-render
- scratch-storage
- scratch-audio
- webpack
- une arborescence importante de composants React

Cette architecture est adaptée à l'éditeur officiel Scratch mais beaucoup trop lourde pour un custom element MathALÉA.

---

## Intégration difficile

MathALÉA repose sur des `MathaleaCustomElement`.

L'intégration d'une application React complète à l'intérieur d'un custom element provoque de nombreuses difficultés :

- cycle de vie
- démontage
- CSS
- gestion des assets
- compatibilité Vite
- maintenance

---

## Objectifs pédagogiques

Les besoins de MathALÉA sont beaucoup plus modestes.

Dans un exercice, on souhaite simplement :

- proposer une toolbox limitée ;
- proposer éventuellement un programme initial ;
- récupérer le programme construit par l'élève ;
- éventuellement exécuter le programme ;
- éventuellement faire du pas à pas.

L'ensemble des fonctionnalités de scratch-gui est inutile.

---

# Architecture cible

Le nouvel éditeur sera composé de plusieurs couches indépendantes.

```
ScratchEditor
│
├── MathaleaCustomElement
│
├── ScratchWorkspaceAdapter
│
├── ScratchVmAdapter (optionnel)
│
└── ToolboxBuilder
```

Le custom element ne doit pas connaître les détails de scratch-blocks.

Toute interaction avec scratch-blocks passe par `ScratchWorkspaceAdapter`.

---

# ScratchEditor

Responsabilités :

- création du composant
- gestion de l'interactivité
- getter/setter `value`
- restauration
- sérialisation
- boutons de l'interface

Le composant doit respecter les conventions de `MathaleaCustomElement`.

---

# ScratchWorkspaceAdapter

Responsabilités :

- création du workspace scratch-blocks
- import
- export
- toolbox
- écoute des événements
- mode lecture seule

Cette classe encapsule complètement l'API de scratch-blocks.

Aucun autre code du projet ne devra utiliser directement scratch-blocks.

---

# ScratchVmAdapter

Responsabilités :

- créer la VM
- connecter le workspace
- exécution
- arrêt
- import/export du projet

Cette couche est optionnelle.

Le fonctionnement de ScratchEditor ne doit pas dépendre de la VM.

---

# ToolboxBuilder

La toolbox ne doit jamais être construite directement sous forme XML dans les exercices.

Les exercices fourniront une structure déclarative.

Exemple :

```ts
{
  categories: [
    {
      id: 'motion',
      blocks: ['motion_movesteps', 'motion_turnright'],
    },
  ]
}
```

Le ToolboxBuilder produira ensuite le format attendu par scratch-blocks.

---

# Réutilisation du code existant

MathALÉA possède déjà plusieurs briques importantes.

## scratchblock()

Produit le rendu HTML des programmes Scratch.

À conserver.

---

## scratchSimulator

Permet l'exécution pas à pas.

À conserver.

À terme il pourra probablement être alimenté directement par le même modèle intermédiaire que ScratchEditor.

---

## BlocklyEditor

Servira de modèle pour :

- le custom element
- la sérialisation
- le stockage de la réponse
- l'intégration avec les exercices

---

# Modèle intermédiaire

Objectif important :

Ne pas multiplier les conversions.

Aujourd'hui on risque rapidement de faire :

LaTeX

↓

XML Blockly

↓

JSON Scratch

↓

VM

↓

LaTeX

Ce n'est pas souhaitable.

L'objectif est d'introduire un modèle intermédiaire propre à MathALÉA.

```
          ScratchProgram
          /      |      \
         /       |       \
    LaTeX   ScratchBlocks  VM
         \       |       /
          scratchSimulator
```

Toutes les conversions devront passer par ce modèle.

---

# Valeur du composant

Le getter `value` devra permettre une restauration fidèle.

On envisage une structure de ce type :

```ts
{
    version: 1,
    workspaceXml: "...",
    projectJson: "...",
    latex: "..."
}
```

À discuter.

---

# Étapes du refactoring

## Étape 1

Analyser l'existant.

Étudier :

- ScratchEditor
- BlocklyEditor
- scratchblock()
- scratchSimulator
- 5I1C.ts

Aucune modification.

---

## Étape 2

Écrire le diagnostic.

Identifier :

- les dépendances inutiles ;
- les parties réutilisables ;
- les conversions déjà existantes.

Diagnostic initial :

- `scratch-gui` apporte une application React/Redux complète et n'est pas
  adapté au besoin d'un custom element MathALÉA léger.
- `scratch-vm` n'est pas nécessaire pour éditer ou corriger les programmes de
  `5I1C`; il doit rester une option future pour l'exécution.
- `BlocklyEditor` reste le bon modèle pour le contrat avec les exercices :
  création HTML, stockage dans `answers`, vérification par `verifQuestion`.
- `5I1C` possède déjà la bascule de rendu via `this.sup5`; l'exercice ne doit
  pas porter deux logiques de correction différentes.
- La correction peut rester commune en convertissant le programme Scratch vers
  le même AST arithmétique que le programme Blockly.

Décision de première implémentation :

- `ScratchEditor` utilise `scratch-blocks` pour le rendu.
- Les solutions produites pour `BlocklyEditor` sont converties vers un XML
  Scratch quand `ScratchEditor` doit importer un programme.
- La réponse élève Scratch est exportée en XML puis convertie en AST pour être
  comparée à la solution existante de `5I1C`.
- La connexion au simulateur et à une VM est différée.

---

## Étape 3

Créer ScratchWorkspaceAdapter.

Premier objectif :

afficher un workspace vide.

---

## Étape 4

Créer une toolbox déclarative.

---

## Étape 5

Importer un programme initial.

---

## Étape 6

Exporter le programme.

---

## Étape 7

Intégrer le nouvel éditeur dans 5I1C.

---

## Étape 8

Ajouter scratch-vm en option.

---

## Étape 9

Connecter scratchSimulator.

---

# Contraintes

Le nouvel éditeur doit :

- respecter MathaleaCustomElement ;
- être compatible Vite ;
- ne dépendre ni de React ni de Redux ;
- fonctionner sans scratch-vm ;
- permettre une toolbox personnalisée ;
- permettre un programme initial ;
- rester facilement maintenable.

---

# Consignes pour l'agent

Avant toute modification :

1. Lire ce document.
2. Étudier l'existant.
3. Produire un diagnostic.
4. Attendre la validation avant toute modification importante.

Le but n'est pas de réécrire ScratchEditor à partir de zéro mais de réutiliser autant que possible les briques déjà présentes dans MathALÉA.

Les décisions d'architecture prises pendant le développement devront être consignées dans ce document.
