import { describe, expect, it } from 'vitest'

import ImageAntecedentDepuisTableauOuFleche from '../../exercices/3e/3F10'
import { context } from '../../modules/context'
import { renderKatex } from '../mathalea'
import {
  latexLineBreaksToHtmlOutsideMath,
  stripEmbeddedQcmFromAMCPreview,
} from './amcPreviewText'

describe('preview AMC des textes LaTeX', () => {
  it('retire le mathalea-qcm déjà injecté avant de dessiner la preview AMC', () => {
    const source = [
      'Choisir la bonne réponse.<br><br>',
      '<mathalea-qcm id="mathalea-qcmEx0Q0" propositions="[...]" format="lettre"></mathalea-qcm>',
    ].join('')

    expect(stripEmbeddedQcmFromAMCPreview(source)).toBe(
      'Choisir la bonne réponse.',
    )
  })

  it('préserve les séparateurs de lignes d’un environnement array', () => {
    const source = String.raw`Voici le tableau :<br><br>$\def\arraystretch{1.5}\begin{array}{|l|c|c|}
\hline
x & 5 & 10 \\
\hline
f(x) & 4 & 8 \\
\hline
\end{array}$\\Suite du texte`

    const html = latexLineBreaksToHtmlOutsideMath(source)

    expect(html).toContain(String.raw`8 \\
\hline`)
    expect(html).toContain(String.raw`\end{array}$<br>Suite du texte`)
  })

  it('laisse KaTeX rendre le tableau réel de 3F10', () => {
    const container = document.createElement('div')
    container.innerHTML = latexLineBreaksToHtmlOutsideMath(
      String.raw`$\def\arraystretch{1.5}\begin{array}{|l|c|c|c|c|c|}
\hline
x & 5 & 10 & 15 & 20 & 25 \\
\hline
f(x) & 4 & 8 & 12 & 16 & 20 \\
\hline
\end{array}$`,
    )

    expect(() => renderKatex(container)).not.toThrow()
    expect(container.querySelector('.katex')).not.toBeNull()
    expect(container.querySelector('.mtable')).not.toBeNull()
    expect(container.textContent).toContain('f(x)')
  })

  it('rend l’énoncé AMC effectivement généré par 3F10', () => {
    const previousContext = { isAmc: context.isAmc, isHtml: context.isHtml }
    const exercise = new ImageAntecedentDepuisTableauOuFleche()
    exercise.seed = '3F10-amc-preview'
    context.isAmc = true
    context.isHtml = false

    try {
      exercise.nouvelleVersionWrapper()
    } finally {
      context.isAmc = previousContext.isAmc
      context.isHtml = previousContext.isHtml
    }

    const container = document.createElement('div')
    container.innerHTML = latexLineBreaksToHtmlOutsideMath(
      exercise.autoCorrectionAMC[0].enonce ?? '',
    )
    expect(() => renderKatex(container)).not.toThrow()
    expect(container.querySelector('.mtable')).not.toBeNull()
  })

  it('préserve aussi les environnements display délimités par crochets', () => {
    const source = String.raw`\[\begin{aligned}a&=b\\c&=d\end{aligned}\]`
    expect(latexLineBreaksToHtmlOutsideMath(source)).toBe(source)
  })
})
