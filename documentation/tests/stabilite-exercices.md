# Stabilité des tirages des exercices

## Le problème

Les liens partagés par les utilisateurs contiennent l'`uuid` de l'exercice, la
graine du tirage (`alea=…`) et les paramètres choisis (`s=`, `s2=`, `s3=`). Un
professeur distribue un sujet, garde le lien du corrigé, et s'attend à retrouver
les mêmes valeurs des mois plus tard.

Or les exercices tirent leurs valeurs dans un générateur pseudo-aléatoire
initialisé par la graine : la suite des tirages est entièrement déterminée par
l'**ordre** des appels (`randint`, `choice`, `shuffle`…). Déplacer un tirage,
en ajouter un avant les autres, ou modifier un utilitaire partagé qui en
consomme, décale toute la suite. Même graine, mais plus les mêmes nombres : les
corrigés déjà distribués deviennent faux.

Corriger une coquille, reformuler une consigne ou refactoriser sans toucher aux
tirages ne pose en revanche aucun problème.

## La règle

> Pour un `uuid` et une graine donnés, les valeurs numériques de l'énoncé ne
> changent jamais. Si une correction doit les changer, elle change aussi
> son `uuid`.

Le test `tests/e2e/tests/stability/stability.test.ts` fait respecter cette
règle. Il rejoue chaque exercice avec une graine fixe et plusieurs combinaisons
de paramètres, en extrait l'empreinte des nombres de l'énoncé, et la compare à
celle enregistrée dans
`tests/e2e/tests/stability/empreintes-exercices.json`.

## Ce qui est contrôlé

### Les combinaisons de paramètres

Une graine suffit : un tirage déplacé décale les valeurs quelle que soit la
graine. En revanche, une dérive cachée derrière `if (this.sup === 3)` ne se voit
qu'en changeant de paramètre — et les liens partagés portent ces paramètres.
L'effort porte donc sur eux plutôt que sur la variété des graines.

Les combinaisons font varier **un paramètre à la fois** à partir des valeurs par
défaut : `''` (défaut), puis `s=1`, `s=2`, `s=3`, puis `s2=1`, `s2=2`, puis
`s3=1`, `s3=2`, selon ce que l'exercice déclare dans ses `besoinFormulaire*`.
Une combinaison qui redonnerait les valeurs par défaut est écartée. En pratique
cela fait quatre tirages par exercice en moyenne.

Ce sont toujours les **premières** valeurs (1, 2, 3…) et jamais un
échantillonnage : ajouter un niveau à un formulaire ne retire donc jamais de la
couverture aux niveaux déjà protégés. Le produit cartésien n'est pas exploré,
et `sup4`/`sup5` ne sont pas contrôlés.

### Les empreintes

Deux empreintes sont calculées par combinaison
(`tests/e2e/helpers/empreinteExercice.ts`).

| Empreinte | Contenu                                            | Effet         |
| --------- | -------------------------------------------------- | ------------- |
| `nb`      | la suite des nombres affichés dans l'énoncé        | **bloquante** |
| `tx`      | le texte normalisé de l'énoncé et de la correction | informative   |

Le calcul se fait sur le texte affiché : les balises SVG et HTML sont
supprimées, donc les coordonnées de figures et les identifiants n'entrent pas
dans l'empreinte, mais les étiquettes des figures (contenu des balises `<text>`)
si. Les nombres sont normalisés (`3,50` et `3.5` donnent la même empreinte,
comme `12-4` et `12 - 4`), ce qui laisse passer un changement de formatage. Le
signe fait partie du nombre : passer de `-7` à `7` est une dérive.

Conditions du tirage : mode non interactif, trois questions, une graine dérivée
de l'`uuid`.

## Lancer le test

```bash
pnpm stability:check
```

Sur un sous-ensemble, pendant le développement :

```bash
STABILITY_FILTER='6e/6N1' pnpm stability:check
STABILITY_UUIDS='2359a e528e' pnpm stability:check
```

En CI et en local sur une modification en cours, `CHANGED_FILES` restreint le
contrôle aux exercices concernés. Si un fichier de `src/lib/` ou `src/modules/`
a bougé, tout le catalogue est contrôlé : un utilitaire partagé qui change ses
tirages les décale tous.

Le fichier `src/json/uuidsToUrlFR.json` doit être à jour (`pnpm makeJson`).

Le catalogue complet représente environ 4 400 exercices, quelque 18 000 tirages
et quatre minutes d'exécution ; en mode `CHANGED_FILES` sur quelques fichiers,
quelques secondes.

## Où le test tourne

- en CI, dans le job `testExosModifiedConsolidated`, sur les fichiers modifiés
  de la merge request ;
- en local, dans `tasks/exoModified.sh`, avec les autres tests d'exercices ;
- à la demande, sur tout le catalogue, avec `pnpm stability:check`.

## Que faire quand le test échoue

Le test signale que les valeurs numériques d'un exercice ont changé. Trois
issues, dans cet ordre de préférence.

### 1. La dérive n'était pas voulue

C'est le cas le plus fréquent : un refactoring a déplacé un tirage sans qu'on y
prenne garde. Remettre les appels au générateur dans leur ordre d'origine. Les
appels ajoutés doivent l'être **après** ceux qui existent déjà, jamais avant ni
entre eux.

### 2. La modification est mineure et assumée

Un exercice tout juste publié, sans lien partagé dans la nature, ou une
correction d'un bug qui rendait l'énoncé faux de toute façon. Régénérer les
empreintes et expliquer le choix dans le message de commit :

```bash
pnpm stability:update
```

### 3. La modification change l'exercice en profondeur

C'est la règle du dépôt : la version publiée est archivée avec son `uuid`, la
version corrigée prend un `uuid` neuf.

```bash
pnpm archive 6N1E
pnpm makeJson
pnpm stability:update
```

Le code d'exercice suffit ; on peut aussi passer le chemin complet
(`pnpm archive src/exercices/6e/6N1E.ts`).

Le script :

- recopie la version de `HEAD` dans `6N1E-old.ts`, avec son `uuid` d'origine et
  sans référence dans les menus (`'fr-fr': []`, `'fr-ch': ['NR']`) : les anciens
  liens continuent d'afficher exactement le même énoncé, l'exercice n'apparaît
  plus dans le référentiel ;
- donne un `uuid` neuf au fichier de travail, qui garde ses références et sa
  place dans les menus, et met à jour `dateDeModifImportante`.

Les nouveaux utilisateurs voient la version corrigée, les anciens liens ne
cassent pas.

## Le fichier d'empreintes

`tests/e2e/tests/stability/empreintes-exercices.json` tient une ligne par
exercice, indexée par `uuid` :

```json
{
  "2359a": {
    "ex": "6e/6N1E.ts",
    "v": { "": "86ad1f3b:1c40a2e5", "s=2": "…:…", "s=3": "…:…" }
  }
}
```

La clé de `v` reprend les paramètres d'URL (`''` pour les valeurs par défaut) et
la valeur vaut `"<nb>:<tx>"`.

Il fait partie du dépôt, et c'est volontaire : une ligne qui change dans un diff
est le signal visible qu'un exercice ne rendra plus les mêmes valeurs. Une
relecture doit s'y arrêter. Le fichier tient une ligne par exercice pour qu'une
dérive apparaisse comme une seule ligne modifiée.

Une entrée absente n'est pas contrôlée — exercice nouveau, ou combinaison de
paramètres nouvelle : elle sera ajoutée à la prochaine régénération. En
contrepartie, un fichier entièrement absent rendrait la suite verte sans rien
comparer : le test le détecte et échoue explicitement dans ce cas. À
l'inverse, une combinaison présente dans le fichier mais que l'exercice ne
propose plus est signalée : les liens qui l'utilisaient n'affichent plus la même
chose.

## Exercices qui bouclent sur un réglage

Certains exercices contiennent une boucle de rejet non gardée : ils tirent
jusqu'à trouver une valeur acceptable, et pour certains réglages proposés à
l'utilisateur cette valeur n'existe pas. La génération ne s'arrête alors jamais.

Le test compte les appels à `Math.random` pendant chaque génération et
abandonne au-delà de `MAX_TIRAGES_PAR_GENERATION`
(`tests/e2e/helpers/empreinteExercice.ts`). La combinaison fautive est écartée
et signalée, l'exercice reste protégé sur les autres :

```
⚠️  1 combinaison(s) de paramètres n'ont pas pu être générées :
  - 3e/3G10-2.ts (d5f34) : s=8 : plus de 2000000 tirages aléatoires consommés
```

Ces signalements sont des **bugs d'exercices**, pas des faux positifs du test :
le réglage en cause est atteignable depuis le formulaire, et un utilisateur qui
le choisit fige son navigateur. Ils se corrigent à part, dans l'exercice.

## Limites

- Les exercices qui ne se chargent pas dans l'environnement de test (jsdom) sont
  listés en fin d'exécution et laissés de côté. Les autres suites
  (`console_errors`, `all_exercises`) couvrent ces plantages.
- Une seule graine par exercice : une dérive qui ne se manifesterait que pour
  certaines valeurs tirées peut passer inaperçue.
- Le garde-fou ne détecte que les boucles qui consomment de l'aléatoire. Une
  boucle infinie qui n'en tire pas figerait toujours la suite.
- Un paramètre à la fois : une dérive qui n'apparaît qu'avec un croisement
  précis (`s=2` **et** `s2=3`) n'est pas vue, pas plus que celles liées à
  `sup4`/`sup5`.
- Les coordonnées internes des figures ne sont pas dans l'empreinte, seules
  leurs étiquettes le sont.
- L'empreinte `tx` n'est pas bloquante : un changement de texte à valeurs
  constantes est signalé, jamais refusé.
