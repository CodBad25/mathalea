# Moteur d'export AMC

Cette page décrit le pipeline partagé d'Auto Multiple Choice. Pour déclarer AMC
dans un exercice, consultez le
[guide auteur](../../auteurs-exercices/complements/export-amc.md).

## Entrées

Le moteur traite principalement :

- les métadonnées `amcReady` et `amcType` ;
- `autoCorrectionAMC`, structure canonique des nouveaux développements ;
- `autoCorrection`, réutilisée par certains QCM et chemins d'inférence ;
- `questionsAMC`, structure historique encore présente dans des exercices.

Les types sont définis dans `src/lib/amc/amcTypes.ts`.

## Pipeline

1. `amcInference.ts` déduit une structure AMC lorsque le format interactif
   fournit assez d'informations.
2. `amcNormalize.ts` transforme les variantes acceptées en une représentation
   cohérente.
3. `amcRender.ts` produit le contenu consommé par l'export LaTeX AMC.
4. Les anciens exercices peuvent encore utiliser `amcConvert()` pour alimenter
   `questionsAMC`.

L'inférence est une aide, pas un remplacement pour une déclaration explicite
quand la question contient plusieurs sous-réponses ou un format ambigu.

## Invariants

- une entrée `AMCNum` décrit une réponse numérique unique ;
- `AMCHybride` contient plusieurs blocs indépendants ;
- un QCM conserve le même statut des propositions en HTML et en AMC ;
- un format dynamique doit fournir une alternative imprimable ;
- la correction AMC ne doit pas dépendre du DOM ou d'un état JavaScript.

Toute évolution des structures doit préserver les exercices historiques ou
prévoir une migration ciblée.

## Validation

Les rapports `AMCNum` et les tests d'exercices sont décrits dans
[Rapports d'exercices](../../../tests/rapports-exercices.md). Vérifiez également
les sorties LaTeX pour chaque type AMC modifié.
