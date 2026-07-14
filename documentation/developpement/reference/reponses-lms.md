# Réponses d'élève transmises aux LMS

Cette page décrit le format des réponses d'élève échangées avec un LMS (Moodle/SCORM), et les contraintes de taille qui le dictent.

## Chaîne de transmission (Moodle/SCORM)

1. À la vérification, `ExerciceMathaleaVueEleve.svelte` poste au parent un message `mathalea:score` contenant `resultsByExercice` (dont `answers`), lorsque `recorder=moodle`.
2. Le SCO Moodle exécute [`public/assets/externalJs/moodle.scorm.js`](../../../public/assets/externalJs/moodle.scorm.js), qui écrit dans le suivi SCORM :
   - `cmi.suspend_data` = `seed|réponses encodées` ;
   - `cmi.interactions_0.student_response` = URL de la copie élève (avec `&done=1&answers=…`).
3. À la réouverture, le script relit `cmi.suspend_data` et recharge l'iframe avec `&done=1&answers=…` ; MathALÉA décode alors le paramètre et rejoue la copie.

SCORM 1.2 plafonne `cmi.suspend_data` à 4 096 caractères et `student_response` à 255. Deux mesures maintiennent les réponses sous ces ordres de grandeur.

## Encodage des réponses : `z:<base64url>`

Les réponses sont compressées en gzip puis encodées en base64url, avec le préfixe `z:` (`src/lib/lms/answersCodec.ts`). Le base64url passe tel quel dans une URL, ce qui évite l'échappement `%xx` qui gonflait le JSON d'un facteur ~1,9.

Le préfixe permet de distinguer ce format du JSON brut : `decodeAnswers()` accepte les deux, de sorte que les copies enregistrées dans les LMS avant la compression restent lisibles.

L'encodage est dupliqué à l'identique dans `moodle.scorm.js`, script autonome servi au SCO Moodle qui ne peut pas importer de module : toute évolution du format doit être répercutée dans les deux fichiers.

## Réponses ApiGeom

Un exercice ApiGeom enregistre la figure de l'élève comme réponse. Il faut utiliser `figureAnswerJson(figure)` (`src/lib/apigeom/figureAnswer.ts`) et **non** `figure.json` :

```ts
this.answers[this.figuresApiGeom[i].id] = figureAnswerJson(this.figuresApiGeom[i])
```

`figureAnswerJson()` retire l'indentation et le bloc `options`, qui pèse à lui seul plus de la moitié de la figure. Les options (dont la barre d'outils) sont imposées par l'exercice à la génération, jamais modifiées par l'élève, et `loadJson()` les laisse inchangées si elles sont absentes.

L'historique (pile d'undo) n'est pas concerné : il n'est présent que dans `figure.getJsonWithHistory()`, qui n'est pas utilisé pour les réponses.

Les snapshots ApiGeom des tests e2e (`tests/e2e/tests/view/view.capytale.save*.test.ts`) contiennent ce JSON : ils sont à régénérer après toute évolution du format ou mise à jour du paquet apigeom.
