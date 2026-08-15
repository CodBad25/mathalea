# Vue Diaporama

La vue Diaporama (`v=diaporama` dans l'URL) projette les questions une par une, avec un décompte par diapositive. Tout est sous `src/components/setup/diaporama/`.

## Composants

- `Diaporama.svelte` — orchestrateur : charge les exercices, construit les diapositives, maintient l'URL ;
- `slideshowSettings/` — écran de réglages (durées, nombres de questions, transitions, ordre, sélection) ;
- `slideshowPlay/` — lecture du diaporama (décompte, corrections, zoom, raccourcis clavier) ;
- `slideshowOverview/` — aperçu imprimable de la série et tableau des réponses (`answersTable.ts`).

## Construction des diapositives

`setSlidesContent()` appelle `reroll()` sur chaque exercice puis découpe `listeQuestions` en diapositives, une par question et par vue (`nbVues`, jusqu'à 4 vues obtenues en dérivant la graine).

Deux invariants à respecter dans cette fonction :

- **elle peut être rejouée pendant la lecture.** `Diaporama.svelte` écoute l'événement `updateAsyncEx` : un exercice qui charge ses modules en tâche de fond (voir plus bas) le déclenche quand son contenu réel remplace les `« chargement... »`. La question courante (`slideshow.currentQuestion`) doit donc être conservée, sinon le diaporama revient aux réglages en pleine séance ;
- **le nombre de questions vient de l'exercice**, pas des réglages : `nbQuestions` est relu après chaque génération.

## Exercices dont le nombre de questions n'est connu qu'après génération

Les exercices « Sélection d'automatismes » (`1A`, `3A`, construits par [`_automatismesCan.ts`](../../../../src/exercices/_automatismesCan.ts)) tirent leurs questions par catégorie : leur `nbQuestions` vaut 0 tant que `nouvelleVersion()` n'a pas été appelée. `Diaporama.svelte` génère donc une première fois, au montage, les exercices dont `nbQuestions` est nul, faute de quoi l'écran de réglages annonce 0 question.

Ces exercices posent aussi `nbQuestionsModifiable = false` : le champ « Nombres de questions » des réglages est désactivé quand cette propriété vaut `false`, puisque la valeur saisie serait écrasée à la génération suivante. Le nombre de questions se règle par le formulaire de catégories de l'exercice, dont les maximums sont bornés par le nombre d'exercices réellement disponibles dans chaque catégorie.

## Enchaînement des diapositives

`$globalOptions.flow` décrit l'alternance :

| Valeur | Enchaînement |
| --- | --- |
| `0` | `Q->Q` — questions seules |
| `1` | `Q->R->Q` — la correction remplace la question |
| `2` | `Q->(Q+R)->Q` — la correction s'ajoute sous la question |

Dans les modes `1` et `2`, la correction est une diapositive à part entière : elle a son propre décompte, de même durée que la question, et l'enchaînement se poursuit tout seul. Seuls le défilement manuel (`manualMode`) et l'option « Avec une pause après chaque question » (`pauseAfterEachQuestion`) mettent le diaporama en pause.

Le décompte est porté par `ratioTime` (0 à 100) et `startTimer()` dans `SlideshowPlay.svelte` ; `nextQuestion()` est la seule porte de sortie d'une diapositive, qu'elle soit déclenchée par le décompte, par la flèche droite ou par le bouton suivant.

## Passerelles vers les exports PDF

L'écran de réglages propose deux sorties PDF, à côté du bouton « Play » :

- `goToTypstWithSeries()` ouvre la [vue Typst](typst.md) avec autant de séries
  que de vues du diaporama (sujets + corrigés à imprimer) ;
- l'icône diaporama ouvre la [vue Diaporama PDF](diaporama-pdf.md)
  (`$globalOptions.v = 'slides'`) : une question en grand par page, au format
  d'un écran.

Tests : `tests/unit/automatismesCan.test.ts`, `tests/unit/diaporamaAnswersTable.test.ts`.
