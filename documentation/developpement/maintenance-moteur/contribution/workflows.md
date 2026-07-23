# Workflows de contribution au moteur

Cette page complète le [démarrage auteur](../../auteurs-exercices/demarrage.md)
pour les modifications transversales.

## Mettre à jour une branche

Commencez par vérifier l'état du dépôt :

```sh
git status
git branch --show-current
```

Sur une branche propre, récupérez les changements de la branche principale
selon le workflow convenu par l'équipe. Ne réécrivez pas l'historique d'une
branche partagée sans coordination.

## Vérifications

Les commandes de référence sont :

```sh
pnpm prebuild-unit-tests
pnpm check
pnpm build
```

Ajoutez les tests ciblés du sous-système modifié. Les suites Playwright, LaTeX,
PDF et les jobs GitLab sont décrits dans
[Tests et CI](../../../tests/README.md).

## Store pnpm

Le store du dépôt est configuré par :

```yaml
storeDir: .pnpm-store
```

dans `pnpm-workspace.yaml`. Les commandes pnpm ne nécessitent pas d'option
supplémentaire. Le dossier est ignoré par Git et utilisé comme cache en CI.

## Build et dépendances

- `pnpm install` synchronise les dépendances ;
- `pnpm build` vérifie la production d'une application distribuable ;
- les navigateurs Playwright et les outils LaTeX sont des prérequis séparés ;
- une modification de dépendance doit conserver `pnpm-lock.yaml` cohérent.

## Diagnostic

En cas d'échec :

1. relancez la commande ciblée sans masquer sa sortie ;
2. vérifiez les versions de Node et pnpm ;
3. identifiez le premier test en erreur ;
4. comparez avec le job correspondant dans `.gitlab-ci.yml` ;
5. consultez les documents de [Tests et CI](../../../tests/README.md).
