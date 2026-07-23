# Démarrer dans le dépôt

Cette page va de l'installation au lancement local de MathALÉA. Elle introduit
uniquement les commandes de terminal et de Git nécessaires pour commencer.

## Prérequis

Installez :

- Git ;
- Node.js `>=22.13` ;
- Corepack, fourni avec les versions récentes de Node.js ;
- un éditeur prenant en charge TypeScript, par exemple Visual Studio Code.

Le dépôt déclare sa version de pnpm dans `package.json`. Le store de dépendances
est configuré dans `pnpm-workspace.yaml` et ne demande aucune option de commande
supplémentaire.

## Se repérer dans un terminal

Un terminal exécute les commandes dans un dossier courant :

```sh
pwd
ls
cd chemin/vers/un/dossier
```

- `pwd` affiche le dossier courant ;
- `ls` affiche son contenu ;
- `cd` change de dossier.

Toutes les commandes suivantes doivent être lancées depuis la racine du dépôt,
le dossier qui contient `package.json`.

## Récupérer le projet

```sh
git clone https://forge.apps.education.fr/coopmaths/mathalea.git
cd mathalea
corepack enable
pnpm install
```

`git clone` crée une copie locale du dépôt. `pnpm install` installe les
dépendances décrites par `package.json` et `pnpm-lock.yaml`.

Vérifiez l'environnement :

```sh
node --version
pnpm --version
git status
```

## Lancer MathALÉA

```sh
pnpm dev
```

Ouvrez ensuite <http://localhost:5173/alea/>. Le terminal reste occupé par le
serveur ; utilisez `Ctrl+C` pour l'arrêter.

Si le port est déjà pris, arrêtez l'autre serveur ou utilisez l'URL indiquée par
Vite.

## Créer une branche

Une branche isole votre modification :

```sh
git switch main
git pull
git switch -c nom-court-de-la-modification
```

Pendant le travail :

```sh
git status
git diff
```

- `git status` liste les fichiers modifiés ;
- `git diff` affiche les changements non indexés.

Ne lancez pas de commande Git que vous ne comprenez pas sur un dépôt contenant
des modifications non sauvegardées.

## Comprendre les fichiers TypeScript

La majorité des exercices sont des fichiers `.ts` dans `src/exercices/`.
TypeScript ajoute des types à JavaScript afin de détecter des erreurs avant
l'exécution.

Dans un exercice, vous rencontrerez surtout :

```ts
import Exercice from '../Exercice'

export const titre = 'Un titre'

export default class MonExercice extends Exercice {
  constructor() {
    super()
  }
}
```

- `import` rend disponible du code défini ailleurs ;
- `export` rend une valeur utilisable par MathALÉA ;
- `class ... extends Exercice` crée un type d'exercice à partir du moteur ;
- `constructor()` initialise ses réglages ;
- `super()` initialise d'abord la classe `Exercice`.

La page [Créer un exercice](creer-un-exercice.md) reprend chaque élément dans un
exemple complet.

## En cas de problème

1. Vérifiez que vous êtes à la racine avec `pwd` et `ls`.
2. Vérifiez les versions avec `node --version` et `pnpm --version`.
3. Relancez `pnpm install` si un module manque.
4. Consultez `git status` avant toute réinstallation ou suppression.

Les workflows Git, build et CI plus avancés sont décrits dans
[Contribuer au moteur](../maintenance-moteur/contribution/workflows.md).
