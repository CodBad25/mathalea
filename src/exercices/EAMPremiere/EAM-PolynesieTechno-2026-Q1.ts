import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'pt6q1'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Utiliser les règles de calcul sur les puissances'
export const dateDePublication = '04/07/2026'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ1PolynesieTechno2026 extends ExerciceQcmA {
  private appliquerLesValeurs(
    base: number,
    exposant1: number,
    exposant2: number,
  ): void {
    const exposantCorrect = exposant1 * exposant2

    this.enonce = `Le nombre $\\left(${base}^{${exposant1}}\\right)^{${exposant2}}$ est égal à :`

    this.reponses = [
      `$${base}^{${exposantCorrect}}$`,
      `$${base}^{${exposant1 + exposant2}}$`,
      `$${base}^{${exposant1 ** exposant2}}$`,
      `$${base}^{${Math.abs(exposant1 - exposant2)}}$`,
    ]

    this.correction = `On utilise la règle $\\left(a^n\\right)^p=a^{n\\times p}$.<br>
    Ainsi, $\\left(${base}^{${exposant1}}\\right)^{${exposant2}}=${base}^{${exposant1}\\times ${exposant2}}=${miseEnEvidence(`${base}^{${exposantCorrect}}`)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(5, 3, 2)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      this.appliquerLesValeurs(
        choice([2, 3, 4, 5]),
        choice([2, 3, 4]),
        choice([2, 3]),
      )
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
