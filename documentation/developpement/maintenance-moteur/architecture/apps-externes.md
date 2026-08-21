# Apps externes (iframe) et remontée des scores

Les exercices de `src/exercices/apps/` ne génèrent pas de questions : ils
affichent une application tierce dans une `iframe` (mathix.org, coopmaths.fr,
forge…). Ils héritent tous de `ExternalApp`
(`src/exercices/apps/_ExternalApp.ts`), qui construit l'`iframe`, ajuste sa
hauteur et fait le pont entre l'app et les stores de MathALÉA.

## Paramètres passés à l'app

`ExternalApp.html` ajoute à l'URL de l'app :

- les paramètres de l'exercice (`sup`) sous forme de `searchParams` ;
- `v=eleve` en vue élève ;
- `numeroExercice` (indice de l'exercice dans la séance) ;
- `seed`.

## Protocole `postMessage`

Tous les messages portent `numeroExercice` : `ExternalApp` ignore ceux qui ne
correspondent pas à son propre indice.

| `type` | Sens | Rôle |
| --- | --- | --- |
| `mathaleaSettings` | app → MathALÉA | L'app renvoie ses paramètres (`urlParams`), stockés dans `exercicesParams[i].sup` |
| `height` | app → MathALÉA | Ajuste la hauteur de l'`iframe` |
| `mathaleaSendScore` | app → MathALÉA | Score final d'une tentative (`score`, `numberOfQuestions`, `finalState`) |
| `mathaleaAskScore` | app → MathALÉA | L'app demande le score déjà enregistré |
| `mathaleaHasScore` | MathALÉA → app | Restitution d'une copie précédente (`score`, `numberOfQuestions`, `finalState`) |

`mathaleaHasScore` est émis par `handleCapytale.ts` au chargement d'une copie
d'élève (`window.postMessage`), puis relayé à l'`iframe`.

## Règle du meilleur score

Comme pour les exercices MathALÉA, **seule la meilleure tentative est
conservée** : `resultsByExercice[i]` et `exercicesParams[i].bestScore` ne sont
mis à jour que si le nouveau score est supérieur ou égal au meilleur score
connu. Le meilleur score persisté entre deux sessions arrive par Capytale dans
`exercicesParams[i].bestScore` : c'est cette valeur, et non le dernier
`numberOfPoints` en mémoire, qui sert de référence après un rechargement.

`ExternalApp` protège aussi la copie contre deux défauts constatés côté apps :

- un score supérieur au nombre de questions est plafonné et signalé via
  `window.notify` ; il révèle en général une app qui **cumule** le score reçu
  par `mathaleaHasScore` avec celui de la nouvelle tentative (l'app doit stocker
  le score restauré dans une variable dédiée, jamais dans son compteur de
  points) ;
- `handleScore()` n'installe son écouteur `message` qu'une fois, alors que le
  getter `html` est appelé à chaque rendu.

## Voir aussi

- [Questions de cours](questions-de-cours.md) : l'app `questionsDeCours` a
  désormais un équivalent natif, les deux cohabitent
- [Utilisation avec Capytale](../../../utilisation/integrations/capytale.md)
