/**
 * Copie de texte dans le presse-papier, tolérante aux contextes non
 * sécurisés.
 *
 * `navigator.clipboard` est réservé aux contextes sécurisés (HTTPS ou
 * localhost) : il est absent quand la page est servie en HTTP sur une IP du
 * réseau local (test depuis un téléphone avec `pnpm dev --host`). Dans ce
 * cas, repli sur la technique historique (textarea temporaire sélectionné +
 * `document.execCommand('copy')`), qui fonctionne sans contexte sécurisé.
 *
 * Renvoie true si le texte a été copié, false sinon (aucun throw).
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function'
  ) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission refusée ou autre échec : on tente le repli historique.
    }
  }
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    // Hors champ visuel mais sélectionnable (display:none empêcherait la copie).
    textarea.style.position = 'fixed'
    textarea.style.top = '-9999px'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    textarea.setSelectionRange(0, text.length) // nécessaire sur iOS
    const succeeded = document.execCommand('copy')
    textarea.remove()
    return succeeded
  } catch {
    return false
  }
}
