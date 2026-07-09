/**
 * Remplace les <br> qui créent une ligne vide (2e, 3e... d'une suite de <br>
 * consécutifs) par un repère de hauteur fixe (`height`), indépendante de
 * `lineHeightFactor` (sinon une ligne vide grossit avec le texte et prend une
 * place excessive). Un `line-height` posé directement sur un <br> n'a aucun
 * effet dans Chrome : seul un élément avec une vraie boîte (ici un <span>
 * `display: block`) peut imposer sa propre hauteur de ligne.
 * Ne doit être appelé que sur du HTML de rendu pur (jamais relu ensuite dans
 * `innerHTML` pour être sauvegardé), sous peine de remplacer définitivement
 * les <br> de la source éditable par ce repère.
 */
export function markBlankLines(root: HTMLElement, height = 0) {
  for (const br of Array.from(root.querySelectorAll('br'))) {
    let previous = br.previousSibling
    while (
      previous != null &&
      previous.nodeType === Node.TEXT_NODE &&
      (previous.textContent ?? '').trim() === ''
    ) {
      previous = previous.previousSibling
    }
    if (!(previous instanceof HTMLElement && previous.tagName === 'BR')) continue
    const spacer = document.createElement('span')
    spacer.className = 'a4-blank-line-br'
    spacer.style.display = 'block'
    spacer.style.height = `${height}em`
    br.replaceWith(spacer)
  }
}
