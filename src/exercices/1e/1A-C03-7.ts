import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '10/08/2025'
export const uuid = 'c0964'
// @Author Stéphane Guyon
export const refs = {
  'fr-fr': ['1A-C03-7'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Additionner deux puissances identiques'
export default class Auto1AC3g extends ExerciceQcmA {
  private appliquerLesValeurs(k: number): void {
    this.enonce = `Soit $n$ un entier non nul. <br>À quelle expression est égale $${k}^{n}+${k}^n$ ?`

    this.correction = `$\\begin{aligned} ${k}^{n}+${k}^n&=2\\times ${k}^{n}`

    if (k === 2) {
      this.correction += `\\\\&=${miseEnEvidence('2^{n+1}')}`
    } else {
      this.correction += `\\end{aligned}$<br>`
    }

    if (k === 2) {
      this.correction += `\\end{aligned}$<br>`
      this.reponses = [`$2^{n+1}$`, `$4^n$`, `$2^{2n}$`, `$(2^n)^2$`]
    } else {
      this.reponses = [
        `$2\\times ${k}^n$`,
        `$${2 * k}^n$`,
        `$${k}^{n+1}$`,
        `$${k}^{2n}$`,
      ]
    }
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(2)
  }

  versionAleatoire = () => {
    const k = randint(3, 6)
    this.appliquerLesValeurs(k)
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
