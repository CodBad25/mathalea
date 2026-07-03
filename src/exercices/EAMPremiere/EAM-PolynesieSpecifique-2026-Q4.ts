import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'psq04'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Retrouver un effectif total à partir d’un pourcentage'
export const dateDePublication = '02/07/2026'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ4PolynesieSpecifique2026 extends ExerciceQcmA {
  private appliquerLesValeurs(
    partie: number,
    pourcentage: number,
    distracteurs?: number[],
  ): void {
    const total = (partie * 100) / pourcentage
    const multiplicateur = 100 / pourcentage
    const mauvaisesReponses = distracteurs ?? [
      partie * pourcentage,
      total * 10,
      partie + pourcentage,
    ]

    this.enonce = `Dans un parc animalier, on compte $${partie}$ animaux d'une même espèce, ce qui représente $${pourcentage}\\,\\%$ de l'effectif total des animaux du parc.<br>
    L'effectif total des animaux du parc est égal à :`

    this.reponses = [
      `$${total}$`,
      `$${mauvaisesReponses[0]}$`,
      `$${mauvaisesReponses[1]}$`,
      `$${mauvaisesReponses[2]}$`,
    ]

    this.correction = `$${pourcentage}\\,\\%$ de l'effectif total représentent $${partie}$ animaux.<br>
    Or $${pourcentage}\\,\\%$ représente $\\dfrac{1}{${multiplicateur}}$ de l'effectif total.<br>
    L'effectif total vaut donc $${partie}\\times ${multiplicateur}=${miseEnEvidence(total)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(20, 5, [4000, 1000, 100])
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    const cas: [number, number][] = [
      [12, 5],
      [15, 10],
      [18, 20],
      [24, 25],
      [30, 50],
      [35, 5],
    ]

    let compteur = 0
    do {
      const [partie, pourcentage] = choice(cas)
      this.appliquerLesValeurs(partie, pourcentage)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
