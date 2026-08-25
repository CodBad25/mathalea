# Quizz dans MathALÉA

## Objectif

Utilisation des exercices MathALÉA de type QCM comme matériel pour des quizzes de type Kahoot via une adaptation de la plateforme open-source [Razzia](https://github.com/Ralex91/Razzia)

## Fonctionnement attendu

### Création du quizz

L'enseignant sélectionne des exercices comme il le ferait pour n'importe quel support.

Voici par exemple une URL MathALÉA avec un choix d'exercices :

```
https://coopmaths.fr/alea/?uuid=3e5b1&id=1A-C01-3&alea=BdPC&uuid=32014&id=1A-C01-5&alea=jsEV&uuid=6d860&id=1A-C01-1&alea=GOJZ
```

L'utilisateur clique sur les exports et choisis l'option QUIZZ : il bascule sur une interface (même URL que précédemment avec `&v=quizzconf` à la fin pour le routage vers la vue spécifique) où il va pouvoir choisir un titre pour le quizz et une fois le quizz terminé, il pourra cliquer sur un bouton pour télécharger le lien vers le quizz.

**Remarque** : 
1. l'utilisateur doit être informé si des exercices sélectionnés ne sont pas compatibles. Ils seront grisés dans la liste et pourront être supprimés
2. l'utilisateur doit avoir la possibilités de réorganiser l'ordre des questions
3. 

### Utilisation du quizz

L'URL construite pour le quizz avec la sélection d'exercices sera la même URL que précédemment avec `&v=quizz` et `&subject=...` et des paramètres liés au quizz lui même `&quizzParam=...` (voir infra pour précisions) codé en base64.

L'URL ci-dessus deviendrait alors

```
https://coopmaths.fr/alea/?uuid=3e5b1&id=1A-C01-3&alea=BdPC&uuid=32014&id=1A-C01-5&alea=jsEV&uuid=6d860&id=1A-C01-1&alea=GOJZ&v=quizz&subject=Quizz+sur+les+dérivées&quizzParam=...
```

Le quizz se déroule comme dans un quizz Razzia.

## Idée de développement

Créer une adaptation de la plateforme open-source [Razzia](https://github.com/Ralex91/Razzia) pour intégration dans la plateforme MathALÉA. 

### Spécificités

La version adaptée de Razzia aura les spécificités suivantes :

1. Elle devra être débarasser de l'interface de management d'un quizz (puisque la constitution du quizz se fera depuis le site MathALÉA directement). 
2. Elle reprendra la logique d'organisation du quizz, avec notamment la possibilité de décrire un quizz grâce à un objet JSON, facilement transformable en objet JS ou TS.
3. Elle reprendra la loique de déroulement d'un quizz qui s'intègrera dans des composants spécifiques (voir infra)
4. Elle intégrera les éléments de corrections lors de la révélation de la solution d'une question (ces éléments sont disponible avec l'exercice sélectionné dans MathALÉA).
5. Elle reprendra les éléments graphiques de MathALÉA : couleurs, fontes, ...
6. Images de fond dédiées à positionner dans `public/images/quizz/backgrounds`


## Composants dédiés

Pour les vues `v=quizzconf` et `v=quizz`, il faudra développer des composant Svelte 5 dédiés.

### `quizzconf`

Ce premier est très simple et doit reprendre les éléments des autres interfaces de configuration dans `src/components/setup/quizz`. Il doit restituer sous la forme d'un tableau la liste des exercices sélectionnées avec en regard les éléments optionnels, notamment `time` pour régler le temps de réponse accordé à chaque question.

### `quizz`

Le deuxième devra faire l'objet de plus de travail vu qu'il devra intégrer la mécanique d'un quizz Razzia. Le matériel sera établi dans `src/display/quizz`. Séparer le design de l'interface de la logique dans un répertoire à part `layouts`.

Comme décrit dans la [documentation](https://github.com/Ralex91/Razzia/blob/main/docs/quiz.md), le matériel du quizz peut-être décrit dans un format JSON dont voici un exemple :

```
{
  "subject": "Example Quiz",
  "questions": [
    {
      "question": "What is the correct answer?",
      "answers": ["No", "Yes", "No", "No"],
      "solutions": [1],
      "cooldown": 5,
      "time": 15
    },
    {
      "question": "Which of these are primary colors?",
      "answers": ["Red", "Green", "Blue", "Yellow"],
      "solutions": [0, 2, 3],
      "cooldown": 5,
      "time": 20
    },
    {
      "question": "What is the correct answer with an image?",
      "answers": ["No", "Yes", "No", "No"],
      "media": {
        "type": "image",
        "url": "https://placehold.co/600x400.png"
      },
      "solutions": [1],
      "cooldown": 5,
      "time": 20
    }
  ]
}
```

Cette structure doit inspirer l'objet TS qui sera construit pour décrire le quizz. Le contenu des questions (propriété `question`) sera construit comme celui du contenu d'un exercice de CAN par exemple. Il faudra ajouter à l'objet une propriété `correction` qui correspondra non pas au numéro de la réponse juste mais au raisonnement pour y arriver (présent dans les corrections des exercices de type QCM)

Dans l'interface de présentation du quizz, tout le matériel nécéssaire est déjà précent : il ne s'agit pas d'un composant où le quizz pourra être édité mais d'un composant où le quizz va s'exécuter.
