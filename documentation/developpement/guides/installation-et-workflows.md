# Installation et workflows

Ce guide part d'une machine neuve et va jusqu'aux workflows quotidiens: installer MathALÉA, lancer le site en local, vérifier son environnement, exécuter les tests utiles et résoudre les erreurs fréquentes.

Toutes les commandes `pnpm` de ce dépôt doivent inclure `--pm-on-fail=ignore`.

## Prérequis

Installez avant de cloner le dépôt:

- **Git**, pour récupérer le code et travailler sur des branches.
- **Node.js `>=22.13`**, recommandation sûre pour ce projet. Vite 7 accepte aussi `^20.19.0 || >=22.12.0`, mais le lockfile référence `pnpm@11.8.0`, dont l'engine Node est `>=22.13`.
- **Corepack**, livré avec Node.js sur les installations récentes, pour activer la version de `pnpm` attendue.
- **pnpm 11.8.0**, version déclarée dans `package.json`.
- **Visual Studio Code** ou un autre éditeur TypeScript/Svelte.

Pour les tests de rendu navigateur et d'export PDF, prévoyez aussi:

- les navigateurs Playwright, installables après les dépendances;
- `lualatex` disponible dans le `PATH` pour les tests LaTeX/PDF cités plus bas.

## Vérifier les outils installés

Depuis un terminal:

```sh
git --version
node --version
corepack --version
```

Pour suivre ce guide sans surprise, la version de Node doit être `>=22.13`. Node `20.19.x` et `22.12.x` satisfont le minimum de Vite 7, mais peuvent échouer au moment d'activer ou d'exécuter `pnpm@11.8.0`.

Activez ensuite la version de `pnpm` déclarée par le projet:

```sh
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm --version
```

Si la dernière commande n'affiche pas `11.8.0`, relancez la commande `corepack prepare` ou vérifiez que votre terminal utilise bien le Node.js que vous venez d'installer.

## Cloner le dépôt

Choisissez un dossier de travail, puis clonez MathALÉA depuis la forge:

```sh
git clone https://forge.apps.education.fr/coopmaths/mathalea.git
cd mathalea
```

Vérifiez que vous êtes sur la branche principale et que le dépôt est propre:

```sh
git branch --show-current
git status
```

## Installer les dépendances

L'installation récupère les dépendances npm et plusieurs dépendances Git hébergées sur les forges utilisées par MathALÉA. Une connexion réseau est donc nécessaire.

```sh
pnpm install
```

Si vous prévoyez de lancer les tests e2e ou les captures Playwright:

```sh
pnpm exec playwright install
```

## Lancer MathALÉA en local

Le serveur de développement est défini par le script `dev` de `package.json`. Il reconstruit d'abord les fichiers de référencement des exercices avec `makeJson`, puis démarre Vite.

```sh
pnpm dev
```

Ouvrez ensuite:

```text
http://localhost:5173/alea/
```

Le chemin `/alea/` est important: il vient de la configuration `base: '/alea/'` dans `vite.config.ts`.

Pour arrêter le serveur, revenez au terminal qui l'exécute et appuyez sur `Ctrl+C`.

## Vérifications avant commit

Avant de demander une revue ou d'ouvrir une merge request, lancez au minimum:

```sh
pnpm prebuild-unit-tests
pnpm check
```

Ces deux commandes correspondent aux scripts actuels:

- `prebuild-unit-tests`: lance les tests Vitest de `tests/unit` puis ceux de `src`;
- `check`: lance `svelte-check` avec `tsconfig.json` et une mémoire Node augmentée.

Pour aller plus vite pendant le développement, lancez seulement la partie qui vous concerne:

```sh
pnpm test:unit
pnpm test:src
pnpm check
```

## Tests e2e utiles

Les tests e2e utilisent Vitest et Playwright. Démarrez d'abord le serveur local dans un terminal:

```sh
pnpm dev
```

Le serveur `dev` local écoute sur le port `5173`. En mode `CI=true`, les tests e2e cherchent par défaut un serveur sur le port `80`; il faut donc toujours ajouter `PLAYWRIGHT_SERVER_PORT=5173` quand vous lancez ces tests contre le serveur local standard. Sans `CI=true`, certains tests utilisent le mode local de débogage, avec des pauses en cas d'erreur.

Puis, dans un deuxième terminal, lancez le test voulu:

```sh
CI=true PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:views
CI=true PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:interactivity
CI=true PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:consistency
```

Pour vérifier les erreurs console sur un exercice ou un niveau précis, utilisez `FILE`:

```sh
CI=true PLAYWRIGHT_SERVER_PORT=5173 FILE=src/exercices/6e/6C10.ts pnpm test:exo:file
```

Pour les exports PDF ou LaTeX, vérifiez d'abord que votre machine possède les outils LaTeX nécessaires:

```sh
lualatex --version
```

Puis lancez le ou les tests ciblés:

```sh
CI=true PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:pdfexports
CI=true PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:latex_compile
CI=true PLAYWRIGHT_SERVER_PORT=5173 pnpm test:e2e:latex_breaks
```

Ces tests peuvent être longs. Si votre modification ne touche pas les exports PDF/LaTeX, les tests unitaires, le typecheck et les e2e ciblés suffisent souvent pour une boucle locale.

## Workflows quotidiens

### Reprendre le projet après une absence

```sh
git checkout main
git pull
pnpm install
pnpm prebuild-unit-tests
pnpm check
```

Si `git checkout main` refuse de changer de branche à cause de modifications locales, sauvegardez-les d'abord:

```sh
git status
git stash push -m "travail en cours"
git checkout main
git pull
git checkout votre-branche
git stash pop
```

### Créer une branche de travail

Partez toujours d'un `main` à jour:

```sh
git checkout main
git pull
git checkout -b Prenom-reference-courte-description
```

Exemple:

```sh
git checkout -b Camille-5P12-ratios
```

### Mettre à jour sa branche avec `main`

Avant de fusionner `main`, vérifiez l'état de vos fichiers:

```sh
git status
```

Puis:

```sh
git checkout main
git pull
git checkout votre-branche
git merge main
pnpm install
pnpm prebuild-unit-tests
pnpm check
```

En cas de conflit, ouvrez les fichiers indiqués par Git, gardez la bonne version de chaque bloc, puis terminez:

```sh
git status
git add chemin/du/fichier
git commit
```

### Créer ou modifier un exercice

Pendant la boucle de développement:

```sh
pnpm dev
```

Après une modification de métadonnées, de listes d'exercices ou si le serveur signale un problème de dictionnaire, reconstruisez les fichiers générés:

```sh
pnpm makeJson
```

Pour obtenir un nouvel identifiant d'exercice:

```sh
pnpm getNewUuid
```

Avant de pousser:

```sh
pnpm prebuild-unit-tests
pnpm check
```

### Formater ou corriger automatiquement

Le dépôt fournit des scripts de formatage et de lint. Utilisez-les seulement quand vous acceptez qu'ils modifient plusieurs fichiers.

```sh
pnpm format
pnpm lint
pnpm lintSvelte
```

### Tester une build locale

Pour vérifier que le bundle de production se construit:

```sh
pnpm build
pnpm preview
```

Le script `buildRam` existe pour les builds qui ont besoin d'une mémoire Node plus élevée:

```sh
pnpm buildRam
```

## Erreurs fréquentes d'installation

### `pnpm` n'est pas trouvé

Activez Corepack, puis préparez la version déclarée par le projet:

```sh
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm --version
```

Évitez d'installer `pnpm` globalement avec `sudo`: Corepack limite les conflits de version entre projets.

### La version de `pnpm` n'est pas la bonne

Le dépôt déclare `pnpm@11.8.0` dans `package.json`. Si votre terminal affiche une autre version:

```sh
corepack prepare pnpm@11.8.0 --activate
pnpm --version
```

Fermez puis rouvrez le terminal si l'ancienne version reste affichée.

### Erreur de certificats pendant l'installation

Sur Debian, Ubuntu ou dérivés, une erreur de certificat peut venir du paquet système `ca-certificates`:

```sh
sudo apt-get update
sudo apt-get install --reinstall ca-certificates
pnpm install
```

Sur un réseau filtré, vérifiez aussi le proxy, l'antivirus et l'accès aux forges Git utilisées par les dépendances.

### `Cannot find module`, `vite: command not found` ou dépendance manquante

Réinstallez les dépendances depuis la racine du dépôt:

```sh
pnpm install
```

Si l'erreur arrive juste après un changement de branche ou un `git pull`, c'est souvent qu'une dépendance ou le lockfile a changé.

### Port `5173` déjà utilisé

Arrêtez l'autre serveur avec `Ctrl+C`. Si vous devez garder les deux serveurs, reconstruisez d'abord les fichiers générés puis lancez Vite sur un autre port:

```sh
pnpm makeJson
pnpm exec vite --port 5174
```

L'URL devient alors:

```text
http://localhost:5174/alea/
```

Les tests e2e doivent alors utiliser le même port:

```sh
CI=true PLAYWRIGHT_SERVER_PORT=5174 pnpm test:e2e:views
```

### Les tests Playwright ne trouvent pas de navigateur

Installez les navigateurs attendus:

```sh
pnpm exec playwright install
```

Relancez ensuite le test e2e ciblé.

### Les tests PDF ou LaTeX échouent localement

Ces tests appellent `lualatex` depuis le `PATH`. Vérifiez d'abord:

```sh
lualatex --version
```

Si la commande est introuvable, installez une distribution LaTeX qui fournit `lualatex`, puis rouvrez le terminal. Vérifiez aussi:

- votre distribution LaTeX;
- l'espace disque disponible;
- la possibilité de lancer le même scénario en CI si votre machine locale n'a pas l'environnement PDF complet.

## Dépannage rapide

1. Vérifier l'état Git:

   ```sh
   git status
   ```

2. Vérifier les versions:

   ```sh
   node --version
   pnpm --version
   ```

3. Réinstaller les dépendances:

   ```sh
   pnpm install
   ```

4. Reconstruire les fichiers générés:

   ```sh
   pnpm makeJson
   ```

5. Relancer les vérifications minimales:

   ```sh
   pnpm prebuild-unit-tests
   pnpm check
   ```

Si l'erreur persiste, copiez le message complet, la commande exacte, votre branche, `node --version` et `pnpm --version` dans votre demande d'aide. Cela permet de distinguer un problème d'environnement, de dépendance, de branche ou de code.

## Sources vérifiées

Cette page reprend et actualise les informations utiles de l'ancienne documentation `old-documentation/2.-Documentation-Technique/2.1-Environnement-de-Développement/`, puis les recoupe avec les fichiers actuels `package.json`, `pnpm-lock.yaml`, `vite.config.ts`, `tests/e2e/vitest.config.*.js`, `tests/e2e/tests/pdfexports/pdfexports.test.ts`, `tests/e2e/tests/latex_compile/latex_compile.test.ts`, `tests/e2e/tests/latex_breaks/latex_breaks.test.ts`, `pnpm-workspace.yaml` et `.npmrc`.
