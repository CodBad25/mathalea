# Rédiger un exercice

Ces règles portent sur la formulation et la présentation d'un exercice
(titre, consigne, énoncés, corrections), pas sur sa mécanique. Elles
s'appliquent que l'exercice soit écrit à la main ou généré par une IA.
Pour construire la classe elle-même, voir
[Créer un exercice](creer-un-exercice.md).

## Titre et consignes à l'infinitif

- Le `titre` de l'exercice commence par un verbe à l'infinitif.
- La `consigne` (et toute instruction donnée à l'élève) est rédigée à
  l'infinitif, pas à l'impératif ni à la deuxième personne.

```ts
// Oui
export const titre = 'Ajouter 9 à un entier'
this.consigne = 'Calculer.'

// Non
export const titre = "Additionne 9 à un nombre"
this.consigne = 'Calcule.'
```

## Ponctuation

Toute phrase se termine par un point, y compris dans les énoncés et les
corrections. Exception : quand une phrase se termine par deux-points suivis
d'une formule affichée à la ligne, la formule n'a pas besoin de point final
propre si le point casserait le rendu mathématique.

```ts
// Oui
const texte = "Calculer la somme suivante :\n$$3 + 5$$"

// Non — pas de "..." pour éviter de finir la phrase
const texteCorr = `Le résultat est ${resultat}...`
```

Ne jamais utiliser `...` pour couper court à une phrase dans une correction :
écrire la phrase complète.

En revanche, quand des points de suspension sont réellement nécessaires
(énumération, suite qui continue, valeur à compléter…), ils doivent être
écrits `\ldots` et non trois points littéraux, pour un rendu typographique
correct.

```ts
// Oui — suite qui continue
sortie.enonce.valeurs = [triangle.a1, '\\ldots', triangle.a3]

// Non
sortie.enonce.valeurs = [triangle.a1, '...', triangle.a3]
```

## Nombres, unités et virgules

- Tous les nombres, sauf les dates (ex. `en 1789`), doivent être écrits
  entre `$...$` : `$3$`, pas `3`, y compris quand le nombre apparaît au
  milieu d'une phrase par ailleurs en texte normal.
- Avant une unité, on met une espace insécable (`sp()` dans le code, ou
  `~` en LaTeX/Typst).
- Une unité n'est jamais du texte brut comme `cm` : elle s'écrit
  `\text{cm}`, à l'intérieur d'une zone mathématique (`$...$`).
- On met une virgule avant « soit » et avant « alors ».
- On met une virgule après « or ».

```ts
// Oui
const texte = `La distance est de $${d}${sp()}\\text{cm}$, soit $${d / 100}${sp()}\\text{m}$.`
const texte2 = 'Or, les deux droites sont parallèles, donc les angles sont égaux.'

// Non
const texte = `La distance est de ${d} cm, soit ${d / 100} m.`
const texte2 = 'Or les deux droites sont parallèles.'
```

## Couleur du résultat final

- Le résultat final attendu est mis en valeur avec `miseEnEvidence()`
  (couleur `orangeMathalea`). Cette couleur est réservée à ce seul usage.
  `miseEnEvidence()` ne fonctionne qu'à l'intérieur d'une zone `$...$`.
- Si l'exercice est interactif, la valeur passée à `miseEnEvidence()` doit
  être **exactement** la réponse que l'élève doit saisir : ne pas y inclure
  d'unité, de mise en forme ou de texte que le champ de saisie n'attend pas.
- Quand le résultat à mettre en valeur est une phrase mêlant texte et
  mathématiques (par exemple la réponse d'un QCM), on mélange les deux
  fonctions : `texteEnCouleurEtGras()` pour les portions de texte (en
  dehors de `$...$`, c'est son seul usage possible) et `miseEnEvidence()`
  pour les portions mathématiques (à l'intérieur de `$...$`).
- Tout texte explicatif de la correction (méthode, calcul intermédiaire,
  bloc "Mentalement :") utilise `texteEnCouleur(texte, bleuMathalea)` — ne
  jamais laisser la couleur par défaut de `texteEnCouleur()`, qui est
  `orangeMathalea` et produirait une explication orange par erreur. Les
  nombres présents dans ce texte restent soumis à la règle ci-dessus : ils
  sont écrits entre `$...$` à l'intérieur même de la chaîne passée à
  `texteEnCouleur()`.

```ts
import { miseEnEvidence, texteEnCouleur, texteEnCouleurEtGras } from '../../lib/outils/embellissements'
import { bleuMathalea } from '../../lib/colors'

// Résultat final : orange, valeur brute attendue par le champ de saisie
const texteCorr = `$${a}+9=${miseEnEvidence(resultat)}$`

// Résultat final mêlant texte et maths (QCM) : mélange des deux fonctions
const texteQcm = `${texteEnCouleurEtGras('Le nombre')} $${miseEnEvidence(a)}$ ${texteEnCouleurEtGras('a pour image')} $${miseEnEvidence(image)}$ ${texteEnCouleurEtGras('par la fonction')} $f$.`

// Explication : bleu explicite, jamais la couleur par défaut ;
// les nombres restent entre $ dans la chaîne
const explication = texteEnCouleur('Mentalement, on ajoute $10$ puis on retire $1$.', bleuMathalea)
```

## Métadonnées

- `uuid` et `refs` ne sont jamais copiés depuis un autre exercice : générer
  un `uuid` avec `pnpm getNewUuid` et vérifier que la référence est libre.
  Voir [Créer un exercice](creer-un-exercice.md#2-déclarer-les-métadonnées).

## Modifier un exercice déjà publié

Si la modification touche un exercice déjà publié (donc déjà partagé avec un
`uuid` et une graine), lancer la vérification de stabilité des tirages :

```sh
CHANGED_FILES="src/exercices/6e/6N1E.ts" pnpm stability:check
```

Le détail de la règle et des trois issues possibles est dans
[Stabilité des tirages](../../tests/stabilite-exercices.md).

## Checklist rapide

- [ ] le titre commence par un infinitif ;
- [ ] la consigne et les énoncés sont à l'infinitif ;
- [ ] toutes les phrases finissent par un point (sauf formule à la ligne
      après un deux-points) ;
- [ ] aucun `...` pour couper court à une phrase ; les points de suspension
      réellement utiles sont écrits `\ldots` ;
- [ ] tous les nombres (sauf les dates) sont entre `$...$` ;
- [ ] une espace insécable précède chaque unité, et l'unité est écrite
      `\text{...}` dans une zone `$...$` ;
- [ ] virgule avant « soit » et « alors », virgule après « or » ;
- [ ] le résultat final est dans `miseEnEvidence()` (ou un mélange
      `texteEnCouleurEtGras()` / `miseEnEvidence()` si la réponse mêle texte
      et maths), et correspond exactement à la réponse attendue si
      l'exercice est interactif ;
- [ ] les explications de correction utilisent `bleuMathalea` explicitement ;
- [ ] `uuid` et `refs` sont neufs, pas copiés ;
- [ ] `pnpm stability:check` passe si un exercice publié a été modifié.
