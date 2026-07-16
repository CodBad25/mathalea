# Coder un exercice classique

Un exercice classique est un fichier TypeScript de `src/exercices/` qui hérite de `Exercice`, génère ses questions dans `nouvelleVersion()`, remplit `listeQuestions` et `listeCorrections`, puis appelle `listeQuestionsToContenu(this)`.

Ce guide décrit le chemin le plus direct pour créer un exercice génératif non statique, avec une sortie HTML et LaTeX lisible. Pour les champs de saisie, compléter ensuite avec [rendre un exercice interactif](rendre-un-exercice-interactif.md). Pour un QCM, utiliser [coder un QCM](coder-un-qcm.md).

## Prérequis

- Avoir installé les dépendances : `pnpm install`.
- Savoir lancer l'application : `pnpm dev`.
- Avoir identifié la référence de l'exercice, par exemple `6N0A-1`, et le niveau cible.
- Partir d'un exercice proche dans `src/exercices/`, pas d'un ancien modèle d'archive.

La structure globale des exercices est décrite dans [architecture des exercices](../reference/architecture-exercices.md). Les commandes de base sont rappelées dans [installation et workflows](installation-et-workflows.md).

## 1. Choisir l'emplacement et le nom

Les exercices génératifs sont dans `src/exercices/`. Choisir le sous-dossier du niveau :

- `src/exercices/6e/` pour un exercice de sixième ;
- `src/exercices/5e/`, `4e/`, `3e/`, `2e/`, `1e/`, `TEx/`, `TSpe/` ou `TT/` selon le niveau ;
- un sous-dossier spécialisé seulement si le domaine en contient déjà un.

Nommer le fichier avec la référence MathALÉA et l'extension `.ts`, par exemple :

```text
src/exercices/6e/REF_EXERCICE.ts
```

`REF_EXERCICE` est un placeholder : le remplacer par la vraie référence choisie pour le nouvel exercice. Ne pas copier un identifiant d'exercice existant.

Si la référence existe déjà, ajouter un suffixe cohérent. Vérifier avant de créer :

```sh
rg "REF_EXERCICE" src/exercices
```

## 2. Créer les métadonnées

Un exercice doit exporter au minimum son titre, son `uuid`, ses références, puis une classe par défaut.

Pour obtenir un `uuid` disponible, lancer :

```sh
pnpm getNewUuid
```

Le script affiche une ligne de ce type :

```ts
export const uuid = 'xxxxx'
```

Copier exactement la ligne générée et remplacer la ligne placeholder `export const uuid = 'UUID_GENERE'` du squelette. Ne pas inventer un `uuid` à la main.

Squelette minimal pour un fichier placé directement dans `src/exercices/6e/` :

```ts
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Ajouter 9 à un entier'
export const dateDePublication = '23/06/2026'

export const uuid = 'UUID_GENERE'

export const refs = {
  'fr-fr': ['REF_EXERCICE'],
  'fr-ch': [],
}

/**
 * Ajouter 9 à un entier à deux chiffres.
 * @author Prénom Nom
 */
export default class AjouterNeuf extends Exercice {
  constructor() {
    super()
    this.consigne = 'Calculer.'
    this.nbQuestions = 5
    this.spacing = 2
  }

  nouvelleVersion() {
    for (
      let i = 0, texte: string, texteCorr: string, a: number, cpt = 0;
      i < this.nbQuestions && cpt < 50;
    ) {
      a = randint(10, 99)
      texte = `$${a} + 9 = \\ldots$`
      texteCorr = `$${a} + 9 = ${miseEnEvidence(a + 9)}$`

      if (this.questionJamaisPosee(i, a)) {
        this.listeQuestions[i] = texte
        this.listeCorrections[i] = texteCorr
        i++
      }
      cpt++
    }

    listeQuestionsToContenu(this)
  }
}
```

Adapter les chemins d'import si le fichier est plus profond. Par exemple, depuis `src/exercices/can/6e/`, les imports remontent souvent avec `../../../`.

Après avoir créé ou renommé le fichier, reconstruire les index qui alimentent les menus et les correspondances `uuid`/référence :

```sh
pnpm makeJson
```

Si `pnpm dev` tournait déjà avant la création du fichier, le redémarrer. Sinon le nouvel exercice peut manquer dans `uuidsToUrl` ou `refToUuid`.

## 3. Comprendre le rôle de chaque bloc

Les imports chargent seulement ce qui est utilisé. Dans le squelette :

- `Exercice` fournit les propriétés communes : `consigne`, `nbQuestions`, `listeQuestions`, `listeCorrections`, `questionJamaisPosee()`, etc.
- `randint(min, max, exclusions?)` tire un entier aléatoire.
- `listeQuestionsToContenu(this)` transforme les listes de questions et corrections en contenu affichable selon le contexte.
- `miseEnEvidence()` met en valeur le résultat dans la correction.

Les exports placés avant la classe sont lus par les menus, les tests et les exports :

- `titre` est le titre affiché dans MathALÉA.
- `dateDePublication` et `dateDeModifImportante` servent aux informations de publication.
- `uuid` identifie l'exercice dans les URLs et les tests.
- `refs` rattache le fichier aux référentiels, au minimum avec `'fr-fr'`.

Le constructeur fixe les valeurs par défaut. Les plus courantes sont :

- `this.consigne` : phrase affichée au-dessus des questions ;
- `this.nbQuestions` : nombre de questions par défaut ;
- `this.spacing` et `this.spacingCorr` : espacement des questions et corrections ;
- `this.sup`, `this.sup2`, etc. : paramètres personnalisables si l'exercice en a besoin.

## 4. Générer les questions dans `nouvelleVersion()`

La méthode `nouvelleVersion()` est appelée à chaque nouvelle graine ou changement de paramètre. Elle doit construire une version complète de l'exercice.

Ordre conseillé pour chaque question :

1. Tirer les données aléatoires.
2. Calculer la réponse attendue.
3. Construire l'énoncé dans `texte`.
4. Construire la correction dans `texteCorr`.
5. Vérifier l'unicité avec `questionJamaisPosee()`.
6. Stocker `texte` dans `this.listeQuestions[i]`.
7. Stocker `texteCorr` dans `this.listeCorrections[i]`.
8. Incrémenter `i` seulement si la question est acceptée.

Le compteur `cpt` évite une boucle infinie quand l'espace de questions possibles est trop petit :

```ts
for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
  // génération

  if (this.questionJamaisPosee(i, parametreImportant)) {
    this.listeQuestions[i] = texte
    this.listeCorrections[i] = texteCorr
    i++
  }

  cpt++
}
```

Ne pas incrémenter `i` avant `questionJamaisPosee()`. Sinon un doublon laisse un trou dans les listes.

## 5. Choisir les bons critères d'unicité

`questionJamaisPosee(i, ...)` doit recevoir les paramètres qui rendent réellement deux questions différentes.

Exemples :

```ts
this.questionJamaisPosee(i, a)
this.questionJamaisPosee(i, a, b)
this.questionJamaisPosee(i, typeDeQuestion, xA, yA)
```

Éviter :

- de passer seulement `i`, car toutes les générations seraient considérées comme nouvelles ;
- de passer un texte complet si quelques espaces ou balises peuvent changer sans modifier la question mathématique ;
- de passer trop peu de paramètres, ce qui peut rejeter des questions pourtant différentes ;
- de demander plus de questions que le nombre de variantes possibles.

Si la boucle atteint souvent `cpt = 50` sans produire toutes les questions, élargir les tirages ou réduire `this.nbQuestions`.

## 6. Gérer plusieurs types de questions

Pour mélanger plusieurs familles de questions, construire d'abord une liste de types. Le helper `combinaisonListes()` existe dans `src/lib/outils/arrayOutils.ts`.

```ts
import { combinaisonListes } from '../../lib/outils/arrayOutils'

// ...

const listeTypeQuestions = combinaisonListes(['somme', 'difference'], this.nbQuestions)

for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
  const type = listeTypeQuestions[i]

  switch (type) {
    case 'somme':
      // construire une somme
      break
    case 'difference':
      // construire une différence
      break
  }
}
```

Si le choix doit venir d'un formulaire utilisateur, utiliser `gestionnaireFormulaireTexte()` depuis `src/modules/outils.ts` et déclarer le formulaire dans le constructeur. Copier la structure d'un exercice récent proche avant d'ajouter ce niveau de paramétrage.

### Dans un exercice de type simple

Dans un exercice héritant de `ExerciceSimple`, `nouvelleVersion()` est appelée une fois **par question** par `mathaleaHandleExerciceSimple()` (`src/lib/mathalea.ts`), avec une graine différente à chaque appel : un `choice()` ou un `randint()` y est donc retiré indépendamment à chaque question, sans contrôle possible de la répartition globale (rien n'empêche que les 10 questions tombent toutes sur le même cas). `ExerciceSimple` (`src/exercices/ExerciceSimple.ts`) fournit trois méthodes pour contrôler ce hasard entre les questions d'une même version : `quotaChoice()`, `quotaRandint()`, et la primitive générique `fromQuestionPlan()`.

#### `quotaChoice(key, values)`

Équivalent, pour un exercice simple, du `combinaisonListes()` des exercices classiques. Comme `choice()`, mais garantit une répartition équilibrée entre les questions :

```ts
nouvelleVersion() {
  // Répartition équilibrée garantie : sur 10 questions, exactement 5 seront faciles
  const niveau = this.quotaChoice('niveau', ['facile', 'difficile'])
  // Pondération : répéter une valeur (ici 2 questions faciles sur 3)
  // const niveau = this.quotaChoice('niveau', ['facile', 'facile', 'difficile'])
  // ...
}
```

#### `quotaRandint(key, min, max, listeAEviter?)`

Variante de `quotaChoice()` pour un entier tiré entre `min` et `max` (bornes incluses), avec le même paramètre `listeAEviter` que `randint()`. Sur 9 questions avec `quotaRandint('n', 1, 3)`, chacune des valeurs 1, 2 et 3 revient exactement 3 fois :

```ts
nouvelleVersion() {
  const denominateur = this.quotaRandint('denominateur', 2, 5)
  // ...
}
```

#### `fromQuestionPlan(key, buildPlan)` — la primitive commune

`quotaChoice()` et `quotaRandint()` sont tous deux des raccourcis autour de `fromQuestionPlan()`, à utiliser directement pour un plan sur mesure (règle de répartition personnalisée, ou plusieurs variables liées entre elles qu'on ne peut pas tirer indépendamment).

Fonctionnement : au premier appel pour une `key` donnée, `buildPlan(nbQuestions)` est invoqué pour construire un tableau de `nbQuestions` valeurs (une par question de la version). Ce plan est mémorisé sur l'exercice (dans `this.tiragesParQuestion`) et réutilisé pour toutes les questions suivantes de la même version : chaque appel renvoie simplement la valeur planifiée pour la question en cours, déduite de `listeQuestions.length` (le nombre de questions déjà validées). Une `key` différente donne un plan indépendant, ce qui permet de contrôler plusieurs variables séparément (voir l'exemple `quotaChoice('niveau', ...)` / `quotaChoice('operation', ...)` dans les tests unitaires `tests/unit/exerciceSimpleQuestionPlan.test.ts`).

Deux points de comportement à connaître :

- Une question retirée pour cause de doublon (`questionJamaisPosee()` renvoie `false`) fait rappeler `nouvelleVersion()` sans faire avancer `listeQuestions` : l'exercice retombe donc sur la **même** valeur planifiée plutôt que de consommer la suivante du plan.
- Le plan est vidé par `reinit()` à chaque nouvelle version : deux versions avec la même graine produisent le même plan (déterminisme garanti), une autre graine peut en tirer un autre plan — mais la règle de répartition imposée par `buildPlan` reste garantie dans tous les cas.

Exemple de plan sur mesure — variables liées, ici une opération dont le sens dépend du niveau :

```ts
nouvelleVersion() {
  const { niveau, operation } = this.fromQuestionPlan('tirage', (n) => {
    const plan = combinaisonListes(
      [
        { niveau: 'facile', operation: '+' },
        { niveau: 'difficile', operation: '-' },
      ],
      n,
    )
    return plan
  })
  // ...
}
```

Pour importer `combinaisonListes()` ou `shuffle()` dans un plan personnalisé, ils viennent de `src/lib/outils/arrayOutils.ts`, comme pour les exercices classiques (§6 ci-dessus).

## 7. Prévoir HTML, LaTeX et correction

Un exercice classique doit rester compréhensible :

- en HTML dans l'aperçu ;
- en HTML avec correction affichée ;
- en LaTeX ou PDF ;
- sans interactivité.

Règles pratiques :

- Encadrer les formules avec `$...$`.
- Doubler les antislashs LaTeX dans les chaînes TypeScript : `\\dfrac`, `\\ldots`, `\\times`.
- Utiliser `<br>` pour un saut de ligne simple dans les textes d'exercices.
- Ne pas dépendre d'un composant navigateur pour expliquer la question.
- Si le rendu HTML et LaTeX doivent différer, vérifier `context.isHtml` depuis `src/modules/context.ts` et fournir une alternative imprimable.

Exemple :

```ts
import { context } from '../../modules/context'

texte = context.isHtml
  ? 'Observer la figure ci-dessous.<br>'
  : 'Observer la figure ci-dessous. '
```

Ne mettre `this.pasDeVersionLatex = true` que si une version LaTeX est réellement impossible.

### `context.isTypst`

L'export [vue Typst](../reference/vue-typst.md) régénère l'exercice avec `context.isHtml = true` **et** `context.isTypst = true` : il réutilise le rendu HTML (pas le rendu LaTeX) puis le convertit en Typst via `htmlToTypst`. Un test `context.isHtml` seul ne distingue donc pas un vrai navigateur d'un export Typst.

Cela pose problème pour tout ce qui dépend de JavaScript exécuté après le montage dans le DOM (composant interactif, web component qui se redessine via `connectedCallback`, etc.) : `htmlToTypst` ne lit que le HTML tel que produit par `nouvelleVersion()`, sans exécuter ce JavaScript. Deux cas concrets rencontrés :

- `tableauColonneLigne()` (`src/lib/2d/tableau.ts`) génère, quand `context.isHtml` est vrai, un tableau MathLive interactif (`AddTabDbleEntryMathlive`) non convertible en Typst — et qui, en prime, n'a pas la même hauteur de ligne que la version LaTeX (qui applique `\arraystretch`, utile pour les fractions). Corrigé en testant `context.isHtml && !context.isTypst` pour ne prendre la branche interactive qu'en vrai navigateur ; l'export Typst prend alors la branche LaTeX, déjà convertie par le pipeline (voir [Tableaux](../reference/vue-typst.md#tableaux)).
- `createScratchSimulatorElement()` (simulateur Scratch) accepte un paramètre `insertProgramme` : à `false`, il ne pose qu'un bouton « Exécuter » et régénère le contenu par JS au clic — vide pour l'export Typst tant que rien n'a été cliqué. Corrigé en passant `context.isTypst` (au lieu de `false`) à ce paramètre : le balisage scratchblocks statique est alors présent dans le HTML source, que le pipeline Typst sait détecter et convertir en SVG (voir `renderScratchBlocksToSvg` dans `latexToTypst.ts`).

Règle pratique : dès qu'une branche `context.isHtml` insère un composant interactif (custom element, bouton qui déclenche du rendu JS différé, contenu qui n'existe qu'après une interaction utilisateur), vérifier `context.isHtml && !context.isTypst` avant d'y entrer, ou fournir/activer explicitement un rendu statique équivalent quand `context.isTypst` est vrai. Un simple `context.isHtml`, lui, reste correct pour distinguer HTML de LaTeX classique (PDF/AMC) : `context.isTypst` ne sert qu'à isoler le cas particulier de l'export Typst à l'intérieur du HTML.

## 8. Ajouter une interactivité ensuite

Ne commencez pas par l'interactivité. Validez d'abord l'exercice classique : énoncés, corrections, unicité, rendu LaTeX.

Ensuite :

- pour un champ MathLive, suivre [rendre un exercice interactif](rendre-un-exercice-interactif.md), avec `handleAnswers()` et les helpers de `src/lib/interactif/` ;
- pour un QCM, suivre [coder un QCM](coder-un-qcm.md), avec `propositionsQcm()` et `autoCorrection`.

Un exercice interactif doit toujours conserver une version non interactive lisible, sauf cas explicitement spécialisé.

## 9. Tester localement et faire des aperçus

Pendant le développement :

```sh
pnpm dev
```

Ouvrir ensuite l'exercice avec son identifiant ou son `uuid`, par exemple :

```text
http://localhost:5173/alea/?id=REF_EXERCICE
http://localhost:5173/alea/?uuid=UUID_GENERE
```

Tester plusieurs graines avec le bouton de nouvelle version ou avec le paramètre `alea` dans l'URL. Vérifier au minimum :

- le nombre de questions demandé ;
- l'absence de doublons évidents ;
- l'affichage de la correction ;
- le rendu LaTeX ;
- les paramètres `s`, `s2`, etc. si l'exercice en déclare.

Pour générer des captures et parcourir plusieurs vues :

```sh
id=REF_EXERCICE pnpm testExercice
```

Les captures sont écrites dans `screenshots/REF_EXERCICE/`.

`testExercice` vérifie aussi des vues LaTeX et appelle `lualatex`. La compilation LaTeX nécessite donc une installation LaTeX locale avec la commande `lualatex` disponible dans le `PATH`. Si seules les vues LaTeX échouent, vérifier d'abord l'environnement avant de conclure à un bug de l'exercice.

Pour cibler les erreurs console d'un exercice :

```sh
FILE=src/exercices/6e/REF_EXERCICE.ts pnpm test:exo:file
```

Avant commit, lancer les vérifications de référence :

```sh
pnpm prebuild-unit-tests
pnpm check
```

`prebuild-unit-tests` lance les tests unitaires et les tests `src`. `check` lance le typecheck Svelte/TypeScript.

## 10. Dépannage fréquent

L'exercice n'apparaît pas dans le menu :

- vérifier `export const uuid` ;
- vérifier `export const refs` ;
- relancer `pnpm dev`, qui exécute `makeJson`.

La page affiche une erreur d'import :

- vérifier le nombre de `../` dans les imports ;
- comparer avec un exercice placé dans le même dossier ;
- retirer les imports non utilisés.

Les questions ne s'affichent pas :

- vérifier que `listeQuestionsToContenu(this)` est appelé à la fin de `nouvelleVersion()`;
- vérifier que `this.listeQuestions[i]` et `this.listeCorrections[i]` sont remplis ;
- vérifier que `i++` est dans le bloc accepté par `questionJamaisPosee()`.

Le nombre de questions est trop faible :

- l'unicité rejette trop de tirages ;
- `this.nbQuestions` est supérieur au nombre de variantes possibles ;
- les paramètres passés à `questionJamaisPosee()` sont trop larges ou trop constants ;
- le compteur `cpt` atteint 50.

La correction affiche `undefined` ou `NaN` :

- initialiser `texte` et `texteCorr` dans chaque branche du `switch` ;
- vérifier les divisions par zéro ;
- vérifier les variables déclarées mais non affectées ;
- tester plusieurs graines.

Le LaTeX ne compile pas ou s'affiche mal :

- vérifier les antislashs doublés dans les chaînes ;
- éviter le HTML complexe dans une formule LaTeX ;
- prévoir une branche avec `context.isHtml` si le rendu HTML utilise une balise impossible à exporter ;
- tester la vue LaTeX avec `testExercice`.

L'interactivité fonctionne mais la version papier est vide :

- conserver l'énoncé mathématique hors du champ interactif ;
- ajouter une phrase ou des pointillés dans la version non interactive ;
- relire [rendre un exercice interactif](rendre-un-exercice-interactif.md).

## Sources vérifiées

Cette page a été réécrite à partir de l'archive `old-documentation/2.-Documentation-Technique/2.2-Création-d'Exercices/2.2.1-Fondamentaux.md` et de sa sous-page `Coder-un-exercice-classique.md`, puis vérifiée contre le code actuel :

- `src/exercices/Exercice.ts` pour les propriétés et `questionJamaisPosee()`;
- `src/modules/outils.ts` pour `listeQuestionsToContenu()`, `randint()` et `gestionnaireFormulaireTexte()`;
- `src/lib/outils/arrayOutils.ts` pour `combinaisonListes()`;
- des exercices récents de `src/exercices/6e/`, `src/exercices/5e/` et `src/exercices/2e/`;
- `package.json` pour les commandes `dev`, `getNewUuid`, `testExercice`, `test:exo:file`, `prebuild-unit-tests` et `check`.
