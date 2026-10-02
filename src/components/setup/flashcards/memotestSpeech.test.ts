// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { formulaToSpeech, memotestQuestionSpeech } from './memotestSpeech'

describe('lecture vocale Mémotest', () => {
  it('convertit les fractions et les opérations en français', () => {
    expect(formulaToSpeech('\\dfrac{1}{2}+3\\times 4')).toBe(
      '( 1 ) sur ( 2 ) plus 3 fois 4',
    )
    expect(formulaToSpeech('x^2=\\sqrt{9}')).toBe(
      'x au carré égal à racine carrée de ( 9 )',
    )
  })
  it('retire le HTML, décode les entités et conserve la séparation des paragraphes', () => {
    expect(
      memotestQuestionSpeech(
        '<p>Calculer&nbsp;:</p><div>$2+3$</div><script>secret</script>',
      ),
    ).toBe('Calculer : 2 plus 3')
  })
  it('décrit les images sans lire les étiquettes internes du SVG', () => {
    expect(
      memotestQuestionSpeech(
        '<img alt="Triangle ABC"><svg><text>A</text></svg>',
      ),
    ).toBe('Triangle ABC Illustration à consulter visuellement.')
  })
  it('signale une formule inconnue sans lire ses commandes LaTeX', () => {
    expect(memotestQuestionSpeech('Calculer $\\unknown{2}$ puis $4+5$.')).toBe(
      'Calculer Formule mathématique à consulter visuellement. puis 4 plus 5 .',
    )
  })
  it('convertit aussi le contenu des corrections', () => {
    expect(
      memotestQuestionSpeech('La réponse est <strong>$\\frac{3}{4}$</strong>.'),
    ).toBe('La réponse est ( 3 ) sur ( 4 ) .')
  })
})
