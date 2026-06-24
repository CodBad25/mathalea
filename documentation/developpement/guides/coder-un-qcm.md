# Coder un QCM

Ce guide explique le cas le plus courant : ajouter un QCM à un exercice classique qui hérite de `Exercice`. Les helpers et contrats cités ont été vérifiés dans `src/lib/interactif/qcm.ts`, `src/lib/types.ts`, `src/lib/interactif/qcmBuilder.ts`, `src/lib/interactif/questionListeDeroulante.ts`, ainsi que dans des exercices réels comme `src/exercices/can/6e/can6M01.ts`, `src/exercices/can/6e/can6M02.ts` et `src/exercices/6e/6G0-2.ts`.

Pour le cycle général d'un exercice, lire aussi [coder un exercice classique](coder-un-exercice-classique.md). Pour le pipeline de vérification, voir [système d'interactivité](../reference/systeme-interactivite.md).

## Pré-requis

Un exercice QCM doit avoir :

- un fichier dans `src/exercices/`, au bon niveau de dossier ;
- `export const interactifReady = true` ;
- `export const interactifType = 'qcm'` ;
- une entrée `this.autoCorrection[i]` pour chaque question ;
- un appel unique à `propositionsQcm(this, i)` après avoir rempli `autoCorrection[i]` ;
- `listeQuestionsToContenu(this)` à la fin de `nouvelleVersion()` pour un exercice classique.

Pour AMC, ajouter seulement si l'exercice est réellement vérifié en export papier :

```ts
export const amcReady = true
export const amcType = 'qcmMono' // une seule bonne réponse
// ou
export const amcType = 'qcmMult' // plusieurs bonnes réponses possibles
```

## Squelette minimal

Exemple pour un fichier situé dans `src/exercices/6e/`. Adapter les chemins d'import si le fichier est dans un autre dossier.

```ts
import { propositionsQcm } from '../../lib/interactif/qcm'
import { context } from '../../modules/context'
import { listeQuestionsToContenu, randint } from '../../modules/outils'
import Exercice from '../Exercice'

export const titre = 'Choisir la bonne réponse'
export const interactifReady = true
export const interactifType = 'qcm'
export const uuid = 'a-remplacer'
export const refs = {
  'fr-fr': ['6X00-0'],
  'fr-ch': [],
}

export default class ChoisirLaBonneReponse extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 3
  }

  nouvelleVersion() {
    for (let i = 0, cpt = 0; i < this.nbQuestions && cpt < 50; ) {
      const a = randint(2, 9)
      const b = randint(2, 9)
      let texte = `Calculer $${a}+${b}$.`
      const bonneReponse = a + b

      this.autoCorrection[i] = {
        enonce: texte,
        propositions: [
          { texte: `$${bonneReponse}$`, statut: true },
          { texte: `$${bonneReponse + 1}$`, statut: false },
          { texte: `$${bonneReponse - 1}$`, statut: false },
        ],
        options: { radio: true },
      }

      const qcm = propositionsQcm(this, i)
      if (!context.isAmc) {
        texte += qcm.texte
      }

      const texteCorr = `$${a}+${b}=${bonneReponse}$.`

      if (this.questionJamaisPosee(i, a, b)) {
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

Points importants :

- remplacer `uuid = 'a-remplacer'` par un UUID généré avec la commande indiquée dans [coder un exercice classique](coder-un-exercice-classique.md) :

```sh
pnpm getNewUuid
```

- `refs['fr-fr']` contient l'identifiant de l'exercice côté interface. C'est cette valeur qui sert dans l'URL de prévisualisation `?id=...` ;
- `enonce` sert notamment aux exports et à la synchronisation de correction.
- `propositionsQcm(this, i)` fabrique le rendu HTML ou LaTeX à partir de `autoCorrection[i]`.
- `context.isAmc` évite d'ajouter le rendu HTML/LaTeX classique dans la sortie AMC.
- `questionJamaisPosee()` doit recevoir les valeurs qui caractérisent vraiment la question.

## Déclarer les propositions

Chaque proposition est un objet de type :

```ts
{
  texte: '$4$',
  statut: true,
  feedback: 'Message facultatif'
}
```

`texte` est le contenu affiché à côté de la case ou du bouton radio. Il peut contenir du HTML ou du LaTeX entre `$...$`.

`statut` indique si la proposition est correcte. Utiliser `true` pour une bonne réponse et `false` pour un distracteur.

`feedback` est facultatif. Dans la vérification interactive actuelle, le feedback des propositions cochées est regroupé dans le message global de la question.

Pour une réponse unique :

```ts
options: { radio: true }
```

Pour plusieurs bonnes réponses :

```ts
options: { radio: false, vertical: true }
```

Dans ce cas, toutes les propositions dont `statut` vaut `true` doivent être cochées, et aucune proposition fausse ne doit l'être.

## Options utiles

Les options de `autoCorrection[i].options` sont définies par `ParamForQcmInteractif` dans `src/lib/types.ts`.

| Option | Effet |
| --- | --- |
| `radio: true` | Utilise des boutons radio. À réserver aux QCM avec une seule bonne réponse. |
| `ordered: true` | Conserve l'ordre déclaré des propositions. Sans cette option, les propositions peuvent être mélangées. |
| `vertical: true` | Affiche une proposition par ligne en HTML. |
| `lastChoice: n` | Mélange seulement les propositions avant cet index ; utile pour garder une proposition finale fixe. |
| `correction: '...'` | Texte de correction utilisé lors de la synchronisation vers AMC. |

Exemples :

```ts
options: { radio: true, ordered: true }
```

```ts
options: { vertical: true, lastChoice: 3 }
```

Le helper élimine aussi les propositions de même `texte` quand il détecte des doublons. Il vaut mieux éviter les doublons dès la génération, surtout si les distracteurs sont calculés.

## Ajouter le QCM à la question

Toujours stocker le résultat de `propositionsQcm()` dans une variable et le réutiliser.

```ts
const qcm = propositionsQcm(this, i)
texte += qcm.texte
texteCorr += qcm.texteCorr
```

Pour obtenir un rendu par lettres au lieu des cases dans certains contextes, passer une option au helper :

```ts
const qcm = propositionsQcm(this, i, { style: '', format: 'lettre' })
```

Ne pas faire ceci :

```ts
texte += propositionsQcm(this, i).texte
texteCorr += propositionsQcm(this, i).texteCorr
```

Chaque appel peut mélanger les propositions. Deux appels pour la même question peuvent donc créer un ordre différent entre l'énoncé, la correction et les identifiants interactifs.

## Correction

La correction peut être une correction rédigée classique :

```ts
const texteCorr = `$${a}+${b}=${bonneReponse}$.`
```

Elle peut aussi inclure le QCM corrigé :

```ts
const qcm = propositionsQcm(this, i)
texte += qcm.texte
const texteCorr = `$${a}+${b}=${bonneReponse}$.<br>${qcm.texteCorr}`
```

Dans beaucoup d'exercices, la correction rédigée suffit. Utiliser `qcm.texteCorr` quand le corrigé doit montrer explicitement quelles cases étaient vraies ou fausses.

## Rendu non interactif

Un QCM ne doit pas dépendre uniquement du navigateur interactif.

Deux approches sont courantes :

1. Réutiliser `propositionsQcm(this, i)` : en LaTeX non HTML, le helper produit un environnement `qcmprop` avec les bonnes réponses dans `texteCorr`.
2. Fournir une consigne non interactive plus naturelle : par exemple `Entourer le plus grand nombre : ...`, comme dans certains exercices CAN.

Exemple avec alternative non interactive :

```ts
const qcm = propositionsQcm(this, i)
if (this.interactif) {
  texte = 'Cocher la bonne réponse : ' + qcm.texte
} else {
  texte = `Entourer la bonne réponse : $${bonneReponse}$ \\qquad $${bonneReponse + 1}$ \\qquad $${bonneReponse - 1}$`
}
```

Si l'exercice doit aussi sortir en AMC, garder `if (!context.isAmc)` autour de l'ajout de `qcm.texte`.

## Gestion interactive

Pour un QCM manuel, ne pas utiliser `handleAnswers()`. Le contrat interactif est `this.autoCorrection[i].propositions`.

La vérification est assurée par `verifQuestionQcm()` dans `src/lib/interactif/qcm.ts`. Elle :

- lit les cases ou boutons associés à la question ;
- sauvegarde les choix dans `exercice.answers` ;
- marque la question `OK` si toutes les bonnes réponses sont cochées et aucune mauvaise ne l'est ;
- affiche le score via le bouton de validation de l'exercice QCM.

Les métadonnées `interactifReady` et `interactifType = 'qcm'` sont donc indispensables pour que l'exercice soit reconnu comme QCM interactif.

## Variante avec `buildQcmForExercise()`

Pour un exercice classique, `buildQcmForExercise()` évite une partie du câblage manuel. Il remplit `autoCorrection`, appelle `propositionsQcm()` et retourne la question et la correction.

```ts
import { buildQcmForExercise } from '../../lib/interactif/qcmBuilder'

const qcmData = buildQcmForExercise(this, i, {
  question: texte,
  correction: texteCorr,
  propositions: [
    { texte: '$2x$', statut: true, correction: 'Correct.' },
    { texte: '$x^2$', statut: false, correction: 'On confond ici fonction et dérivée.' },
    { texte: '$2$', statut: false, correction: 'Ce serait la dérivée de $2x$.' },
  ],
  options: { radio: true },
})

this.listeQuestions[i] = qcmData.question
this.listeCorrections[i] = qcmData.correction
```

Cette variante est utile quand chaque proposition a sa correction détaillée, ou quand il faut ajouter automatiquement un message du type "La bonne réponse est...".

## Variante `ExerciceSimple`

Pour un exercice simple qui possède déjà une réponse libre, une version QCM optionnelle peut être générée avec :

```ts
this.versionQcmDisponible = true
this.reponse = bonneReponse
this.distracteurs = [mauvaise1, mauvaise2, mauvaise3]
this.versionQcmOptions = { radio: true }
```

Le moteur construit alors le QCM quand `versionQcm` est activé. Cette voie est adaptée aux exercices CAN ou aux exercices très courts qui peuvent exister à la fois en saisie libre et en QCM.

Attention : ces quatre propriétés ne suffisent pas à elles seules à afficher le QCM. Le runtime doit activer `versionQcm`. Le comportement actuel est dans `src/lib/mathalea.ts` : le paramètre URL `qcm=1` met `exercice.versionQcm = true` pour les `ExerciceSimple`. `src/exercices/MetaExerciceCan.ts` construit ensuite le QCM seulement si `versionQcm`, `versionQcmDisponible` et les distracteurs sont présents.

Pour tester une version QCM optionnelle :

```txt
http://localhost:5173/alea/?id=REF_EXERCICE&i=1&qcm=1
```

Sans `qcm=1`, l'exercice peut rester en version saisie libre même si `versionQcmDisponible` vaut `true`.

## Liste déroulante vers QCM

Quand un exercice utilise une liste déroulante mais qu'un rendu QCM est nécessaire, notamment pour un rendu non interactif ou une réflexion AMC, utiliser `listeDeroulanteToQcm()` depuis `src/lib/interactif/questionListeDeroulante.ts`.

```ts
listeDeroulanteToQcm(this, i, choix, bonneReponse, {
  ordered: true,
  vertical: true,
  radio: true,
})
const qcm = propositionsQcm(this, i)
```

La fonction remplit `this.autoCorrection[i].propositions` à partir des choix. La bonne réponse doit faire partie des valeurs de la liste.

## AMC

Pour un QCM simple, déclarer :

```ts
export const amcReady = true
export const amcType = 'qcmMono'
```

Pour un QCM avec plusieurs bonnes réponses possibles :

```ts
export const amcReady = true
export const amcType = 'qcmMult'
```

Points de vigilance :

- `qcmMono` doit avoir une seule bonne réponse par question.
- `qcmMult` accepte plusieurs bonnes réponses, mais l'élève doit cocher exactement l'ensemble attendu.
- L'énoncé dans `autoCorrection[i].enonce` doit être autonome et imprimable.
- Éviter les propositions qui dépendent d'un composant navigateur.
- Ne pas ajouter `qcm.texte` dans `context.isAmc`, car l'export AMC produit son propre rendu.
- Si le QCM vient d'une liste déroulante, vérifier l'export : l'inférence AMC des listes déroulantes reste plus fragile qu'un QCM déclaré directement.

Le système sait aussi inférer `qcmMono` ou `qcmMult` à partir d'un exercice interactif QCM dans certains chemins d'export, mais pour un exercice officiellement prêt AMC, garder une déclaration explicite et tester le rendu.

## Prévisualiser et tester

Pendant le développement :

1. Lancer le serveur local :

```sh
pnpm dev
```

1. Ouvrir l'exercice avec son identifiant `refs['fr-fr']` :

```txt
http://localhost:5173/alea/?id=REF_EXERCICE&i=1
```

ou avec son UUID :

```txt
http://localhost:5173/alea/?uuid=UUID_GENERE&i=1
```

1. Tester au moins une bonne réponse et une mauvaise réponse.
2. Vérifier le rendu non interactif ou LaTeX si l'exercice doit être imprimé.
3. Vérifier AMC si `amcReady` est déclaré.

Pour une validation ciblée du rapport interactif sur un exercice modifié :

```sh
INTERACTIF_REPORT=1 CHANGED_FILES='src/exercices/6e/mon-qcm.ts' pnpm vitest src/lib/amc/report-interactif.test.ts --run
```

Remplacer `src/exercices/6e/mon-qcm.ts` par le chemin réel du fichier d'exercice. Le rapport généré est documenté dans [rapports d'exercices](../../tests/rapports-exercices.md).

Avant commit :

```sh
pnpm prebuild-unit-tests
```

Si des fichiers TypeScript ou Svelte sont modifiés :

```sh
pnpm check
```

Pour les rapports d'exercices interactifs et AMC, voir [rapports d'exercices](../../tests/rapports-exercices.md).

## Dépannage

`propositionsQcm a reçu une liste de propositions undefined` : `this.autoCorrection[i]` n'a pas été rempli avant l'appel à `propositionsQcm(this, i)`.

`propositionsQcm a reçu une liste de propositions vide` : le tableau `propositions` est vide. Vérifier la génération des distracteurs.

`propositionsQcm a reçu une liste de propositions de taille 1` : un QCM doit avoir au moins deux propositions.

La bonne réponse affichée ne correspond pas à la correction : vérifier que `propositionsQcm(this, i)` n'est appelé qu'une seule fois pour cette question.

Les propositions changent d'ordre alors qu'elles doivent rester fixes : ajouter `options: { ordered: true }`.

Une proposition comme "Aucune de ces réponses" ou "Je ne sais pas" ne reste pas en dernier : utiliser `lastChoice` ou `buildQcmForExercise()` avec l'option `dontKnow`.

Les boutons radio permettent plusieurs réponses attendues : ne pas utiliser `radio: true` si plusieurs propositions ont `statut: true`.

Le QCM fonctionne en HTML mais pas en validation interactive : vérifier `export const interactifType = 'qcm'` et que chaque question a bien une entrée `autoCorrection[i]`.

L'export AMC est incohérent : vérifier `amcType`, `autoCorrection[i].enonce`, le nombre de bonnes réponses et l'absence de rendu navigateur dans les propositions.
