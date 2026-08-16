# Réponses d'élève transmises aux LMS

Cette page décrit le format des réponses d'élève échangées avec un LMS (Moodle/SCORM), et les contraintes de taille qui le dictent.

Moodle a deux points d'entrée, qui partagent le même message `mathalea:score` et le même encodage des réponses, mais pas le même support de stockage : l'activité SCORM (`moodle.scorm.js`) et la question GIFT (`moodle.js`).

## Chaîne de transmission (Moodle/SCORM)

1. À la vérification, `ExerciceMathaleaVueEleve.svelte` (vue élève) ou `Can.svelte` (vue CAN) poste au parent un message `mathalea:score` contenant `resultsByExercice` (dont `answers`), lorsque `recorder=moodle`. La vue CAN y ajoute `duration`, le temps mis par l'élève en secondes.
2. Le SCO Moodle exécute [`public/assets/externalJs/moodle.scorm.js`](../../../../public/assets/externalJs/moodle.scorm.js), qui écrit dans le suivi SCORM :
   - `cmi.suspend_data` = `graine[;d=durée]|réponses encodées` ;
   - `cmi.interactions_0.student_response` = URL de la copie élève (avec `&done=1&answers=…[&duration=…]`).
3. À la réouverture, le script relit `cmi.suspend_data` et recharge l'iframe avec `&done=1&answers=…[&duration=…]` ; MathALÉA décode alors le paramètre et rejoue la copie.

En vue CAN, `resultsByExercice` contient une entrée par question : `moodle.scorm.js` fusionne les `answers` de toutes les entrées (les clés `ExiQj` sont uniques) pour que la copie enregistrée soit complète.

La durée est placée avant le premier `|` de `cmi.suspend_data` car les réponses, lorsque le repli JSON brut est utilisé, peuvent elles-mêmes contenir ce caractère (`\left|`). Les copies enregistrées sans durée (`graine|réponses`) restent lisibles.

SCORM 1.2 plafonne `cmi.suspend_data` à 4 096 caractères et `student_response` à 255. Deux mesures maintiennent les réponses sous ces ordres de grandeur.

## Chaîne de transmission (Moodle/GIFT)

Une question GIFT exportée par `Moodle.svelte` est une question à réponse courte dont le texte contient un élément `<mathalea-moodle>`, défini par [`public/assets/externalJs/moodle.js`](../../../../public/assets/externalJs/moodle.js). Cet élément crée l'iframe MathALÉA, et c'est le champ de réponse de la question qui tient lieu de stockage :

1. À la réception de `mathalea:score`, `moodle.js` écrit dans le champ `[name$="_answer"]` la valeur `score[|métadonnées]|réponses encodées`, puis déclenche la validation de la question.
2. Au réaffichage de la question, l'élément relit cette valeur et recharge l'iframe avec `&done=1&answers=…[&duration=…]`.

Le **score doit rester seul devant le premier `|`** : c'est lui qui est comparé aux réponses `=%x%score|*` de la question GIFT, donc à la note. Moodle n'accepte qu'un jeu figé de fractions (1/1, 9/10, 5/6, 4/5…), aussi le score est-il arrondi à la valeur la plus proche de cette liste — la note d'une course de 7 questions est donc approchée.

Le segment de métadonnées, `graine[;d=durée]`, n'est présent que si l'exercice tire sa graine au sort (`graine="-1"`) ou s'il s'agit d'une Course aux nombres, qui doit mémoriser la durée. Sa présence se déduit ainsi des attributs de l'élément, jamais du contenu de la valeur enregistrée — les réponses peuvent contenir des `|` lorsque le repli JSON brut est utilisé.

### Course aux nombres

L'attribut `can` de `<mathalea-moodle>` réunit toute la course dans une **seule** question Moodle : l'URL de l'élément porte les paramètres de tous les exercices, suivis de ceux de la vue (`canD`, `canTi`, `canT`, `canSA`, `canSM`, `canI`), et `moodle.js` y ajoute `&v=can` au lieu de `&i=1&v=eleve&es=…`.

- La note est le total des points de toutes les entrées de `resultsByExercice` rapporté au total des questions, et les `answers` de ces entrées sont fusionnées (les clés `ExiQj` sont uniques).
- Chaque exercice reçoit la graine de la question suffixée de son rang (`graine-0`, `graine-1`…), sans quoi deux exercices identiques poseraient la même question. Si l'URL porte déjà des `alea` (export « pas d'aléatoire »), aucune graine n'est injectée.
- L'iframe est créée avec une hauteur de 600 px, la course occupant toute la hauteur de la fenêtre ; le bouton plein écran reste disponible.

## Relecture de la copie

En vue élève, `ExerciceMathaleaVueEleve.svelte` réinjecte les réponses dans les champs puis clique sur le bouton de vérification.

En vue CAN, `Can.svelte` fait de même : quand `done=1` et que `answers` est présent (et que le recorder n'est pas Capytale, qui transmet la copie par postMessage), les questions sont montées hors de l'écran le temps d'y écrire les réponses avec `mathaleaWriteStudentPreviousAnswers()`, puis `checkAnswers({ record: false })` les corrige et la vue bascule sur les corrections. `record: false` évite de comptabiliser la relecture dans les statistiques et de renvoyer au LMS un score assorti d'une durée erronée.

Les résultats ne sont donc pas transmis par l'URL : ils sont recalculés, ce que la graine (`alea`) rend déterministe. Seul le temps mis ne peut pas l'être, d'où le paramètre `duration` (en secondes) affiché par la vue des corrections.

Le test e2e correspondant est `tests/e2e/tests/view/view.moodle.review.can.test.ts` (`pnpm vitest --config tests/e2e/vitest.config.view.moodle.review.js --run`).

## Encodage des réponses : `z:<base64url>`

Les réponses sont compressées en gzip puis encodées en base64url, avec le préfixe `z:` (`src/lib/lms/answersCodec.ts`). Le base64url passe tel quel dans une URL, ce qui évite l'échappement `%xx` qui gonflait le JSON d'un facteur ~1,9.

Le préfixe permet de distinguer ce format du JSON brut : `decodeAnswers()` accepte les deux, de sorte que les copies enregistrées dans les LMS avant la compression restent lisibles.

L'encodage est dupliqué à l'identique dans `moodle.scorm.js` et `moodle.js`, scripts autonomes servis à Moodle qui ne peuvent pas importer de module : toute évolution du format doit être répercutée dans les trois fichiers.

## Réponses ApiGeom

Un exercice ApiGeom enregistre la figure de l'élève comme réponse. Il faut utiliser `figureAnswerJson(figure)` (`src/lib/apigeom/figureAnswer.ts`) et **non** `figure.json` :

```ts
this.answers[this.figuresApiGeom[i].id] = figureAnswerJson(
  this.figuresApiGeom[i],
)
```

`figureAnswerJson()` retire l'indentation et le bloc `options`, qui pèse à lui seul plus de la moitié de la figure. Les options (dont la barre d'outils) sont imposées par l'exercice à la génération, jamais modifiées par l'élève, et `loadJson()` les laisse inchangées si elles sont absentes.

L'historique (pile d'undo) n'est pas concerné : il n'est présent que dans `figure.getJsonWithHistory()`, qui n'est pas utilisé pour les réponses.

Les snapshots ApiGeom des tests e2e (`tests/e2e/tests/view/view.capytale.save*.test.ts`) contiennent ce JSON : ils sont à régénérer après toute évolution du format ou mise à jour du paquet apigeom.
