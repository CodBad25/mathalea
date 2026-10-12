# Questions et sous-questions a), b), c)

`createQuestion()` (`src/lib/interactif/createQuestion.ts`) remplit d'un seul
appel la question `i` d'un exercice : énoncé, correction et réponses
attendues. Une question a :

- soit une réponse (`answer`) : un champ de saisie est ajouté après l'énoncé ;
- soit des sous-questions (`subQuestions`), numérotées a), b), c)… : le champ
  de chaque sous-question est **dans son item**, et sa correction est **sous
  le même repère** dans la correction.

Toutes les réponses d'une question à sous-questions forment une seule question
interactive (`multi-mathfield`) : la question garde son numéro, et chaque
sous-question a son propre smiley.

Ne plus écrire « a) » et « b) » à la main dans l'énoncé, ni regrouper les
champs dans un `remplisLesBlancs()` à la fin de la question.

Modèle complet : `src/exercices/modèlesExos/40_questions_et_sous_questions.ts`.

## Question simple

```ts
import { createQuestion } from '../../lib/interactif/createQuestion'

createQuestion(this, i, {
  question: `Calculer $${a}\\times ${b}$.`,
  correction: `$${a}\\times ${b}=${miseEnEvidence(a * b)}$`,
  answer: { value: a * b },
})
```

`createQuestion()` remplace `this.listeQuestions[i] = …`,
`this.listeCorrections[i] = …`, `ajouteChampTexteMathLive()` et
`handleAnswers()`. Garder la boucle habituelle (`questionJamaisPosee()`,
`i++`) et l'appel final à `listeQuestionsToContenu(this)`.

| Clé            | Rôle                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------- |
| `question`     | énoncé, ou consigne commune aux sous-questions                                              |
| `correction`   | correction, ou explication commune aux sous-questions (vide par défaut)                     |
| `answer`       | réponse attendue, au format d'un champ de `handleAnswers()` (`value`, `options`, `compare`) |
| `field`        | options du champ : `keyboard`, `texteAvant`, `texteApres`                                   |
| `subQuestions` | liste des sous-questions (voir ci-dessous)                                                  |
| `bareme`       | barème de la question (voir ci-dessous)                                                     |

## Question à sous-questions

Extrait de `src/exercices/TEx/TEA1-27.ts` :

```ts
createQuestion(this, i, {
  question: `… Déterminer le sommet d'arrivée de $M$ après avoir parcouru $${steps}$ arcs consécutifs.`,
  correction: `On effectue la division euclidienne de $${steps}$ par $${sides}$ : …`,
  subQuestions: [
    {
      question: 'Dans le sens de la flèche.',
      answer: { value: 'C', options: { texteSansCasse: true } },
      field: { keyboard: KeyboardType.clavierMajuscules },
      correction: `… Le sommet d'arrivée est $${miseEnEvidence('C')}$.`,
    },
    {
      question: 'Dans le sens inverse de la flèche.',
      answer: { value: 'A', options: { texteSansCasse: true } },
      field: { keyboard: KeyboardType.clavierMajuscules },
      correction: `… Le sommet d'arrivée est $${miseEnEvidence('A')}$.`,
    },
  ],
})
```

| Clé d'une sous-question | Rôle                                                                                                                                                                  |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `question`              | énoncé, sans son repère « a) »                                                                                                                                        |
| `correction`            | correction, sans son repère                                                                                                                                           |
| `answer`                | réponse attendue. Sans `answer`, la sous-question n'a pas de champ (« Justifier. »)                                                                                   |
| `field`                 | options du champ du `multi-mathfield` : `keyboard`, `texteApres`, `choices` (liste déroulante), `qcm`… Voir [Formats interactifs spécialisés](formats-interactifs.md) |

Une question à sous-questions n'a pas d'`answer` propre : les réponses sont
dans les sous-questions. Au plus 9 sous-questions (`field0` à `field8`), et un
seul champ par sous-question.

## Barème

Une question simple vaut un point. Dans une question à sous-questions, chaque
sous-question à réponse vaut un point par défaut (`toutAUnPoint`).

La note maximale d'une question ne doit jamais dépendre du tirage : les
enregistreurs (Capytale, Moodle…) s'appuient sur un maximum fixe. Passer un
barème fixe dès que la question `i` peut, selon la graine, avoir un nombre
différent de sous-questions, ou être tantôt simple, tantôt découpée (types de
questions mélangés avec `combinaisonListes()`). C'est le cas du modèle, où
toute question vaut un point :

```ts
createQuestion(this, i, {
  question,
  correction,
  subQuestions,
  bareme: toutPourUnPoint,
})
```

## Hors interactivité

Hors HTML interactif (énoncé papier, LaTeX, Typst), l'énoncé n'a pas de champ
et les sous-questions forment une simple liste a), b), c)… La correction est
la même dans tous les cas.

## Sans `createQuestion()`

`createSubQuestions()` (`src/lib/interactif/subQuestions.ts`) renvoie
seulement `{ question, correction }` pour la liste des sous-questions, à
concaténer soi-même. Elle sert quand l'énoncé doit être construit autrement,
par exemple avec du texte après la liste.
