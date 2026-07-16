# Export AMC

Ce guide explique comment rendre un exercice exportable vers Auto Multiple Choice (AMC), depuis le choix du type AMC jusqu'aux vérifications locales. Il complète la référence d'architecture des exercices et le système d'interactivité :

- [architecture des exercices](../reference/architecture-exercices.md) ;
- [système d'interactivité](../reference/systeme-interactivite.md) ;
- [rapports d'exercices](../../tests/rapports-exercices.md).

Les champs actuels à vérifier dans le code sont dans `src/lib/amc/amcTypes.ts`, `src/lib/amc/amcInference.ts`, `src/lib/amc/amcNormalize.ts`, `src/lib/amc/amcRender.ts` et `src/lib/interactif/gestionInteractif.ts`.

## Prérequis

Avant d'ajouter AMC, l'environnement et l'exercice doivent déjà être opérationnels :

- les dépendances du dépôt sont installées ;
- l'exercice est lançable dans l'interface ou par les tests habituels ;
- la commande `pnpm check` est disponible et ne doit pas être remplacée par un contrôle partiel quand le changement touche du TypeScript ou du Svelte ;
- `nouvelleVersion()` remplit les questions et corrections habituelles (`listeQuestions` / `listeCorrections`, ou `question` / `correction` pour un `ExerciceSimple`) ;
- le rendu LaTeX est lisible sans composant navigateur ;
- les réponses attendues sont connues au moment de la génération ;
- si l'exercice est interactif, `autoCorrection` est rempli avec `handleAnswers()` ou les helpers QCM ;
- la correction explique suffisamment la réponse pour être affichée dans le corrigé AMC.

AMC imprime un sujet et corrige des cases ou des zones codées. Un exercice dont la réponse dépend d'un glisser-déposer, d'un clic sur une figure dynamique, d'un tableur ou d'un état JavaScript doit donc fournir une alternative imprimable.

## Choisir le type AMC

Commencer par décider si l'exercice peut être corrigé automatiquement par AMC.

| Situation                                                    | Type conseillé | À prévoir                                                                    |
| ------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------- |
| Une seule réponse numérique, décimale ou fractionnaire       | `AMCNum`       | Une valeur unique et les paramètres de codage                                |
| Une réponse sous forme de puissance `base^exposant`          | `AMCNum`       | `basePuissance`, `exposantPuissance`, `baseNbChiffres`, `exposantNbChiffres` |
| Plusieurs réponses ou sous-réponses numériques indépendantes | `AMCHybride`   | Un bloc `AMCNum` par champ                                                   |
| Un QCM avec une seule bonne réponse                          | `qcmMono`      | Une seule proposition vraie                                                  |
| Un QCM avec plusieurs bonnes réponses                        | `qcmMult`      | Au moins une proposition vraie                                               |
| Réponse rédigée, construction, preuve, figure ou méthode     | `AMCOpen`      | Une zone de réponse et une correction indicative                             |
| Plusieurs sous-questions de types différents                 | `AMCHybride`   | Un énoncé commun et une liste de blocs                                       |

Une puissance reste donc en `AMCNum` quand elle représente une seule réponse mathématique, même si AMC affiche deux zones de codage internes, une pour la base et une pour l'exposant. Utilisez `AMCHybride` quand la question contient réellement plusieurs blocs ou plusieurs sous-réponses indépendantes, par exemple un QCM suivi d'un nombre, ou deux champs qui ont chacun leur propre libellé et leur propre correction.

Ne déclarez pas `AMCNum` si plusieurs réponses différentes doivent être acceptées sans consigne plus stricte. Par exemple, une fraction équivalente, une réponse dans un intervalle, une expression algébrique non unique ou une unité libre doivent être transformées en une réponse AMC unique, ou basculer en `AMCOpen`.

## Déclarer les métadonnées

Ajouter les exports à côté des autres métadonnées de l'exercice :

```ts
export const amcReady = true
export const amcType = 'AMCNum'
```

`amcType` accepte les valeurs suivantes : `AMCNum`, `AMCOpen`, `qcmMono`, `qcmMult`, `AMCHybride`.

Si l'exercice ne doit pas être exporté malgré un type historique déjà présent, utiliser explicitement :

```ts
export const amcReady = false
```

Pour un exercice dont le type varie selon les paramètres, il est possible d'affecter `this.amcType` dans `nouvelleVersion()`, mais il faut alors garantir que la structure AMC générée correspond au type choisi pour chaque version.

## Structures AMC

Un débutant doit retenir cette règle : le rendu AMC lit d'abord `autoCorrectionAMC`. Si ce tableau existe, c'est lui qui est utilisé pour produire le LaTeX AMC. Sinon, certains chemins peuvent retomber sur `autoCorrection`, surtout pour les QCM, mais il ne faut pas compter sur ce fallback pour un exercice officiellement compatible.

| Structure           | Rôle                                                                       |
| ------------------- | -------------------------------------------------------------------------- |
| `autoCorrection`    | Correction interactive HTML et données QCM communes                        |
| `autoCorrectionAMC` | Structure principale consommée par l'export AMC                            |
| `questionsAMC`      | Ancienne structure typée encore remplie par certains exercices historiques |
| `amcConvert()`      | Convertit une entrée legacy `autoCorrectionAMC` vers `questionsAMC`        |

Pour un nouvel exercice, remplissez `autoCorrectionAMC` et vérifiez l'export. `questionsAMC` n'est pas nécessaire dans le chemin de rendu actuel. Appelez `amcConvert()` seulement si vous modifiez un exercice existant qui remplit déjà `questionsAMC`, ou si vous migrez progressivement un vieux modèle qui en dépend. Dans ce cas, la règle est : construire d'abord `this.autoCorrectionAMC[i]`, puis faire `this.questionsAMC[i] = amcConvert(this.autoCorrectionAMC[i])`.

## Cas AMCNum

`AMCNum` est adapté aux réponses numériques que l'élève code dans des cases AMC. La structure attendue côté AMC est une entrée `autoCorrectionAMC[i].reponse` contenant :

- `valeur` : nombre, fraction `{ num, den }` ou valeur convertible ;
- `param` : paramètres de codage AMC.

Les paramètres courants sont :

| Paramètre                                              | Rôle                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------ |
| `digits`                                               | Nombre total de chiffres à coder                             |
| `decimals`                                             | Nombre de chiffres après la virgule                          |
| `signe`                                                | Affiche une case de signe                                    |
| `approx`                                               | Tolérance acceptée par AMC                                   |
| `aussiCorrect`                                         | Autre valeur exacte acceptée                                 |
| `digitsNum`, `digitsDen`                               | Chiffres du numérateur et du dénominateur pour les fractions |
| `exposantNbChiffres`, `exposantSigne`                  | Codage d'un exposant en notation scientifique                |
| `basePuissance`, `exposantPuissance`, `baseNbChiffres` | Codage d'une puissance en deux blocs                         |
| `vertical`, `tpoint`                                   | Présentation des cases AMC                                   |

### Exercice simple à une réponse

Pour un `ExerciceSimple` qui définit `this.reponse`, MathALÉA sait construire une partie de la structure AMC pendant le rendu AMC. C'est le cas le plus court :

```ts
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

export default class MonExercice extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.optionsDeComparaison = { nombreDecimalSeulement: true }
  }

  nouvelleVersion() {
    const a = randint(2, 9)
    this.reponse = a * 5
    this.question = `Calculer $${a}\\times 5$.`
    this.correction = `$${a}\\times 5=${this.reponse}$.`
  }
}
```

Ce patron convient seulement si la réponse est un nombre ou une fraction simple. Si le rapport `AMCNum` signale une correction manquante, ajoutez une structure `autoCorrectionAMC` explicite.

### Exercice classique avec `handleAnswers()`

Dans un exercice à plusieurs questions, gardez l'interactivité HTML avec `handleAnswers()` puis ajoutez les données AMC dans le contexte AMC :

```ts
import { context } from '../../modules/context'
import { handleAnswers } from '../../lib/interactif/gestionInteractif'

export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

// Dans nouvelleVersion(), pour la question i.
const reponse = resultat
const texte = `Calculer $${expression}$.`

handleAnswers(
  this,
  i,
  { reponse: { value: reponse } },
  { formatInteractif: 'mathlive', digits: 4, decimals: 1, signe: true },
)

if (context.isAmc) {
  this.autoCorrectionAMC[i] = {
    enonce: texte,
    reponse: {
      valeur: reponse,
      param: { digits: 4, decimals: 1, signe: true, approx: 0 },
    },
  }
}
```

`handleAnswers()` alimente `autoCorrection` pour le HTML. `autoCorrectionAMC` sécurise le rendu AMC et le rapport `AMCNum`.

### Fractions

Pour une fraction imposée, donnez une valeur fractionnaire :

```ts
this.autoCorrectionAMC[i] = {
  enonce: texte,
  reponse: {
    valeur: { num: numerateur, den: denominateur },
    param: { digitsNum: 2, digitsDen: 2, signe: false },
  },
}
```

Si l'interactivité accepte des fractions équivalentes, AMC ne sait pas corriger toutes les écritures possibles avec une seule zone. Modifiez alors la consigne AMC, par exemple "Donner la fraction irréductible", et fournissez cette fraction précise.

### Intervalles et valeurs approchées

Pour une réponse acceptée dans un intervalle, choisissez une valeur centrale et une tolérance :

```ts
const milieu = (borneMin + borneMax) / 2
const tolerance = (borneMax - borneMin) / 2

this.autoCorrectionAMC[i] = {
  enonce: `${texte}<br>Donner une valeur décimale.`,
  reponse: {
    valeur: milieu,
    param: { digits: 4, decimals: 2, signe: milieu < 0, approx: tolerance },
  },
}
```

Pour un intervalle strict, réduisez légèrement la tolérance afin de ne pas accepter les bornes.

### Puissances

Une réponse attendue sous forme de puissance reste un `AMCNum`. Les paramètres dédiés font générer deux zones numériques, mais la question reste une seule question numérique AMC.

```ts
if (context.isAmc) {
  this.autoCorrectionAMC[i] = {
    enonce: texte,
    reponse: {
      valeur: base ** exposant,
      param: {
        basePuissance: base,
        exposantPuissance: exposant,
        baseNbChiffres: 1,
        exposantNbChiffres: 2,
        signe: false,
      },
    },
  }
}
```

Voir aussi `src/exercices/can/3e/can3C01.ts` pour un exercice existant qui garde `amcType = 'AMCNum'` et configure `basePuissance` / `exposantPuissance`.

## Cas QCM

Un QCM AMC utilise `autoCorrection[i].propositions`, comme le QCM interactif.

Extrait partiel à adapter dans `nouvelleVersion()` ; les imports nécessaires sont inclus pour éviter un copier-coller incomplet :

```ts
import { propositionsQcm } from '../../lib/interactif/qcm'
import { context } from '../../modules/context'

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

const correction = estVrai
  ? 'La phrase est vraie car ...'
  : 'La phrase est fausse car ...'

this.autoCorrection[i] = {
  enonce: texte,
  propositions: [
    { texte: 'Vrai', statut: estVrai },
    { texte: 'Faux', statut: !estVrai },
  ],
  options: { ordered: true, radio: true, correction },
}

const monQcm = propositionsQcm(this, i)
if (!context.isAmc) {
  texte += monQcm.texte
}
```

Règles à respecter :

- `qcmMono` : exactement une proposition doit avoir `statut: true` ;
- `qcmMult` : une ou plusieurs propositions peuvent avoir `statut: true` ;
- `options.ordered: true` conserve l'ordre des propositions ;
- `options.vertical: true` force une présentation verticale ;
- `options.lastChoice` garde les dernières propositions à la fin, utile pour "Aucune réponse" ou "Je ne sais pas" ;
- `options.correction` doit porter la correction détaillée à afficher dans `\explain{...}`.

Pour un QCM, ne vous reposez pas sur `listeCorrections[i]` pour la correction AMC détaillée : le template QCM lit `options.correction`. `listeCorrections[i]` reste utile pour les autres sorties, mais la sortie AMC est fiable seulement si `options.correction` est renseigné, directement ou via un helper qui le copie explicitement.

En contexte AMC, `propositionsQcm()` ne doit pas ajouter de HTML à l'énoncé. Gardez donc le test `if (!context.isAmc)` autour du texte interactif.

## Cas AMCOpen

`AMCOpen` imprime une zone que l'enseignant corrige ensuite. C'est le bon choix pour les constructions, justifications, textes libres, figures interactives, glisser-déposer et exercices impossibles à ramener à une réponse unique.

```ts
export const amcReady = true
export const amcType = 'AMCOpen'
```

Si le fallback automatique ne suffit pas, fournissez explicitement une proposition :

```ts
if (context.isAmc) {
  this.autoCorrectionAMC[i] = {
    enonce: texte,
    propositions: [
      {
        texte: correction,
        statut: 3,
        sanscadre: false,
        pointilles: true,
      },
    ],
  }
}
```

`statut` correspond au nombre de lignes de notation dans la zone ouverte. `sanscadre: true` supprime le cadre. `pointilles: true` affiche des lignes pointillées.

## Cas AMCHybride

`AMCHybride` regroupe plusieurs blocs AMC sous un même énoncé. Utilisez-le quand une question demande plusieurs champs, par exemple un numérateur et un dénominateur séparés, ou un QCM suivi d'une réponse numérique.

```ts
import { amcConvert } from '../../../lib/amc/amcBuilders'

export const amcReady = true
export const amcType = 'AMCHybride'

if (context.isAmc) {
  this.autoCorrectionAMC[0] = {
    enonce: this.question,
    options: { multicols: true },
    propositions: [
      {
        type: 'AMCNum',
        propositions: [
          {
            texte: this.correction,
            reponse: {
              texte: 'Numérateur',
              valeur: numerateur,
              param: { digits: 2, decimals: 0, signe: false, approx: 0 },
            },
          },
        ],
      },
      {
        type: 'AMCNum',
        propositions: [
          {
            reponse: {
              texte: 'Dénominateur',
              valeur: denominateur,
              param: { digits: 2, decimals: 0, signe: false, approx: 0 },
            },
          },
        ],
      },
    ],
  }

  this.questionsAMC[0] = amcConvert(this.autoCorrectionAMC[0])
}
```

Les blocs internes peuvent être `AMCNum`, `AMCOpen`, `qcmMono` ou `qcmMult`.

## Adapter l'énoncé pour AMC

Un bon export AMC doit rester autonome sur papier :

- remplacez les consignes HTML ("cliquer", "déplacer", "saisir dans le champ") par une consigne imprimable ;
- évitez les boutons, menus, listes déroulantes et champs MathLive dans l'énoncé AMC ;
- conservez les figures seulement si elles sont rendues en LaTeX ou en image imprimable ;
- ajoutez les unités dans l'énoncé si AMC ne doit coder que le nombre ;
- pour une réponse non unique, écrivez la contrainte qui rend la réponse unique : "fraction irréductible", "arrondir au centième", "donner la valeur entière", etc.

Utilisez `context.isAmc` pour isoler les variantes AMC :

```ts
if (context.isAmc) {
  texte = `${texte}<br>Donner la réponse sous forme de fraction irréductible.`
}
```

## Vérifier localement

Pour un fichier modifié, lancez d'abord le rapport ciblé AMCNum si l'exercice est `AMCNum` :

```bash
AMCNUM_REPORT=1 CHANGED_FILES='src/exercices/2e/2G34-3.ts' pnpm vitest src/lib/amc/report-amcnum.test.ts --run
```

Ce rapport ne valide que les exercices `amcType='AMCNum'`. Les QCM, `AMCOpen` et `AMCHybride` doivent être vérifiés par l'aperçu AMC et par l'export LaTeX/PDF.

Pour un QCM ou un exercice interactif, vérifiez aussi le rapport interactif :

```bash
INTERACTIF_REPORT=1 CHANGED_FILES='src/exercices/2e/2G34-3.ts' pnpm vitest src/lib/amc/report-interactif.test.ts --run
```

Si le changement touche des helpers partagés ou plusieurs familles d'exercices, lancez les tests de référence :

```bash
pnpm prebuild-unit-tests
pnpm check
```

Pour contrôler le rendu final, exportez l'exercice depuis l'interface en mode AMC ou lancez le test LaTeX/PDF pertinent si le changement touche le rendu :

```bash
pnpm test:e2e:pdfexports
```

### Vérification dans l'interface

1. Lancer le serveur local :

```bash
pnpm dev
```

1. Ouvrir l'interface AMC, par exemple [http://localhost:5173/?v=amc](http://localhost:5173/?v=amc).
2. Dans le référentiel à gauche, rechercher l'exercice modifié puis cliquer dessus pour l'ajouter à la "Zone centrale de composition AMC".
3. Vérifier la carte d'aperçu : l'énoncé doit être lisible, les QCM doivent afficher les choix, les `AMCNum` doivent afficher les cases numériques attendues, les `AMCOpen` doivent afficher une zone de réponse.
4. Ouvrir le panneau "LaTeX AMC généré en temps réel".
5. Cliquer sur "Télécharger le .tex". Le navigateur télécharge un fichier nommé `amc-${seed}.tex`, par exemple `amc-ePxF1.tex`.

Un export correct contient un document LaTeX AMC complet, avec des blocs `\element{...}` et des questions AMC (`question`, `questionmult` ou `questionmultx`). Selon le type, on doit voir `\bonne` / `\mauvaise` pour un QCM, `\AMCnumericChoices` pour un `AMCNum`, ou `\notation` pour un `AMCOpen`. Il ne doit pas rester de balises ou traces HTML interactives comme `<input>`, `<button>`, des composants MathLive, `undefined` ou `[object Object]`.

Le rapport AMCNum génère `reports/amcnum-report.md` en cas de problème.

## Limites courantes

- AMC corrige une valeur numérique codée, pas une infinité d'écritures mathématiques équivalentes.
- Les comparateurs interactifs (`fonctionComparaison`, options `fractionEgale`, `calculFormel`, `unite`, etc.) ne sont pas tous transposables dans AMC.
- Les champs multiples `multiMathfield`, `fillInTheBlank` à plusieurs trous et `tableauMathlive` demandent souvent un `AMCHybride` explicite.
- `cliqueFigure`, `dnd`, `svg-selection`, `tableur`, `apiGeom`, `MetaInteractif2d` et `custom` doivent généralement devenir `AMCOpen` ou être réécrits en QCM/AMCNum imprimable.
- Les réponses textuelles libres doivent être en `AMCOpen`, sauf si elles sont transformées en QCM.
- Donner automatiquement le nombre exact de chiffres peut aider l'élève. Fixez `digits`, `decimals`, `digitsNum` ou `digitsDen` si cette indication est trop forte.

## Dépannage

| Symptôme                                                                    | Cause probable                                                                | Correction                                                                                                                      |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `autoCorrectionAMC-manquante-ou-incomplete` dans `reports/amcnum-report.md` | `amcType='AMCNum'` sans `autoCorrectionAMC[i].reponse.valeur` ou sans `param` | Ajouter une structure `autoCorrectionAMC` en contexte AMC, ou vérifier que `handleAnswers()` reçoit une valeur numérique simple |
| `autoCorrection-html-absente`                                               | L'exercice interactif ne remplit pas `autoCorrection`                         | Appeler `handleAnswers()` ou construire correctement `this.autoCorrection[i]`                                                   |
| QCM mono avec plusieurs bonnes réponses                                     | Plusieurs propositions ont `statut: true`                                     | Passer en `qcmMult` ou corriger les statuts                                                                                     |
| QCM AMC sans correction détaillée                                           | La correction n'est pas transmise aux options QCM                             | Renseigner `options.correction`, car le template QCM AMC lit ce champ                                                           |
| AMCNum accepte une mauvaise précision                                       | `approx`, `digits` ou `decimals` mal choisis                                  | Fixer explicitement les paramètres de codage                                                                                    |
| Fraction attendue mais mauvais affichage AMC                                | Valeur fournie comme texte non reconnu ou chiffres non adaptés                | Utiliser `{ num, den }` et préciser `digitsNum` / `digitsDen`                                                                   |
| L'export affiche des éléments HTML                                          | L'énoncé interactif est réutilisé en AMC                                      | Encadrer l'ajout HTML par `if (!context.isAmc)` et fournir un énoncé AMC imprimable                                             |
| Une figure interactive disparaît ou devient inutilisable                    | Le composant n'a pas de rendu papier                                          | Fournir une figure statique ou choisir `AMCOpen`                                                                                |

Quand un exercice échoue seulement en contexte AMC, cherchez d'abord les champs réellement générés :

```bash
rg -n "amcReady|amcType|autoCorrectionAMC|questionsAMC|handleAnswers|propositionsQcm" src/exercices/chemin/de/lexercice.ts
```

Puis comparez avec un exercice court du même type, par exemple un `AMCNum` simple dans `src/exercices/can/6e/can6C02.ts`, un QCM dans `src/exercices/can/6e/can6M01.ts`, ou un `AMCHybride` dans `src/exercices/can/6e/can6C15.ts`.
