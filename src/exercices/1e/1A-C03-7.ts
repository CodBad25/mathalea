import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '10/08/2025'
export const uuid = 'c0964'
// @Author Stéphane Guyon
export const refs = {
  'fr-fr': ['1A-C03-7', '2A-N3-7'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Additionner deux puissances identiques'
export default class Auto1AC3g extends ExerciceQcmA {
  private appliquerLesValeurs(k: number): void {
    this.enonce = `Soit $n$ un entier. <br>À quelle expression est égale $${k}^{n}+${k}^n$ ?`

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
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut donner du sens à l'opération demandée avant d'appliquer une formule.
  </p>
  <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>Observer que les deux termes additionnés sont identiques.</li>
    <li>Remplacer ce terme par une lettre au brouillon pour réfléchir à une addition du type $A+A$.</li>
    <li>Faire le même calcul avec des nombres à la place de $n$ si la variable gêne.</li>
    <li>Ne pas confondre addition de puissances et produit de puissances.</li>
  </ul>`
    this.versionAleatoire()
  }
}
