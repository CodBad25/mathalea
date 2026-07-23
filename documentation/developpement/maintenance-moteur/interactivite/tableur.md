# Architecture du tableur

`MySpreadsheetElement`, implémenté dans
`src/lib/customElements/MySpreadSheet.ts`, combine :

- un tableur HTML interactif ;
- la sérialisation de la réponse élève ;
- un rendu LaTeX ou Typst imprimable.

La recette côté exercice est dans
[Utiliser le tableur](../../auteurs-exercices/complements/tableur.md).

## Point d'entrée

`renderSheetMarkup()` est l'interface stable pour les exercices. `addSheet()`
reste un alias de compatibilité.

## Rendu

- en HTML hors Typst, le helper produit le custom element et éventuellement les
  zones de résultat et de feedback ;
- en LaTeX ou Typst, il appelle le rendu imprimable ;
- `latexData` est prioritaire lorsqu'il est fourni ;
- sinon, le rendu reconstruit les cellules depuis `data`.

`latexStyles` et `latexOptions` ne doivent pas modifier la valeur interactive.

## Invariants

- les identifiants suivent la convention exercice/question ;
- `data` et `latexData` représentent le même contenu pédagogique ;
- les cellules masquées ou en lecture seule sont conservées lors de la
  sérialisation ;
- le rendu imprimable ne dépend pas de jspreadsheet ni du DOM.

Toute évolution de la structure sérialisée doit tenir compte des réponses déjà
enregistrées et des exports.
