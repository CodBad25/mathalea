# Créer un exercice

Un exercice génératif classique est un fichier TypeScript de `src/exercices/`.
Il hérite de `Exercice`, construit ses questions dans `nouvelleVersion()`, puis
remplit les listes de questions et de corrections.

## 1. Partir d'un exercice proche

Cherchez un exercice récent du même niveau et du même type :

```sh
rg "notion recherchée" src/exercices
```

Placez le nouveau fichier dans le dossier du niveau, par exemple
`src/exercices/6e/`. Évitez les fichiers suffixés par `Old`, qui illustrent
souvent des conventions historiques.

## 2. Déclarer les métadonnées

Générez un UUID disponible :

```sh
pnpm getNewUuid
```

Un exercice exporte au minimum son titre, sa date, son UUID et ses références :

```ts
export const titre = 'Ajouter 9 à un entier'
export const dateDePublication = '23/07/2026'
export const uuid = 'UUID_GENERE'

export const refs = {
  'fr-fr': ['6N0A-1'],
  'fr-ch': [],
}
```

Remplacez les exemples par les valeurs réelles. Un UUID et une référence ne
doivent pas être copiés depuis un autre exercice.

## 3. Construire la classe

Depuis un fichier placé directement dans `src/exercices/6e/` :

```ts
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export default class AjouterNeuf extends Exercice {
  constructor() {
    super()
    this.consigne = 'Calculer.'
    this.nbQuestions = 5
  }

  nouvelleVersion() {
    for (
      let i = 0, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      const a = randint(10, 99)
      const resultat = a + 9
      const texte = `$${a}+9$`
      const texteCorr = `$${a}+9=${miseEnEvidence(resultat)}$`

      if (this.questionJamaisPosee(i, a)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }
    listeQuestionsToContenu(this)
  }
}
```

Adaptez les chemins d'import à la profondeur du fichier. Votre éditeur peut
souvent proposer ou corriger automatiquement ces chemins.

## 4. Lire la boucle

- `i` compte les questions acceptées ;
- `cpt` limite les tentatives afin d'éviter une boucle infinie ;
- `randint()` produit les données de la question ;
- `questionJamaisPosee()` évite les doublons ;
- `listeQuestions[i]` contient l'énoncé ;
- `listeCorrections[i]` contient la correction ;
- `listeQuestionsToContenu(this)` finalise le contenu affiché.

Les valeurs passées à `questionJamaisPosee()` doivent suffire à distinguer deux
questions. Passez toutes les données qui changent réellement l'énoncé.

## 5. Préserver les sorties

Un exercice doit rester lisible :

- en HTML interactif ;
- en HTML sans interactivité ;
- en LaTeX pour l'impression.

Utilisez les helpers existants pour les nombres, les écritures mathématiques et
les figures. Commencez par les
[recettes mathématiques](mathematiques/README.md) avant de concaténer vous-même
du LaTeX complexe.

## 6. Ajouter l'interactivité

Commencez par produire un énoncé et une correction corrects sans champ de
saisie. Ajoutez ensuite le champ et la réponse attendue en suivant
[Ajouter une interactivité simple](interactivite-simple.md).

Pour `ExerciceSimple`, les répartitions contrôlées ou les branches de rendu plus
complexes, consultez [Variantes d'exercices](complements/variantes-exercices.md).
