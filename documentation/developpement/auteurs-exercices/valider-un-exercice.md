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

## Rapports ciblés d'exercices

Si la modification touche l'interactivité, `autoCorrection` ou AMC, utilisez
les commandes décrites dans
[Rapports d'exercices](../../tests/rapports-exercices.md). Préférez un chemin de
fichier ciblé pendant le développement.

## Checklist

- les métadonnées sont uniques et complètes ;
- les questions sont variées et ne se répètent pas ;
- l'énoncé et la correction sont cohérents ;
- le HTML interactif fonctionne ;
- le HTML non interactif reste compréhensible ;
- le rendu LaTeX est exploitable ;
- `pnpm check` et `pnpm prebuild-unit-tests` passent ;
- les rapports ciblés utiles ne signalent pas de régression.

Pour comprendre les tests globaux ou la CI, consultez
[Tests et CI](../../tests/README.md).
