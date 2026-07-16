# Créer un custom element (convention MathALÉA)

Ce guide impose le pattern à suivre pour tout nouveau custom element du projet.

Objectif : avoir une API homogène pour l'injection HTML, la mise à jour d'affichage, la sérialisation de la réponse élève et la désactivation de l'interactivité.

## Classe de base

Toute nouvelle classe doit étendre `MathaleaCustomElement` dans `src/lib/customElements/MathaleaCustomElement.ts`.

L'implémentation du custom element doit être placée dans `src/lib/customElements/`. Les helpers métier qui appellent `create(...)` ou encapsulent le composant peuvent rester dans un autre dossier (par exemple `src/lib/interactif/`) si cela clarifie l'API utilisée par les exercices.

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
- Le fichier de la classe se trouve dans `src/lib/customElements/`.

2. Méthode statique create

- `create(...)` retourne la chaîne HTML à injecter dans l'énoncé.
- `create(...)` prend un seul argument objet.
- Cet objet contient au minimum :
  - `id?: string`
  - `numeroExercice?: number`
  - `questionIndex?: number`
  - puis les options spécifiques du composant.
- Si `id` est fourni, il est utilisé tel quel.
- Sinon, l'id est construit avec la convention : `${elementTag}Ex${numeroExercice}Q${questionIndex}`.
- Les attributs doivent être passés en camelCase ; la base les convertit en kebab-case.

3. Helper d'instanciation côté exercice

- Chaque composant expose une fonction helper (par exemple `addXxx(...)`) servant d'interface stable pour les exercices.
- Signature attendue du helper :
  - 1er argument : `exercice` (instance `IExercice`)
  - 2e argument : `questionIndex`
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
  showNegative?: boolean
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
  if (!context.isHtml) return ''
  return DemiDroiteInteractiveElement.create({
    ...options,
    numeroExercice: exercice.numeroExercice,
    questionIndex,
  })
}
```

4. Méthode render contextuelle

- En HTML : `render()` met à jour le DOM du composant.
- En LaTeX : `render()` retourne la variante LaTeX si elle existe, sinon une chaîne vide.
- Pour la partie LaTeX, implémenter `renderLatex()` quand nécessaire.

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

## Affichage dans les corrections de la CAN

La vue des corrections de la CAN (`Solutions.svelte`, via `src/lib/components/canSolutions.ts`) traite les customElements enregistrés de façon générique grâce à deux hooks statiques de `MathaleaCustomElement`, à surcharger si besoin :

- `static formatStudentAnswer(rawAnswer: string): string` : formate la réponse brute de l'élève (telle que stockée dans `exercice.answers`) pour la ligne « Réponse donnée : ... ». Par défaut, la valeur brute est affichée telle quelle (suffisant pour `liste-deroulante`). À surcharger si la valeur stockée n'est pas lisible directement (ex. `InteractiveClock` stocke un JSON `{hour, minute, second}`).
- `static stripFromQuestionHtml(questionHtml: string): string` : transforme le HTML de la question pour la liste des corrections. Par défaut, le HTML est inchangé (le composant reste visible). À surcharger pour retirer le composant de l'énoncé (ex. `InteractiveClock`).

Un customElement enregistré via `registerMathaleaCustomElement` est donc pris en charge par les corrections CAN sans modifier `Solutions.svelte` ni `canSolutions.ts`.

## Cas spécial : élément technique non visible

Si un composant doit être créé comme objet DOM technique (tests, vérifications hors affichage), ne pas détourner `create(...)`.

Utiliser une méthode dédiée, par exemple :

- `createEltToAppendToDom(...)`

Ce nommage évite de mélanger :

- API HTML standard (`create`) ;
- API technique d'instanciation DOM interne.

## Cas avancé : `MySpreadsheetElement` (tableur)

`MySpreadsheetElement` est plus complexe que la plupart des custom elements, car il gère à la fois :

- l'interactivité HTML (jspreadsheet) ;
- la sérialisation de la réponse élève ;
- un rendu LaTeX potentiellement stylé.

Point d'entrée recommandé côté exercice : utiliser `renderSheetMarkup(...)` dans `src/lib/customElements/MySpreadSheet.ts`.

`addSheet(...)` reste disponible pour compatibilité, mais délègue désormais à `renderSheetMarkup(...)`.

Exemple complet avec options LaTeX avancées :

```ts
import { renderSheetMarkup } from '../../lib/customElements/MySpreadSheet'

texte += renderSheetMarkup({
  numeroExercice: exercice.numeroExercice,
  questionIndex: i,
  data: [
    ['Produit', 'Prix'],
    ['Pommes', 3.2],
    ['Poires', 4.1],
  ],
  minDimensions: [2, 3],
  columns: [{ type: 'text' }, { type: 'numeric' }],
  interactif: true,
  showVerifyButton: true,

  // Données dédiées au rendu LaTeX (prioritaires sur data)
  latexData: {
    0: {
      0: { t: 1, v: 'Produit' },
      1: { t: 1, v: 'Prix', s: 'headerBlue' },
    },
    1: {
      0: { t: 1, v: 'Pommes' },
      1: { t: 2, v: 3.2, s: 'priceBg' },
    },
    2: {
      0: { t: 1, v: 'Poires' },
      1: { t: 2, v: 4.1, s: 'priceBg' },
    },
  },

  // Palette de styles utilisée par les clés s dans latexData
  latexStyles: {
    headerBlue: { bg: '#DCEBFF' },
    priceBg: { bg: '#F3F7E8' },
  },

  // Options de sortie de createTableurLatex(...)
  latexOptions: {
    formule: true,
    formuleCellule: 'B2',
    formuleTexte: '=B2*1.2',
    firstColHeaderWidth: '3cm',
  },
  appendFeedbackBlocks: true,
})
```

Paramètres utiles de `renderSheetMarkup(...)` :

- `numeroExercice` et `questionIndex` : permettent de générer l'id standard et les blocs feedback (`resultatCheck...`, `feedback...`).
- `appendFeedbackBlocks` : active/neutralise explicitement l'ajout des blocs feedback en sortie HTML.
- `latexData`, `latexStyles`, `latexOptions` : pilotent le rendu LaTeX/Typst.
- `nbColonnesCachees`, `nbLignesCachees`, `readOnlyCells` : options spécifiques au tableur interactif.

Comportement de rendu :

- en HTML non Typst : retourne le markup du custom element (et éventuellement les blocs feedback) ;
- en non-HTML ou Typst : retourne la sortie `render()` du composant, qui passe par `renderLatex()`.

Règles de priorité pour le rendu LaTeX :

1. Si `latexData` est fourni, il est utilisé directement.
2. Sinon, les cellules sont reconstruites automatiquement à partir de `data`.
3. `latexStyles` et `latexOptions` sont optionnels (fallback sur `{}`).

Structure attendue pour `latexData` :

- cellule texte : `{ t: 1, v: '...' }`
- cellule numérique : `{ t: 2, v: 12.5 }`
- cellule booléenne : `{ t: 3, v: true }`
- style optionnel : clé `s` (ex. `{ t: 1, v: 'Total', s: 'headerBlue' }`)

Conseils pratiques :

- garder `data` cohérent avec `latexData` pour éviter les divergences HTML/LaTeX ;
- éviter des couleurs trop proches du fond dans `latexStyles` (lisibilité impression) ;
- préférer des clés de style explicites (`headerBlue`, `warningCell`) plutôt que des noms ambigus.

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
- L'affichage dans les corrections CAN est correct (`formatStudentAnswer` et `stripFromQuestionHtml` surchargées si les valeurs par défaut ne conviennent pas).

## Migration d'un composant existant

Ordre recommandé :

1. Faire hériter la classe de `MathaleaCustomElement`.
2. Ajouter `elementTag`.
3. Introduire `create(...)` et rebrancher le helper historique (`addXxx`) dessus.
4. Déplacer la classe dans `src/lib/customElements/` si elle vivait ailleurs.
5. Uniformiser `value` et `interactivityOn`.
6. Ajouter le nettoyage dans `disconnectedCallback()`.
7. Vérifier les usages dans les fichiers de vérification interactive.

## Fichiers utiles

- Base : `src/lib/customElements/MathaleaCustomElement.ts`
- Interactivité (référence) : `../reference/systeme-interactivite.md`
- Guide général interactivité : `rendre-un-exercice-interactif.md`
