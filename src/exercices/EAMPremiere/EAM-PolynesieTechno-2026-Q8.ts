import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'pt6q8'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Traduire une moyenne par une équation'
export const dateDePublication = '04/07/2026'

/**
 * @author Stéphane Guyon
 */
export default class AutoQ8PolynesieTechno2026 extends ExerciceQcmA {
  private appliquerLesValeurs(valeurs: number[], moyenne: number): void {
    const sommeConnue = valeurs.join('+')
    const serieTex = valeurs.join('\\,;\\,')
    const effectif = valeurs.length + 1
    const effectifSansX = valeurs.length
    const equation = `\\dfrac{${sommeConnue}+x}{${effectif}}=${moyenne}`

    this.enonce = `On considère la série de nombres $${serieTex}\\,;\\,x$.<br>
    La moyenne de cette série de nombres est égale à $${moyenne}$.<br>
    Quelle équation permet de déterminer la valeur de $x$ ?`

    this.reponses = [
      `$${equation}$`,
      `$${sommeConnue}+\\dfrac{x}{${effectif}}=${moyenne}$`,
      `$\\dfrac{${sommeConnue}}{${effectifSansX}}+x=${moyenne}$`,
      `$\\dfrac{${sommeConnue}+x}{${effectifSansX}}=${moyenne}$`,
    ]

    this.correction = `La moyenne se calcule comme le quotient de la somme des valeurs par le nombre de valeurs.<br>
    Ici, il y a $${effectif}$ valeurs, donc l'équation qui permet de déterminer $x$ est $${miseEnEvidence(equation)}$.`
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs([7, 3, 4, 2], 5)
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    const cas: [number[], number][] = [
      [[3, 5, 4], 4],
      [[7, 3, 4], 5],
      [[8, 5, 7], 6],
      [[2, 5, 3, 4], 4],
      [[7, 3, 4, 2], 5],
      [[6, 8, 5, 3], 6],
      [[9, 4, 6, 1], 5],
    ]
    let compteur = 0
    do {
      const [valeurs, moyenne] = choice(cas)
      this.appliquerLesValeurs(valeurs, moyenne)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
