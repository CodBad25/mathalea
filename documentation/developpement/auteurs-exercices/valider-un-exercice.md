# Valider un exercice

La validation commence par les rendus de l'exercice, puis se termine par les
tests automatisés adaptés.

## Vérification manuelle

Dans un terminal :

```sh
pnpm dev
```

Dans l'application :

1. ouvrez l'exercice par sa référence ou son UUID ;
2. régénérez plusieurs versions ;
3. modifiez chaque paramètre disponible ;
4. testez une réponse correcte, incorrecte et vide ;
5. affichez la correction ;
6. désactivez l'interactivité ;
7. contrôlez un aperçu imprimable ou LaTeX.

Vérifiez particulièrement les doublons, les divisions par zéro, les valeurs
limites et les corrections qui ne correspondent pas à l'énoncé.

## Format et types

```sh
pnpm format
pnpm check
```

`pnpm format` applique le formatage du dépôt. `pnpm check` vérifie les fichiers
TypeScript et Svelte.

## Tests unitaires

Avant un commit :

```sh
pnpm prebuild-unit-tests
```

Cette commande exécute les tests unitaires de `tests/unit` et de `src`.

## Modifier un exercice déjà publié

Les liens partagés par les utilisateurs contiennent l'`uuid`, la graine du tirage
et les paramètres choisis. Déplacer un appel au générateur aléatoire, ou en
ajouter un avant les autres, décale toutes les valeurs suivantes : les corrigés
déjà distribués ne correspondent plus à l'énoncé. Le contrôle porte sur
plusieurs valeurs de `sup`, `sup2` et `sup3`, pas seulement sur celles par
défaut.

```sh
CHANGED_FILES="src/exercices/6e/6N1E.ts" pnpm stability:check
```

Corriger une coquille, reformuler ou refactoriser sans toucher à l'ordre des
tirages passe sans problème. Si le test signale une dérive assumée, la version
publiée doit être archivée et la version corrigée prendre un `uuid` neuf :

```sh
pnpm archive 6N1E
```

Le détail de la règle et des trois issues possibles est dans
[Stabilité des tirages](../../tests/stabilite-exercices.md).

## Rapports ciblés d'exercices

Si la modification touche l'interactivité, `autoCorrection` ou AMC, utilisez
les commandes décrites dans
[Rapports d'exercices](../../tests/rapports-exercices.md). Préférez un chemin de
fichier ciblé pendant le développement.

## Checklist

- les métadonnées sont uniques et complètes ;
- les questions sont variées et ne se répètent pas ;
- l'énoncé et la correction sont cohérents ;
- le titre, la consigne et la ponctuation respectent
  [Rédiger un exercice](rediger-un-exercice.md) ;
- le HTML interactif fonctionne ;
- le HTML non interactif reste compréhensible ;
- le rendu LaTeX est exploitable ;
- `pnpm check` et `pnpm prebuild-unit-tests` passent ;
- pour un exercice déjà publié, `pnpm stability:check` passe ou la dérive est
  assumée et documentée ;
- les rapports ciblés utiles ne signalent pas de régression.

Pour comprendre les tests globaux ou la CI, consultez
[Tests et CI](../../tests/README.md).
