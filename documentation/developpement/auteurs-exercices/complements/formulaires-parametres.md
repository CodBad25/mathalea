# Formulaires de paramétrage

Un exercice expose ses réglages à l'enseignant via des propriétés `besoinFormulaire*`
déclarées dans le constructeur. Les valeurs saisies sont rangées dans `this.sup` à
`this.sup5`, puis sérialisées dans l'URL partagée (`s`, `s2`, … `s5`).

## Formulaires classiques

Chaque emplacement `supN` accueille **un seul** réglage, choisi parmi trois types.

| Déclaration | Valeur dans `supN` | Rendu |
| --- | --- | --- |
| `this.besoinFormulaireNumerique = [titre, max]` | nombre | champ numérique borné |
| `this.besoinFormulaireNumerique = [titre, max, '1 : …\n2 : …']` | index de l'option | menu déroulant |
| `this.besoinFormulaireCaseACocher = [libellé]` | booléen | case à cocher |
| `this.besoinFormulaireTexte = [titre, aide]` | chaîne | champ texte |

Les emplacements suivants utilisent les mêmes noms préfixés du numéro :
`besoinFormulaire2Numerique`, `besoinFormulaire3CaseACocher`, etc.

Ces formulaires conviennent tant que l'exercice reste à cinq réglages indépendants.
Au-delà, on finit par encoder plusieurs dimensions dans un seul menu déroulant
(« 1 : multiplications / 2 : divisions / 3 : les deux / 4 : octets / 5 : mélange »),
ce qui devient vite illisible pour l'enseignant comme pour l'auteur.

## Formulaire complexe

`besoinFormulaireComplexe` regroupe plusieurs champs de natures différentes dans le
seul emplacement `this.sup`. Il est décrit dans
[src/lib/formulaireComplexe.ts](../../../../src/lib/formulaireComplexe.ts) et rendu par
`FormulaireComplexe.svelte`.

### Déclarer le formulaire

```ts
import {
  lireFormulaireComplexe,
  serialiseFormulaireComplexe,
  valeursParDefaut,
  type FormulaireComplexe,
} from '../../lib/formulaireComplexe'

const monFormulaire: FormulaireComplexe = {
  champs: [
    {
      type: 'listePondereeOrdonnee',
      nom: 'unites',
      label: 'Unités (poids d’apparition)',
      labelOrdre: 'Respecter l’ordre des unités',
      items: [
        { nom: 'm', label: 'Longueurs (m)', poids: 1 },
        { nom: 'g', label: 'Masses (g)', poids: 1 },
        { nom: 'euro', label: 'Prix (€)', poids: 0 },
      ],
    },
    {
      type: 'selection',
      nom: 'operations',
      label: 'Type d’opérations',
      options: [
        { valeur: 'mult', label: 'Multiplications' },
        { valeur: 'div', label: 'Divisions' },
      ],
      defaut: 'mult',
    },
    { type: 'case', nom: 'decimaux', label: 'Avec des nombres décimaux' },
  ],
}
```

Dans le constructeur :

```ts
this.besoinFormulaireComplexe = monFormulaire
this.sup = serialiseFormulaireComplexe(
  monFormulaire,
  valeursParDefaut(monFormulaire),
)
```

Fixer `this.sup` dès le constructeur garantit que l'exercice se génère correctement
avant toute ouverture du panneau de paramètres.

### Types de champs

| `type` | Rendu | Valeur lue |
| --- | --- | --- |
| `case` | case à cocher | `boolean` |
| `selection` | menu déroulant | `valeur` de l'option choisie |
| `liste` | items à cocher ou décocher | items `{ nom, label, poids }` avec `poids` valant 0 ou 1 |
| `listePonderee` | items cochables, avec un poids d'apparition | items `{ nom, label, poids }` |
| `listePondereeOrdonnee` | idem, plus des flèches de réordonnancement et une case « tenir compte de l'ordre » | items `{ nom, label, poids }` + booléen d'ordre |

Les trois types de listes partagent la même lecture côté exercice ; ils diffèrent par
ce que l'enseignant peut régler.

- `liste` : items déclarés avec `actif` (`true` par défaut). Décocher revient à un poids
  nul, ce qui permet d'utiliser `listeActive()` et `repartition()` comme pour les autres
  listes.
- `listePonderee` : items déclarés avec `poids` (`1` par défaut, `0` pour décoché).
  `poidsMax` borne le poids saisissable (10 par défaut). Pas de flèches : l'ordre
  affiché est toujours celui de la déclaration.
- `listePondereeOrdonnee` : ajoute les flèches et une case dont le libellé est réglé par
  `labelOrdre` (`LABEL_ORDRE_DEFAUT` sinon) et l'état initial par `defautOrdre`
  (`false` par défaut). Tant que cette case est décochée, l'ordre affiché n'a aucun effet
  sur la génération.

### Lire les valeurs dans `nouvelleVersion()`

```ts
const params = lireFormulaireComplexe(monFormulaire, this.sup)

params.case('decimaux') // boolean
params.selection('operations') // 'mult' | 'div'
params.liste('unites') // items dans l'ordre affiché, items décochés compris
params.listeActive('unites') // items de poids strictement positif
params.declares('unites') // items tels que déclarés par l'exercice (poids par défaut)
params.ordreImpose('unites') // case « tenir compte de l'ordre »
params.repartition('unites', this.nbQuestions) // ordonnée ou mélangée selon la case
params.repartitionOrdonnee('unites', this.nbQuestions) // ordonnée quoi qu'il arrive
```

Tous ces accès se font **par nom de champ** (`nom`), jamais par position. N'indexez pas
`monFormulaire.champs` par sa position (`monFormulaire.champs[0]`) pour retrouver la
déclaration d'un champ — l'ordre des champs est un choix d'affichage et change sans
prévenir. Utilisez `params.declares(nom)` si vous avez besoin des items tels que
déclarés par l'exercice, par exemple pour reconstruire des items de repli après avoir
filtré `params.liste(nom)`.

`repartition()` est le point d'entrée normal : il respecte l'ordre affiché si la case
« tenir compte de l'ordre » est cochée, et mélange sinon. Pour une `liste` ou une
`listePonderee`, `ordreImpose()` vaut toujours `false` et la répartition est donc
mélangée.

Dans les deux cas, le nombre de questions attribué à chaque item est **exactement**
proportionnel à son poids (`repartitionExacte()`) : la somme vaut le nombre de questions
demandé, et les questions qui ne tombent pas juste vont aux plus grandes parts
fractionnaires, à égalité au premier item dans l'ordre affiché.

La version ordonnée **regroupe** ensuite les questions par item, dans l'ordre affiché :

| Poids | Questions | Résultat |
| --- | --- | --- |
| `m` 1, `L` 1, `g` 1 | 5 | `m, m, L, L, g` |
| `m` 3, `L` 1, `g` 1 | 5 | `m, m, m, L, g` |
| `m` 2, `L` 1 | 7 | `m, m, m, m, m, L, L` |

La version mélangée applique la même répartition puis un `shuffle()` : le tirage dépend
de la graine de l'exercice et reste donc reproductible.

Si l'enseignant décoche tout, les répartitions retombent sur les poids déclarés dans
le formulaire, puis sur l'ensemble des items : un exercice ne reste jamais sans
question à générer.

### Sérialisation et URL

Les valeurs sont concaténées dans une chaîne unique, dans l'ordre de déclaration des
champs, avec des caractères que `URLSearchParams` n'encode pas. Chaque type de champ a
sa forme compacte :

| `type` | Forme | Exemple |
| --- | --- | --- |
| `case` | `1` ou `0` | `1` |
| `selection` | valeur de l'option | `mult` |
| `liste` | un caractère `1`/`0` par item, dans l'ordre de déclaration | `101` |
| `listePonderee` | poids séparés par `-`, dans l'ordre de déclaration | `2-1-0` |
| `listePondereeOrdonnee` | `<ordre>_<indice>.<poids>-…`, dans l'ordre choisi | `1_2.3-0.2-1.0` |

```
s=0_0.1-1.1-2.0*2-1*101*mult*0
  │              │   │   │   └── case
  │              │   │   └────── selection
  │              │   └────────── liste
  │              └────────────── listePonderee
  └───────────────────────────── listePondereeOrdonnee
```

Le désérialiseur est tolérant : une URL tronquée, un item inconnu ou une option
disparue reprennent la valeur par défaut du champ. Ajouter un champ **à la fin** de la
liste, ou un item **à la fin** d'une liste pondérée, préserve donc les URL déjà
partagées ; insérer ou supprimer un champ existant les invalide.

## Exemple complet

[src/exercices/6e/\_Exercice_conversions_parametrable.ts](../../../../src/exercices/6e/_Exercice_conversions_parametrable.ts)
combine une `listePondereeOrdonnee` (les unités), une `selection` (le type d'opérations)
et deux `case` (décimaux, fractions dans la correction). Il est instancié par
[src/exercices/5e/5G2D-4.ts](../../../../src/exercices/5e/5G2D-4.ts).

Les tests correspondants sont dans `tests/unit/formulaireComplexe.test.ts` et
`tests/unit/conversionsParametrable.test.ts`.
