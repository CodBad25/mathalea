import renderMathInElement from 'katex/contrib/auto-render'
import 'katex/dist/katex.min.css'
import { optionsKatex } from './Katex'

export function renderKatex(element: HTMLElement) {
  // Ajouter preProcess sans typage strict
  Object.assign(optionsKatex, {
    preProcess: (chaine: string) =>
      '{' + chaine.replaceAll(String.fromCharCode(160), '\\,') + '}',
  })

  renderMathInElement(element, optionsKatex as any)
  document.dispatchEvent(new window.Event('katexRendered'))
}
