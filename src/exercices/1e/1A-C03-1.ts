import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '23/07/2025'
export const uuid = '6682b'

export const refs = {
  'fr-fr': ['1A-C03-1'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Transformer un calcul comportant des puissances'

/**
 * @author Gilles Mora
 */
export default class Auto1AC3a extends ExerciceQcmA {
  private appliquerLesValeurs(a: number[], n: number, k: number): void {
    const produit = a[0] * a[1]
    const exposantTotal = n + k

    this.enonce = `On considère le nombre $N=\\dfrac{${produit}^${exposantTotal}}{${a[0]}^${n}}$. On a :<br>`

    this.correction = `$\\begin{aligned}
    N&=\\dfrac{${produit}^${exposantTotal}}{${a[0]}^${n}}\\\\
    &=\\dfrac{${a[0]}^${exposantTotal}\\times ${a[1]}^${exposantTotal} }{${a[0]}^${n}}\\\\
    &=${a[1]}^${exposantTotal}\\times ${a[0]}^{${k}}\\\\
    &=${produit}^${k}\\times ${a[1]}^{${n}}\\\\
    &=${miseEnEvidence(`${a[1] ** n}\\times ${produit}^{${k}}`)}
    \\end{aligned}$`

    this.reponses = [
      ` $N=${a[1] ** n}\\times ${produit}^{${k}}$`,
      `$N=${a[1]}^{${k}}$`,
      `$N=\\dfrac{1}{${produit}^{${k}}}$`,
      `$N=${produit ** k / a[0]}$`,
    ]
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs([5, 2], 2, 5)
  }

  versionAleatoire = () => {
    const choix = choice([
      // Cas simples avec base 10
      { a: [5, 2], n: 2, k: 2 }, // 10^4 / 5^2
      { a: [5, 2], n: 3, k: 2 }, // 10^5 / 5^3
      { a: [2, 5], n: 2, k: 2 }, // 10^4 / 2^2
      { a: [2, 5], n: 3, k: 2 }, // 10^5 / 2^3

      // Cas avec base 6
      { a: [2, 3], n: 2, k: 2 }, // 6^4 / 2^2
      { a: [3, 2], n: 2, k: 2 }, // 6^4 / 3^2

      // Cas avec base 15 (un peu plus difficile)
      { a: [5, 3], n: 3, k: 2 }, // 15^5 / 5^3
      { a: [3, 5], n: 3, k: 2 }, // 15^5 / 3^3
    ])
    this.appliquerLesValeurs(choix.a, choix.n, choix.k)
  }

  constructor() {
    super()
    this.tip = `
   <ul style="list-style-type: disc; padding-left: 1.5em; margin: 0 0 14px 0; line-height: 2;">
    <li>
    Commencez par regarder la base (c’est le nombre auquel on applique l’exposant) au numérateur et au dénominateur.<br>
    <li>Cherchez un lien évident entre ces deux bases, qui soit utile avec les proprétés des puissances.
     <li>Réécrire l'expression de manière à faire apparaître une même base au numérateur et au dénominateur. <br>
       </li>
  </ul>Cela doit vous mettre sur la piste pour simplifier l’expression. <br>
  </p>
`
    this.versionAleatoire()
  }
}
