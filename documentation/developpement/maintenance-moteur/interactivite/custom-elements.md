# Créer un custom element (convention MathALÉA)

Ce guide impose le pattern à suivre pour tout nouveau custom element du projet.

Objectif : avoir une API homogène pour l'injection HTML, la mise à jour d'affichage, la sérialisation de la réponse élève et la désactivation de l'interactivité.

## Classe de base

Toute nouvelle classe doit étendre `MathaleaCustomElement` dans `src/lib/customElements/MathaleaCustomElement.ts`.

L'implémentation du custom element doit être placée dans `src/lib/customElements/`. Les helpers métier qui appellent `create(...)` ou encapsulent le composant doivent prendre place dans le même fichier que le composant.

Exemple de signature minimale :

```ts
export class MonElement extends MathaleaCustomElement {
  static readonly elementTag = 'mon-element'
}
```

## Règles obligatoires

1. Héritage

- La classe étend `MathaleaCustomElement`.
- Le tag est déclaré via `static readonly elementTag`.
- Le tag est en kebab-case (suite de mots en minuscules où les espaces sont remplacés par des tirets - ).
- Le tag sert de référence pour interactifType et formatInteractif.
- Le fichier de la classe se trouve dans `src/lib/customElements/`.

2. Méthode statique create

- `create(...)` retourne la chaîne à injecter dans l'énoncé : HTML en contexte HTML, ou LaTeX/chaîne vide en contexte non HTML selon les capacités du composant.
- `create(...)` prend un seul argument objet.
- Cet objet contient au minimum :
  - `id?: string`
  - `numeroExercice?: number`
  - `questionIndex?: number`
  - puis les options spécifiques du composant.
- Si `id` est fourni, il est utilisé tel quel.
- Sinon, l'id est construit avec la convention : `${elementTag}Ex${numeroExercice}Q${questionIndex}`.
- Les attributs doivent être passés en camelCase ; la base les convertit en kebab-case.
- Si le composant possède une sortie imprimable (`renderLatex()`), sa méthode `create(...)` doit gérer explicitement le contexte non HTML : instancier l'élément en mémoire, initialiser son état métier depuis les options, puis retourner `renderLatex()`.
- Si le composant possède une sortie Typst native (`renderTypst()`), `create(...)` doit traiter `context.isTypst` avant le cas LaTeX et retourner `<mathalea-typst>${codeTypst}</mathalea-typst>`. Ce marqueur est inséré tel quel par `htmlToTypst()`.
- Si le composant n'a pas de sortie non HTML exploitable, le comportement par défaut de `MathaleaCustomElement.create(...)` suffit : il retourne une chaîne vide hors HTML.

### Cahier des charges des sorties

Un custom element pédagogique doit choisir sa sortie selon le contexte global :

- `context.isHtml === true` et `context.isTypst === false` : `create(...)`
  retourne un élément HTML. Celui-ci peut être interactif ou figé selon
  `interactivityOn`.
- `context.isTypst === true` : `create(...)` retourne un marqueur
  `<mathalea-typst>...</mathalea-typst>` contenant le Typst pur produit par
  `renderTypst()`. La vue Typst régénère les exercices avec `context.isHtml`
  encore vrai, donc ce cas doit être testé avant la branche HTML standard.
- `context.isHtml === false` : `create(...)` retourne le code LaTeX équivalent,
  produit par `renderLatex()`, ou une chaîne vide si le composant n'a pas de
  rendu imprimable.

Pour les composants d'évaluation, `interactivityOn` pilote aussi la sortie
imprimable :

- `interactivityOn === true` : version énoncé/évaluation, avec les zones à
  compléter ou le support graphique vide attendu.
- `interactivityOn === false` : version correction complète, avec données,
  figure et éléments d'identification nécessaires.

3. Helper d'instanciation côté exercice

- Chaque composant expose une fonction helper (par exemple `addXxx(...)`) servant d'interface stable pour les exercices.
- Signature attendue du helper :
  - 1er argument : `exercice` (instance `IExercice`)
  - 2e argument : `questionIndex` (un nombre entier)
  - 3e argument : objet d'options du composant (incluant éventuellement `id`).
- Le helper appelle `create(...)` en transmettant `numeroExercice: exercice.numeroExercice` et `questionIndex`.
- Le type du 3e argument doit être exporté (ex. `XxxOptions`) pour un usage typé dans les exercices.

Exemple :

```ts
export type DemiDroiteInteractiveOptions = {
  x0?: number
  initialT?: number
  minT?: number
  maxT?: number
  partsCount?: number
  axisMin?: number
  showNegative?: boolean
  showEqualityMarks?: boolean
  multiplePoints?: boolean
  interactivityOn?: boolean
  points?: ValeurPoint[]
  id?: string
  pointsColor?: string
}

export function demiDroiteInteractive(
  exercice: IExercice,
  questionIndex: number,
  options?: DemiDroiteInteractiveOptions,
): string {
  return DemiDroiteInteractiveElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice,
    questionIndex,
  })
}
```

Quand un composant sait produire une sortie LaTeX statique, ne pas court-circuiter
le helper avec `if (!context.isHtml) return ''`. Le helper doit appeler
`create(...)` dans tous les contextes et laisser la classe décider de la sortie.

Exemple de helper pour un composant avec `renderLatex()` :

```ts
export function addDiagramXxxAssessment(
  exercice: IExercice,
  questionIndex: number,
  options: DiagramXxxAssessmentOptions,
): string {
  exercice.autoCorrection[questionIndex] ??= {}
  exercice.autoCorrection[questionIndex].formatInteractif =
    DiagramXxxAssessmentElement.elementTag
  return DiagramXxxAssessmentElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice ?? 0,
    questionIndex,
  })
}
```

4. Méthode render contextuelle

- En HTML : `render()` met à jour le DOM du composant.
- En LaTeX : `render()` retourne la variante LaTeX si elle existe, sinon une chaîne vide.
- Pour la partie LaTeX, implémenter `renderLatex()` quand nécessaire.
- En Typst : si le composant ne peut pas être rejoué par `htmlToTypst()`, implémenter
  `renderTypst()` et faire retourner à `create(...)` un marqueur
  `<mathalea-typst>...</mathalea-typst>` quand `context.isTypst` est vrai.
- En contexte non HTML, aucun `connectedCallback()` n'est exécuté : `create(...)`
  doit donc préparer directement l'état nécessaire à `renderLatex()`.
- Ne pas faire dépendre `renderLatex()` du shadow DOM, d'attributs hydratés par le
  navigateur, ni d'éléments HTML internes. Il doit fonctionner à partir de l'état
  métier du composant.
- Même règle pour `renderTypst()` : produire du Typst pur à partir de l'état métier,
  sans dépendre du shadow DOM.
- Si `interactivityOn === true`, la sortie LaTeX doit représenter la version
  imprimable de l'évaluation, avec les zones à compléter pertinentes. Si
  `interactivityOn === false`, elle doit représenter la version statique/correction
  complète.

5. Propriété value

- Le getter `value` retourne l'état métier du composant (réponse élève).
- Le setter `value` réinjecte un état (correction figée, restitution Capytale, reprise de session).
- Le type exact dépend du composant, mais la propriété s'appelle toujours `value`.

Convention recommandée pour éviter les divergences getter/setter :

- Implémenter une méthode publique `update(state)` qui applique l'état restaurable et déclenche le `redraw`/`render`.
- Faire déléguer le setter `value` vers `update(state)`.
- Faire retourner par le getter `value` toutes les propriétés nécessaires à une restauration fidèle par `update(state)`.
- Ne pas piloter `update(state)` avec des champs dérivés/recalculés au rendu (exemples : ratio formaté, booléen de seuil, longueurs recalculées). Ces champs peuvent être présents dans le getter pour l'affichage/diagnostic, mais doivent être recalculés après `update`.
- En cas d'évolution de schéma de données (`targetAB` renommé, etc.), lire l'ancien et le nouveau nom côté parsing pendant une période de compatibilité, et n'écrire que le nouveau nom côté production.

6. Propriété interactivityOn

- `interactivityOn` permet de rendre le composant inerte sans perdre son affichage.
- Le composant doit appliquer cet état à ses contrôles (inputs, boutons, drag, listeners actifs).
- Exemples d'utilisation : dans la fonction de vérification pour ne plus permettre de modifications ultérieures ; dans `mathaleaWriteStudentPreviousAnswers()` pour figer la copie de l'élève dans Capytale.

7. Lifecycle DOM

- `connectedCallback()` installe le composant et appelle `render()`.
- `disconnectedCallback()` nettoie les listeners et ressources externes.

8. Enregistrement

- Ne pas appeler `customElements.define(...)` directement : utiliser `registerMathaleaCustomElement(MaClasse)` (exporté par `src/lib/customElements/MathaleaCustomElement.ts`).
- Ce helper définit l'élément dans le navigateur (de façon idempotente) et l'ajoute au registre `mathaleaCustomElementsRegistry`, qui permet les traitements génériques (corrections CAN notamment).

## Intégration dans l'interactivité de MathALÉA

Afin que le custom element soit correctement pris en charge par le système d'interactivité, il y a plusieurs étapes à réaliser :

- Ajouter dans `src/lib/types.ts` le tag à l'union `InteractivityType`.
- Ajouter le tag à `listOfCustomElements` dans `src/lib/customElements/MathaleaCustomElement.ts`.
- Enregistrer la classe avec `registerMathaleaCustomElement(MaClasse)`.
- La méthode statique `verifQuestion(exercice,questionIndex)` doit être implémentée dans l'élément. Elle correspond à la méthode correctionInteractive(i) de la classe Exercice lorsque celui-ci a un interactifType = 'custom'. Il suffit donc d'en transposer la logique : vérification, hydratation de exercice.answers, du span#resultatCheckEx et du div#feedbackEx...
- Le retour de la fonction doit être : `{
isOk: boolean
feedback: string
score: { nbBonnesReponses: number; nbReponses: number }
}`. comme pour les callbacks de corrections.
- La méthode statique `pointsMaxQuestion(exercice, questionIndex)` retourne le `score.nbReponses` que `verifQuestion()` produira si l'élève répond juste partout. Elle vaut 1 par défaut : ne la surcharger que si une question du composant peut rapporter plusieurs points (plusieurs champs, barème spécifique). Elle est appelée avant toute saisie pour afficher le barème dans les paramètres de l'exercice, voir [le barème d'un exercice interactif](systeme-interactivite.md#barème-dun-exercice-interactif).
- Le dispatch par le registre est générique : `exerciceInteractif()`, `gestionCan.ts`, `Can.svelte` et `QuestionParPage.svelte` consultent `listOfCustomElements` puis `mathaleaCustomElementsRegistry` pour appeler `verifQuestion()`. Il n'y a donc plus de branche spécifique à ajouter dans ces fichiers pour un custom element correctement enregistré.
- Les formats historiques MathLive `mathlive`, `fillInTheBlank`, `tableauMathlive` et `texte` sont normalisés vers leurs tags (`mathalea-mathfield`, `fill-in-the-blank`, `tableau-mathlive`, `mathalea-textfield`) par `mathliveCompatibleToCustomElementFormat()` dans `src/lib/types.ts`. Ne pas ajouter de nouveau cas historique sans raison de compatibilité forte : préférer le tag du custom element comme `formatInteractif`.
- Dans les exercices utilisant ces éléments, `handleAnswers()` doit être utilisé pour renseigner `exercice.autoCorrection[questionIndex].valeur`, qui sera lu par `verifQuestion()` afin d'obtenir la réponse attendue de l'élément pour cette question. Si la réponse attendue doit être un objet, la stocker dans un format que `verifQuestion()` sait relire explicitement. De même, la `value` correspondant à la réponse de l'élève doit rester compatible avec la restauration via `mathaleaWriteStudentPreviousAnswers()`.

Les exercices concernés peuvent exporter `interactifType` avec le tag du composant si tout l'exercice utilise ce format. Quand plusieurs formats cohabitent, le routage fiable est celui de `autoCorrection[questionIndex].formatInteractif`, généralement posé par `handleAnswers()`.

## Affichage dans les corrections de la CAN

La vue des corrections de la CAN (`Solutions.svelte`, via `src/lib/components/canSolutions.ts`) traite les customElements enregistrés de façon générique grâce à deux hooks statiques de `MathaleaCustomElement`, à surcharger si besoin :

- `static formatStudentAnswer(rawAnswer: string): string` : formate la réponse brute de l'élève (telle que stockée dans `exercice.answers`) pour la ligne « Réponse donnée : ... ». Par défaut, la valeur brute est affichée telle quelle (suffisant pour `liste-deroulante`). À surcharger si la valeur stockée n'est pas lisible directement (ex. `InteractiveClock` stocke un JSON `{hour, minute, second}`).
- `static stripFromQuestionHtml(questionHtml: string): string` : transforme le HTML de la question pour la liste des corrections. Par défaut, le composant reste visible mais son attribut `interactivity-on` est forcé à `false` (composant désactivé, non interactif). À surcharger pour retirer le composant de l'énoncé (ex. `InteractiveClock`).

Un customElement enregistré via `registerMathaleaCustomElement` est donc pris en charge par les corrections CAN sans modifier `Solutions.svelte` ni `canSolutions.ts`.

## Cas spécial : élément technique non visible

Si un composant doit être créé comme objet DOM technique (tests, vérifications hors affichage), ne pas détourner `create(...)`.

Utiliser une méthode dédiée, par exemple :

- `createEltToAppendToDom(...)`

Ce nommage évite de mélanger :

- API HTML standard (`create`) ;
- API technique d'instanciation DOM interne.

Exemple d'usage : `MySpreadsheetElement` instancie des feuilles de calcul techniques dans le DOM (invisibilisées) pour des vérifications hors affichage.

Un custom element peut aussi être purement technique et ne porter aucune
réponse élève. Dans ce cas, il ne doit pas être ajouté à `InteractivityType` ni
à `listOfCustomElements` : il utilise seulement le cycle de vie DOM pour
installer et nettoyer des listeners liés à un rendu. Exemple :
`cube-iso-interaction`, injecté par `mathalea2d()` quand `updateCubeIso()`
enregistre une projection 3D manipulable.

Un composant technique qui doit **changer les réglages de son exercice** (donc
provoquer une régénération et une mise à jour de l'URL) émet l'événement DOM
`settings`, avec le même `detail` que le panneau de réglages (`sup`, `sup2`,
`nbQuestions`…) :

```ts
this.dispatchEvent(
  new CustomEvent('settings', {
    detail: { sup: nouvelleValeur },
    bubbles: true,
    composed: true,
  }),
)
```

`ExerciceMathaleaVueProf` écoute cet événement sur l'`<article>` de l'énoncé et
le traite avec `handleNewSettings()`. Ne pas écrire directement dans
`exercicesParams` : l'exercice ne serait pas régénéré. Exemple :
`questions-de-cours-selecteur`, voir
[Questions de cours](../architecture/questions-de-cours.md).

Pour remplacer un écouteur global `exercicesAffiches` qui ne sert qu'à attendre
que le HTML d'un exercice soit dans le DOM, utiliser `mathalea-dom-ready`. Le
composant reçoit un nom d'action et un payload sérialisable, puis exécute le
callback enregistré à son `connectedCallback()`. Si le callback retourne une
fonction, elle est appelée au `disconnectedCallback()`.

Attention au cycle de régénération d'un énoncé (« Nouvel énoncé ») : les noms
d'action sont le plus souvent stables (ils ne dépendent que des numéros
d'exercice et de question), et `nouvelleVersion()` réinscrit le nouveau callback
**avant** que Svelte ne retire l'ancien élément du DOM. Une fonction de nettoyage
qui appelle `unregisterCallback(action)` désinscrirait donc l'inscription toute
fraîche. `DomReadyActionElement.unregisterCallback()` ignore pour cette raison
les désinscriptions obsolètes : elle ne supprime l'entrée que si le callback
inscrit est bien celui dont le nettoyage est en cours (ou celui passé en second
argument, à utiliser quand la désinscription a lieu hors de ce nettoyage — voir
`destroy()` dans `src/lib/figureApigeom.ts`).

## Cas avancés

## Cas spécifique : diagrammes (outil prof vs évaluation)

Pour les diagrammes, distinguer explicitement deux usages.

- Outil auteur/prof (construction libre) : `diagram-builder`.
  - Usage recommandé : préparation d'énoncés, de corrections, d'exemples visuels.
  - Non recommandé pour évaluer directement un élève sur une compétence de construction.
- Outils d'évaluation (contraints) : un composant par scénario métier.
  - Exemple : `diagram-pie-assessment` pour un exercice d'angles de secteurs.
  - Exemple : `diagram-bar-assessment` pour un exercice de hauteurs de bâtons avec unité.

Principe pédagogique : en mode évaluation, l'élève ne doit pas pouvoir "obtenir"
le graphique complet par simple saisie des données de l'énoncé. Le composant doit
imposer la variable didactique attendue (angles, hauteurs, échelles, etc.).

- MySpreadsheetElement (tableur) : [architecture du tableur](tableur.md)
- BlocklyEditor : [architecture de Scratch et Blockly](scratch-blockly.md)
- RelierEtiquettesElement (composant à trois rendus : HTML interactif, LaTeX et Typst) : [relier les étiquettes](relier-etiquettes.md)

## Checklist avant merge

- Le composant étend `MathaleaCustomElement`.
- `elementTag` est défini.
- L'enregistrement passe par `registerMathaleaCustomElement(...)`.
- `create(...)` existe et est utilisée par les helpers d'injection.
- Le helper `addXxx(...)` (ou équivalent) expose la signature `(exercice, questionIndex, options)` avec un type d'options exporté.
- `value` (getter/setter) est implémentée et testée.
- `value` est symétrique avec `update(...)` (restauration depuis l'objet renvoyé par le getter).
- `interactivityOn` est respectée.
- `connectedCallback()` et `disconnectedCallback()` sont propres.
- Le rendu non HTML est défini (`renderLatex()` ou chaîne vide assumée).
- Le rendu Typst est défini quand le composant HTML ne peut pas être converti
  automatiquement (`renderTypst()` + marqueur `<mathalea-typst>` dans
  `create(...)`).
- L'affichage dans les corrections CAN est correct (`formatStudentAnswer` et `stripFromQuestionHtml` surchargées si les valeurs par défaut ne conviennent pas).
- `pointsMaxQuestion` est surchargée si une question du composant peut rapporter plus d'un point.

## Migration d'un composant existant

Ordre recommandé :

1. Faire hériter la classe de `MathaleaCustomElement`.
2. Ajouter `elementTag`.
3. Introduire `create(...)` et rebrancher le helper historique (`addXxx`) dessus.
4. Déplacer la classe dans `src/lib/customElements/` si elle vivait ailleurs.
5. Uniformiser `value` et `interactivityOn`.
6. Ajouter le nettoyage dans `disconnectedCallback()`.
7. Vérifier que le tag est présent dans `InteractivityType`, `listOfCustomElements` et le registre.
8. Vérifier que le composant est traité correctement dans `exercice.answers`, dans les corrections CAN et dans la reprise des réponses élèves.

### Migration d'un helper historique

Quand le composant remplace un ancien helper déjà utilisé dans de nombreux exercices, conserver le helper comme API stable et le faire appeler `create(...)`.

Principes appliqués aux wrappers MathLive :

- le wrapper reçoit l'id conventionnel du custom element, par exemple `mathalea-mathfieldEx0Q0` ;
- l'élément interne conserve l'id ou les sélecteurs legacy attendus par les exercices existants, par exemple `champTexteEx0Q0` ou `table#tabMathliveEx0Q0` ;
- la vérification terminale vit dans `verifQuestion()` du wrapper ;
- si une vérification très spécifique est nécessaire, le helper peut accepter une callback optionnelle et la transmettre au wrapper.

## Fichiers utiles

- Base : `src/lib/customElements/MathaleaCustomElement.ts`
- Interactivité : [système d'interactivité](systeme-interactivite.md)
- Recettes côté exercice : [formats interactifs spécialisés](../../auteurs-exercices/complements/formats-interactifs.md)
