# Ajouter une interactivité simple

Le cas le plus courant consiste à afficher un champ MathLive puis à enregistrer
la réponse attendue pour chaque question.

## Principe

Deux opérations sont indissociables :

1. ajouter le champ de saisie dans l'énoncé ;
2. déclarer la réponse avec `handleAnswers()`.

Si une seule opération est présente, l'élève ne pourra pas répondre ou sa
réponse ne pourra pas être vérifiée.

## Déclarer l'exercice interactif

Ajoutez les métadonnées près du titre et de l'UUID :

```ts
export const interactifReady = true
```

Ajoutez les imports adaptés à la profondeur du fichier :

```ts
import { handleAnswers } from '../../lib/interactif/gestionInteractif'
import { ajouteChampTexteMathLive } from '../../lib/interactif/questionMathLive'
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
```

## Ajouter le champ

Dans la boucle de `nouvelleVersion()` :

```ts
let texte = `$${a}+${b}=$`

if (this.interactif) {
  texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBase)
}
```

La condition conserve un énoncé propre quand l'interactivité est désactivée ou
quand l'exercice est exporté.

## Enregistrer la réponse

Toujours avec le même indice `i` :

```ts
handleAnswers(
  this,
  i,
  {
    reponse: {
      value: a + b,
    },
  },
  { formatInteractif: 'mathalea-mathfield' },
) /
```

`formatInteractif` est le formatInteractif de la question [voir la documentation des formats interactifs](complements/formats-interactifs.md)

`value` reçoit la valeur que MathALÉA doit accepter. Le comparateur standard
convient aux nombres et expressions courantes. Attention au type : `value: 7`
(nombre) n'accepte que le résultat `7`, alors que `value: '7'` (chaîne)
accepte aussi `3+4`.

Pour une fraction, une unité, une expression sous une forme précise ou une
tolérance, consultez
[Choisir les options de comparaison](complements/options-de-comparaison.md).
Pour combiner plusieurs critères ou donner un score partiel, consultez
[Checks composables](complements/checks-composables.md).

## Exemple dans la boucle

```ts
const resultat = a + b
let texte = `$${a}+${b}=$`
const texteCorr = `$${a}+${b}=${resultat}$`

if (this.interactif) {
  texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBase)
}

handleAnswers(this, i, {
  reponse: { value: resultat },
})

if (this.questionJamaisPosee(i, a, b)) {
  this.listeQuestions[i] = texte
  this.listeCorrections[i] = texteCorr
  i++
}
```

Déclarez la réponse avant d'incrémenter `i`.

## Règle impérative : un nombre de points fixe par question

Une question d'un exercice doit **toujours** rapporter le même nombre de
points maximum, quels que soient la graine et ce qui est tiré au sort. C'est
indispensable à la remontée des scores vers les recorders (Capytale, Moodle…),
qui enregistrent un barème maximum figé pour un exercice donné.

Par défaut, une question vaut 1 point, sauf les formats à plusieurs champs
(`fill-in-the-blank`, `tableau-mathlive`, `multi-mathfield`) corrigés avec
`toutAUnPoint`, qui rapportent **un point par champ**. Dès que le nombre de
champs d'une question dépend du tirage (nombre de solutions, de lignes, de
diviseurs, sous-problème tiré au sort…), fixez le total avec la clé `bareme`
de `handleAnswers()` :

```ts
import { troisPointsProportionnels } from '../../lib/interactif/fonctionsBaremes'

handleAnswers(
  this,
  i,
  { bareme: troisPointsProportionnels, ...reponses },
  { formatInteractif: 'multi-mathfield' },
)
```

`troisPointsProportionnels` ramène la proportion de champs justes sur 3 points,
`toutPourUnPoint` donne 1 point si tout est juste. Une fonction de barème
personnalisée doit, elle aussi, renvoyer un maximum constant.

Le détail technique (calcul de `pointsMaxExercice()`) est dans
[Système d'interactivité](../maintenance-moteur/interactivite/systeme-interactivite.md#stabilité-du-barème-face-au-tirage-aléatoire).

## Formats plus complexes

Le livre de recettes [Formats interactifs spécialisés](complements/formats-interactifs.md)
couvre notamment :

- les textes à trous et tableaux MathLive ;
- les champs texte et listes déroulantes ;
- les QCM ;
- le glisser-déposer et les sélections SVG ;
- les figures cliquables et composants spécialisés.

Si vous devez créer un nouveau type de composant ou modifier la vérification
globale, passez à la
[documentation moteur de l'interactivité](../maintenance-moteur/interactivite/systeme-interactivite.md).
