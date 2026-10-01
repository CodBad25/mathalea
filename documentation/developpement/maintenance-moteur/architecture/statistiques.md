# Statistiques Matomo

Le module [`src/modules/stats.ts`](../../../../src/modules/stats.ts) initialise
les deux trackers Matomo au chargement de l'application. Le suivi est désactivé
sur `localhost` et les cookies Matomo sont désactivés.

## URL réservée aux statistiques

Les fonctions pures
[`buildStatsUrl()` et `buildNormalUrl()`](../../../../src/modules/statsUrl.ts)
convertissent les URL dans les deux sens. Elles sont aussi réexportées par
[`statsUtils.ts`](../../../../src/modules/statsUtils.ts). `buildStatsUrl()`
construit une copie de l'URL du navigateur pour Matomo. Chaque paramètre
n'apparaît qu'une fois :

- `uuid` devient `uuids`, avec toutes les valeurs séparées par des virgules,
  dans l'ordre de la sélection, y compris lorsqu'un exercice est présent
  plusieurs fois.
- Les autres paramètres répétés (`id`, `alea`, `n`, `s`…) sont également
  regroupés par des virgules, sous leur nom d'origine.
- Les paramètres uniques, l'origine, le chemin et le fragment sont conservés.
- `_mathaleaStats` contient des métadonnées JSON versionnées : `keys` est la
  liste des noms d'origine, et `order` contient l'indice de la clé de chaque
  occurrence dans l'URL normale. Ces métadonnées permettent de reconstruire
  l'ordre exact, sans supposer que tous les exercices ont les mêmes paramètres.

Exemple, présenté sans l'encodage URL des virgules et des métadonnées :

```text
Navigateur : https://coopmaths.fr/alea/?uuid=A&uuid=B&v=eleve
Matomo    : https://coopmaths.fr/alea/?uuids=A,B&v=eleve&_mathaleaStats={"version":1,"keys":["uuid","v"],"order":[0,0,1]}
```

Cette représentation évite la perte des paramètres répétés lors du traitement
serveur de Matomo, décrite dans
[l'issue nº 9842](https://github.com/matomo-org/matomo/issues/9842). Elle est
réservée aux statistiques : elle ne modifie ni l'adresse du navigateur ni les
liens partageables. Pour ouvrir une série à partir de l'URL statistique, utiliser
`buildNormalUrl()` pour reconstituer un lien MathALÉA normal.

## Conversion inverse et paramètres facultatifs

Les paramètres d'un exercice suivent son `uuid` dans l'URL normale. Par exemple,
si `s` existe pour les exercices 1 et 3, mais pas pour le 2 :

```text
Normale : ?uuid=A&s=1&uuid=B&uuid=C&s=3&v=eleve
Stats   : ?uuids=A,B,C&s=1,3&v=eleve
Métadonnées : {"version":1,"keys":["uuid","s","v"],"order":[0,1,0,0,1,2]}
```

`buildNormalUrl()` relit `order` et consomme les valeurs de chaque clé dans
l'ordre. Il restitue `s=1` après `uuid=A` et `s=3` après `uuid=C`, sans ajouter
de paramètre à `uuid=B`. Le même mécanisme fonctionne pour toutes les clés,
y compris un futur paramètre, plusieurs occurrences dans un même exercice,
des UUID identiques, et des réglages globaux intercalés entre les exercices.
Un paramètre absent reste absent ; une valeur explicitement vide reste présente.

Les virgules présentes **dans une valeur** sont échappées en `%2C`, et les `%`
en `%25`, avant le regroupement. `URLSearchParams` applique ensuite l'encodage
URL habituel : une virgule de séparation devient `%2C` dans l'adresse, et une
virgule appartenant à une valeur devient `%252C`. La conversion inverse retire
ces deux couches, sans confondre une virgule avec le texte littéral `%2C`.

Si l'URL normale contient déjà `uuids` avec `uuid`, sa clé `uuids` est renommée
en `uuids_` dans l'URL statistique. Un suffixe `_` supplémentaire est ajouté
tant que le nom existe déjà. La même règle évite les collisions avec
`_mathaleaStats`. Les noms d'origine sont restaurés au retour.

```ts
// Depuis un autre module de src/modules.
import { buildNormalUrl, buildStatsUrl } from './statsUrl'

const statsUrl = buildStatsUrl(pageUrl)
const restoredUrl = buildNormalUrl(statsUrl)
```

L'aller-retour conserve les noms, les valeurs et l'ordre des paramètres.
L'encodage textuel est normalisé par `URLSearchParams` (par exemple, `%20` peut
devenir `+`). Les fonctions ne modifient ni `window.location` ni l'historique et
peuvent être utilisées sans navigateur.

`buildNormalUrl()` rejette des métadonnées invalides, des clés manquantes ou
supplémentaires, des paramètres statistiques répétés, ou un nombre de valeurs
incohérent. Les anciennes URL statistiques sans métadonnées ne permettent pas
de retrouver les paramètres omis : elles sont rejetées plutôt que de deviner
leur affectation. Une URL sans aucun paramètre reste inchangée dans les deux sens.

## Pages vues et changements d'URL

`statsPageTracker()` envoie `setCustomUrl` avec l'URL de statistiques, puis
`trackPageView`, conformément à
[l'API JavaScript Matomo](https://developer.matomo.org/api-reference/tracking-javascript).
Les changements sont ainsi visibles dans le rapport « URL des pages ».

Le même helper est appelé :

- Au chargement, après la configuration des trackers dans `stats.ts`.
- Après une écriture de l'URL par `updateGlobalOptionsInURL()` dans
  [`generalStore.ts`](../../../../src/lib/stores/generalStore.ts), qui regroupe
  les mises à jour des exercices et des réglages pendant 500 ms.
- Lors de la lecture de l'URL par
  [`App.svelte`](../../../../src/components/App.svelte), au montage et lors de
  `popstate` (navigation précédente/suivante).

Une URL identique à la dernière URL suivie ne produit pas de nouvelle page vue.
Un retour à une URL précédemment visitée est compté. L'ancien événement
`PageTracking / VisitedURL` est remplacé par ce suivi ; les autres événements
Matomo (UUID, vue, exports PDF, calculatrices…) restent en place.

Les tests de [`statsUrl.test.ts`](../../../../src/modules/statsUrl.test.ts)
vérifient l'aller-retour, les paramètres facultatifs, les caractères réservés,
les collisions et la validation des métadonnées. Ceux de
[`statsUtils.test.ts`](../../../../src/modules/statsUtils.test.ts) vérifient
l'ordre des commandes Matomo, l'absence de doublons et la conservation de
l'URL du navigateur.
