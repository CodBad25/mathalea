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
export const interactifType = 'mathLive'
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
handleAnswers(this, i, {
  reponse: {
    value: a + b,
  },
})
```

`value` reçoit la valeur que MathALÉA doit accepter. Le comparateur standard
convient aux nombres et expressions courantes.

Pour une fraction, une unité, une expression sous une forme précise ou une
tolérance, consultez les
[recettes mathématiques](mathematiques/README.md) puis la section de comparaison
des [formats interactifs spécialisés](complements/formats-interactifs.md).

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
