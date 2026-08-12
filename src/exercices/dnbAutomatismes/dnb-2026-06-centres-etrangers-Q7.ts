import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'cea07'
export const refs = {
  'fr-fr': ['3AutoN13-4'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Reconnaître une forme factorisée'
export const dateDePublication = '11/08/2026'

/**
 * DNB Centres étrangers juin 2026 - Question 7
 * @author Jean-Claude Lhote
 */
export default class AutoQ7CentresEtrangersBrevet2026 extends ExerciceQcmA {
  private appliquerLesValeurs(a: number, b: number): void {
    this.enonce = `Recopier la forme factorisée de l'expression $${a}x${ecritureAlgebrique(b * a)}$.`
    this.reponses = [
      `$${a}(x${ecritureAlgebrique(b)})$`,
      `$${a}(x${ecritureAlgebrique(a * b)})$`,
      `$${(1 + Math.abs(b)) * a}x$`,
      `$${a * b}x$`,
    ]
    this.correction = `$${a}x+${a}=${a}\\times x+${a}\\times 1=${miseEnEvidence(`${a}(x+1)`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(5, 1)
  }

  versionAleatoire = () => {
    if (this.canOfficielle || this.sup) {
      this.versionOriginale()
      return
    }
    this.appliquerLesValeurs(randint(2, 9), randint(-2, 2, 0))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
