import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'ps263'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Retrouver un effectif total à partir d’un pourcentage'
export const dateDePublication = '01/07/2026'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ3PolynesieSpe2026 extends ExerciceQcmA {
  private appliquerLesValeurs(partie: number, pourcentage: number): void {
    const total = (partie * 100) / pourcentage

    this.enonce = `Un entraîneur choisit $${partie}$ joueurs dans une équipe.<br>
    Cela représente $${pourcentage}\\,\\%$ de l'équipe.<br>
    Combien y a-t-il de joueurs dans l'équipe ?`

    this.reponses = [
      `$${total}$`,
      `$${partie + pourcentage}$`,
      `$${partie * (pourcentage / 10)}$`,
      `$${Math.round(partie * (1 + pourcentage / 100))}$`,
    ]

    this.correction = `$${pourcentage}\\,\\%$ de l'équipe représentent $${partie}$ joueurs, donc l'effectif total est $${partie}\\div ${pourcentage / 100}=${miseEnEvidence(total)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(8, 20)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      const pourcentage = choice([20, 25, 50])
      const total = choice([20, 24, 30, 32, 36, 40, 48, 60])
      const partie = (total * pourcentage) / 100
      if (!Number.isInteger(partie)) continue
      this.appliquerLesValeurs(partie, pourcentage)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
