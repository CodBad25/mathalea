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

### Conserver un QCM en option

Pour un automatisme construit avec `ExerciceQcmA`, la classe
`src/exercices/ExerciceQcmACourt.ts` conserve le tirage et les propositions du
QCM, mais affiche une saisie courte par défaut. La case « Version QCM » (`sup3`)
réactive le QCM. La réponse attendue est normalement la première proposition,
sans délimiteurs mathématiques ni unité ; les propriétés `reponseCourte`,
`enonceCourt`, `correctionCourte`, `compareReponseCourte` et `clavierReponseCourte`
permettent de traiter les cas qui exigent une autre saisie, une consigne adaptée ou
une autre comparaison. Le champ est placé
sous l'énoncé ; `champReponseCourteEnLigne = true` le place à la suite de
l'énoncé (par exemple après « $P\times$ »). Le score de la
saisie courte est toujours d’un point par question.

En saisie libre, le mode de comparaison doit toujours être imposé, et non laissé
à la comparaison par défaut (qui accepte toute écriture de même valeur). Il se
règle avec `compareReponseCourte`, qui reçoit la saisie et la réponse attendue
et appelle `fonctionComparaison()` avec l'option voulue :

```ts
import { fonctionComparaison } from '../../lib/interactif/comparisonFunctions'

this.compareReponseCourte = (saisie, reponse) =>
  fonctionComparaison(saisie, reponse, { fractionEgale: true })
```

Une réponse attendue en fraction se compare avec `fractionEgale` ; une réponse en
nombre avec `nombreDecimalSeulement`, qui n'accepte que l'écriture décimale ou
entière. Une probabilité ou une valeur doit donc être demandée comme telle
(« Quelle est la valeur de… ? »), et non comme une notation (`P_{A_3}(S)`) que la
comparaison ne saurait pas vérifier. Les exercices 1A-E05-1 à 4 et 1A-P05-1 à 6
donnent des exemples.

Le clavier virtuel de la saisie libre se règle avec `clavierReponseCourte`
(`KeyboardType`), choisi d'après le type de la réponse attendue : une fraction
demande `clavierDeBaseAvecFraction` ; des entiers relatifs, `clavierDeBase` ;
des entiers naturels ou des décimaux positifs, `clavierNumbers` (chiffres et
virgule). Les autres cas (unités, lettres, puissances…) sont listés dans
[Claviers virtuels](../maintenance-moteur/interactivite/claviers.md). Sans
réglage, le clavier est `clavierDeBase`.

Pour les probabilités (notation `P(B)`, consigne « Calculer $P(B)$. » ou « $P(B)=$ »,
clavier et comparaison), voir [Probabilités](mathematiques/probabilites.md). Un exercice
en saisie libre n'a pas de ligne `amcType` (voir [Export AMC](complements/export-amc.md#type-amc-et-saisie-libre)).

La saisie libre est la valeur par défaut : la case « Version QCM » est décochée
(réglage hérité de `ExerciceQcmACourt`, sans rien à écrire dans le
constructeur). Pour un exercice déjà publié en QCM, ce changement de défaut
modifie les liens partagés sans paramètre `s3`. Il faut donc archiver la
version publiée avec `pnpm archive <code>` avant de changer le défaut : les
anciens liens gardent alors le QCM, et le fichier de travail reçoit un nouvel
`uuid`. Les exercices 1A-E05-1 à 1A-E05-4 et 1A-P05-1 à 1A-P05-6 suivent ce modèle.

La correction de la saisie libre se règle avec `correctionCourte` : elle peut
différer de `correction` (la mise en évidence ne doit contenir que ce que le
champ attend, voir [Couleur du résultat final](rediger-un-exercice.md#couleur-du-résultat-final)).
Si la correction QCM est construite par une fonction (`corrige(mise, unite)`),
l'appeler deux fois, avec la bonne réponse QCM puis avec la réponse de la saisie
libre, évite de dupliquer le texte. Cette construction ne doit faire aucun
tirage aléatoire supplémentaire, sans quoi les tirages du QCM publié se
décalent.

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
