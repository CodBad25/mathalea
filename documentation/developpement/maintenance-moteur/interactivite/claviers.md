# Claviers virtuels

Un champ MathLive peut afficher un clavier virtuel. L'exercice choisit un
**type de clavier** (`KeyboardType`), qui correspond à une liste de **blocs**
de touches.

La page `http://localhost:5173/alea/?uuid=clavier`
(`src/exercicesInteractifs/ClavierTest.svelte`) affiche chaque type de clavier
pour les essayer.

## Côté exercice

```ts
import { KeyboardType } from '../../lib/interactif/claviers/keyboard'

texte += ajouteChampTexteMathLive(this, i, KeyboardType.clavierDeBaseAvecFraction)
```

Plusieurs types se combinent en les séparant par une espace
(`` `${KeyboardType.clavierNumbers} ${KeyboardType.grecTrigo}` ``) :
`buildDataKeyboardFromStyle()` réunit leurs blocs sans doublon. Sans type
reconnu, le clavier par défaut contient les blocs `numbers`, `fullOperations`
et `variables`. Pour des
touches propres à une question, utiliser `KeyboardType.clavierPersonnalisable`
et `dataKeys` : voir
[Ajouter des touches propres à une question](../../auteurs-exercices/complements/formats-interactifs.md#ajouter-des-touches-propres-à-une-question).

Quelques types courants :

| Type | Usage |
| --- | --- |
| `clavierDeBase` | nombres et opérations |
| `clavierDeBaseAvecFraction` | nombres, opérations, fractions |
| `clavierDeBaseAvecVariable` | idem avec des lettres |
| `lycee`, `lyceeClassique` | fonctions et opérations du lycée |
| `grecTrigo` | lettres grecques et fonctions trigonométriques |
| `clavierHms` | durées et horaires |
| `clavierEnsemble` | ensembles et intervalles |
| `longueur`, `aire`, `volume`, `masse` | grandeurs avec unités |
| `alphanumeric` | clavier alphanumérique |

La liste complète est `KEYBOARD_CATEGORIES` dans
`src/lib/interactif/claviers/keyboard.ts`.

## Créer un type de clavier

Dans `src/lib/interactif/claviers/keyboard.ts` :

1. ajouter le nom à `KEYBOARD_CATEGORIES` ;
2. dans `convertKeyboardTypeToBlocks()`, associer ce type à sa liste de blocs.

## Créer un bloc de touches

1. Dans `src/components/keyboard/types/keyboardContent.ts`, ajouter le nom du
   bloc au type `BlockForKeyboard`.
2. Dans `src/components/keyboard/layouts/keysBlocks.ts`, définir les touches
   puis le bloc, et l'ajouter à l'objet `keyboardBlocks` :

   ```ts
   const monBlocCaps: CompleteKeysList = {
     inline: [1, 2, 3, 'ADD', 'SUB'],
     block: [1, 2, 3, 'ADD', 'SUB'],
   }

   export const monBloc: KeyboardBlock = {
     keycaps: monBlocCaps,
     cols: 3,
     title: 'Mon bloc',
     isUnits: false,
   }
   ```

   `inline` donne l'ordre des touches sur une ligne (petits écrans), `block`
   leur ordre dans la grille de `cols` colonnes.
3. Les touches elles-mêmes (affichage et commande insérée) sont définies dans
   `src/components/keyboard/lib/keycaps.ts`.

Vérifier le résultat sur la page de test `?uuid=clavier`.
