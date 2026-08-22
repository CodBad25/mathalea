# Mathalea Couteau Suisse

`mathalea-couteau-suisse` sert à composer plusieurs custom elements interactifs
dans une même question, tout en gardant un seul `formatInteractif` pour le
pipeline de correction.

Il est utile quand une question doit enchaîner plusieurs tâches autonomes, par
exemple :

- un `multi-mathfield` pour plusieurs calculs ;
- un `tableau-signes-variations` ;
- un `mathalea-qcm`.

L'exercice de référence est `src/exercices/2e/2F21-11.ts` : il enchaîne des
calculs d'images, des calculs d'antécédents, un tableau de signes optionnel et
un QCM sur une droite représentative.

## Principe

Le wrapper reçoit deux informations :

- `contenu` : le HTML réellement affiché dans la question, construit avec les
  custom elements enfants ;
- `elements` : la liste des sous-éléments à vérifier, avec l'`autoCorrection`
  attendue par chacun.

Au moment de la correction, `MathaleaCouteauSuisseElement.verifQuestion()`
remplace temporairement l'`autoCorrection` de la question par celle du
sous-élément courant, appelle son `verifQuestion()`, puis additionne les scores.

## Exemple minimal

```ts
import {
  MathaleaCouteauSuisseElement,
  type MathaleaCouteauSuisseChild,
} from '../../lib/customElements/MathaleaCouteauSuisse'
import { MathaleaQcmElement } from '../../lib/customElements/MathaleaQcm'
import { MultiMathfieldElement } from '../../lib/customElements/MultiMathfield'

const propositions = [
  { texte: '$d_1$', statut: false },
  { texte: '$d_2$', statut: true },
  { texte: '$d_3$', statut: false },
  { texte: '$d_4$', statut: false },
]

const elements: MathaleaCouteauSuisseChild[] = [
  {
    formatInteractif: 'multi-mathfield',
    autoCorrection: {
      valeur: {
        champ1: { value: image1 },
        champ2: { value: image2 },
      },
    },
  },
  {
    formatInteractif: 'mathalea-qcm',
    autoCorrection: {
      propositions,
      options: { radio: true },
    },
  },
]

this.autoCorrection[i] = {
  formatInteractif: 'mathalea-couteau-suisse',
  elements,
}

this.listeQuestions[i] = MathaleaCouteauSuisseElement.create({
  numeroExercice: this.numeroExercice ?? 0,
  questionIndex: i,
  elements,
  contenu: [
    MultiMathfieldElement.create({
      numeroExercice: this.numeroExercice ?? 0,
      questionIndex: i,
      dataTemplate: '$g(2)=%{champ1}$ et $g(5)=%{champ2}$',
      dataOptions: {
        champ1: {},
        champ2: {},
      },
    }),
    MathaleaQcmElement.create({
      numeroExercice: this.numeroExercice ?? 0,
      questionIndex: i,
      propositions,
      radio: true,
    }),
  ].join('<br>'),
})
```

## Barème

Le score final est la somme des scores retournés par chaque sous-élément.

Pour un `multi-mathfield`, chaque champ attendu vaut par défaut un point. Un
`multi-mathfield` avec `champ1`, `champ2`, `champ3`, `champ4` rapporte donc
quatre points si les quatre réponses sont justes.

Pour donner un seul point à un sous-élément qui vérifie plusieurs cellules,
comme un tableau de signes, fournir un barème local dans son `autoCorrection` :

```ts
{
  formatInteractif: 'tableau-signes-variations',
  autoCorrection: {
    valeur: {
      reponse: {
        value: JSON.stringify({
          L0C1: zero,
          L1C1: signeAvant,
          L1C3: signeApres,
        }),
      },
      bareme: (listePoints: number[]) => [
        listePoints.every((point) => point > 0) ? 1 : 0,
        1,
      ],
    },
  },
}
```

Dans `2F21-11`, le barème obtenu est :

- 1 point par calcul dans le `multi-mathfield` ;
- 1 point pour le tableau de signes complet, quand il est demandé ;
- 1 point pour le QCM.

## Points d'attention

- Les sous-éléments doivent conserver leurs identifiants habituels :
  `multi-mathfieldEx...`, `tableau-signes-variationsEx...`,
  `mathalea-qcmEx...`. Les vérificateurs existants les recherchent par ces IDs.
- Dans un `multi-mathfield`, utiliser les champs normalisés `champ1`, `champ2`,
  etc.
- Dans le wrapper, préférer les méthodes `Element.create()` des sous-éléments.
  Les helpers `add...()` modifient souvent directement `autoCorrection[i]` et
  risquent de remplacer le `formatInteractif` global de la question.
- Pour un QCM radio, mettre `radio: true` dans le rendu
  `MathaleaQcmElement.create()` et `options: { radio: true }` dans
  l'`autoCorrection` déléguée.
