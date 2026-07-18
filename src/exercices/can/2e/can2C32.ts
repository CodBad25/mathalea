import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import {
  fraction,
  obtenirListeFractionsIrreductibles,
} from '../../../modules/fractions'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Simplifier un quotient de nombre relatifs'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '1/07/2026'
/**
 * @author  Jean-Claude Lhote
 *
 *
 */

export const uuid = 'fd5c6'

export const refs = {
  'fr-fr': ['can2C32'],
  'fr-ch': [],
}

const fractionsIrreductibles = obtenirListeFractionsIrreductibles()
export default class SimplifierQuotientNombresRelatifs extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1
    this.optionsChampTexte = { texteAvant: '<br>' }
    this.typeExercice = 'simple'
    this.spacingCorr = 1.5
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.optionsDeComparaison = { fractionIrreductible: true }
  }

  nouvelleVersion() {
    const f = this.quotaChoice('f', fractionsIrreductibles)
    const factor = this.quotaRandint('factor', 2, 12)
    const signes = choice([
      [-1, 1],
      [1, -1],
      [-1, -1],
    ])
    const frac = fraction(
      f.reduire(factor).num * signes[0],
      f.reduire(factor).den * signes[1],
    )
    this.reponse = frac.simplifie().texFSD

    this.question = `Réduire la fraction $${frac.texFraction}$ au maximum.`

    this.correction = `$\\begin{aligned}
${frac.texFraction}&=${
      frac.den < 0
        ? `\\dfrac{${frac.num}\\times(-\\frac{1}{${factor}})}{${frac.den}\\times(-\\frac{1}{${factor}})}`
        : `\\dfrac{${frac.num}\\times\\frac{1}{${factor}}}{${frac.den}\\times\\frac{1}{${factor}}}`
    }\\\\
&=${
      frac.num * frac.den > 0
        ? miseEnEvidence(`${frac.texFractionSimplifiee}`)
        : frac.simplifie().texFraction
    }\\\\${frac.num * frac.den > 0 ? '' : `&=${miseEnEvidence(frac.simplifie().texFSD)}`}
\\end{aligned}$`

    this.canEnonce = this.question
    this.canReponseACompleter = ''
  }
}
