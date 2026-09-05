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

Ne jamais utiliser `...` dans une correction : écrire la phrase complète.

## Couleur du résultat final

- Le résultat final attendu est mis en valeur avec `miseEnEvidence()`
  (couleur `orangeMathalea`). Cette couleur est réservée à ce seul usage.
- Si l'exercice est interactif, la valeur passée à `miseEnEvidence()` doit
  être **exactement** la réponse que l'élève doit saisir : ne pas y inclure
  d'unité, de mise en forme ou de texte que le champ de saisie n'attend pas.
- Tout texte explicatif de la correction (méthode, calcul intermédiaire,
  bloc "Mentalement :") utilise `texteEnCouleur(texte, bleuMathalea)` — ne
  jamais laisser la couleur par défaut de `texteEnCouleur()`, qui est
  `orangeMathalea` et produirait une explication orange par erreur.

```ts
import { miseEnEvidence, texteEnCouleur } from '../../lib/outils/embellissements'
import { bleuMathalea } from '../../lib/colors'

// Résultat final : orange, valeur brute attendue par le champ de saisie
const texteCorr = `$${a}+9=${miseEnEvidence(resultat)}$`

// Explication : bleu explicite, jamais la couleur par défaut
const explication = texteEnCouleur('Mentalement, on ajoute 10 puis on retire 1.', bleuMathalea)
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
- [ ] aucun `...` dans une correction ;
- [ ] le résultat final est dans `miseEnEvidence()`, et correspond
      exactement à la réponse attendue si l'exercice est interactif ;
- [ ] les explications de correction utilisent `bleuMathalea` explicitement ;
- [ ] `uuid` et `refs` sont neufs, pas copiés ;
- [ ] `pnpm stability:check` passe si un exercice publié a été modifié.
