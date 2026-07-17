# MySpreadsheetElement (guide avancé)

`MySpreadsheetElement` est plus complexe que la plupart des custom elements, car il gère à la fois :

- l'interactivité HTML (jspreadsheet) ;
- la sérialisation de la réponse élève ;
- un rendu LaTeX potentiellement stylé.

Implémentation : `src/lib/customElements/MySpreadSheet.ts`

## Point d'entrée recommandé

Utiliser `renderSheetMarkup(...)` côté exercice.

`addSheet(...)` reste disponible pour compatibilité, mais délègue désormais à `renderSheetMarkup(...)`.

## Exemple complet

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

## Paramètres utiles de renderSheetMarkup(...)

- `numeroExercice` et `questionIndex` : génèrent l'id standard et les blocs feedback (`resultatCheck...`, `feedback...`).
- `appendFeedbackBlocks` : active/neutralise explicitement l'ajout des blocs feedback en sortie HTML.
- `latexData`, `latexStyles`, `latexOptions` : pilotent le rendu LaTeX/Typst.
- `nbColonnesCachees`, `nbLignesCachees`, `readOnlyCells` : options spécifiques au tableur interactif.

## Comportement de rendu

- en HTML non Typst : retourne le markup du custom element (et éventuellement les blocs feedback) ;
- en non-HTML ou Typst : retourne la sortie `render()` du composant, qui passe par `renderLatex()`.

## Règles de priorité pour le rendu LaTeX

1. Si `latexData` est fourni, il est utilisé directement.
2. Sinon, les cellules sont reconstruites automatiquement à partir de `data`.
3. `latexStyles` et `latexOptions` sont optionnels (fallback sur `{}`).

## Structure attendue pour latexData

- cellule texte : `{ t: 1, v: '...' }`
- cellule numérique : `{ t: 2, v: 12.5 }`
- cellule booléenne : `{ t: 3, v: true }`
- style optionnel : clé `s` (ex. `{ t: 1, v: 'Total', s: 'headerBlue' }`)

## Conseils pratiques

- garder `data` cohérent avec `latexData` pour éviter les divergences HTML/LaTeX ;
- éviter des couleurs trop proches du fond dans `latexStyles` (lisibilité impression) ;
- préférer des clés de style explicites (`headerBlue`, `warningCell`) plutôt que des noms ambigus.
