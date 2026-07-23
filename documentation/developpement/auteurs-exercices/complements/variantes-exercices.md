# Variantes d'exercices

Cette page complète le parcours essentiel quand la structure classique ne
suffit pas.

## `ExerciceSimple`

`ExerciceSimple` convient à une question unique dont les propriétés principales
sont `question`, `correction` et `reponse`. Avant de choisir cette classe,
cherchez un exercice récent et comparable : certaines fonctionnalités supposent
encore les listes d'un exercice classique.

## Plusieurs types de questions

Pour répartir plusieurs types, construisez un plan de tirage avant la boucle ou
utilisez les helpers déjà présents dans un exercice voisin. Le plan doit :

- contenir exactement `nbQuestions` choix ;
- rester stable pendant une génération ;
- éviter qu'un nouveau tirage à chaque tentative déséquilibre la répartition.

Passez toutes les données significatives à `questionJamaisPosee()`.

## Branches de rendu

Utilisez les informations de `context` seulement lorsqu'un rendu nécessite une
alternative réelle :

- `context.isHtml` pour distinguer HTML et LaTeX ;
- `context.isAmc` pour une structure AMC spécifique ;
- `context.isTypst` lorsqu'un composant HTML ne peut pas être converti.

La branche par défaut doit conserver un énoncé et une correction lisibles.

## Aller plus loin

- [Architecture des exercices](../../maintenance-moteur/architecture/exercices.md)
- [Export AMC](export-amc.md)
- [Vue Typst](../../maintenance-moteur/exports/typst.md)
