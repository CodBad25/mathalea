import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { rienSi1 } from '../../lib/outils/ecritures'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'pt6q6'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Développer le carré d’une somme'
export const dateDePublication = '04/07/2026'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ6PolynesieTechno2026 extends ExerciceQcmA {
  private appliquerLesValeurs(a: number, b: number): void {
    const expression = `(${rienSi1(a)}x+${b})^2`
    const correct = `${a ** 2}x^2+${2 * a * b}x+${b ** 2}`

    this.enonce = `L'expression $${expression}$ est égale à :`

    this.reponses = [
      `$${correct}$`,
      `$${a}x^2+${b ** 2}$`,
      `$${a ** 2}x^2+${b ** 2}$`,
      `$${a}x^2+${2 * a * b}x+${b ** 2}$`,
    ]

    this.correction = `On sait que, pour tous réels $a$ et $b$, $(a+b)^2=a^2+2ab+b^2$.<br>
    Donc $${expression}=(${rienSi1(a)}x)^2+2\\times ${rienSi1(a)}x\\times ${b}+${b}^2=${miseEnEvidence(correct)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(2, 3)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const a = choice([2, 3, 4, 5, 6, 7])
      const b = choice([2, 3, 4, 5, 6].filter((valeur) => valeur !== a))
      this.appliquerLesValeurs(a, b)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
