import { miseEnEvidence } from '../../lib/outils/embellissements'
import { abs } from '../../lib/outils/nombres'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '07/09/2025'
export const uuid = '3b917'

export const refs = {
  'fr-fr': ['1A-C10-10'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Résoudre une équation simple'
/**
 * @author Gilles Mora
 */
export default class Auto1AC11b extends ExerciceQcmA {
  versionOriginale: () => void = () => {
    this.enonce = "La solution de l'équation  $3x=0$ est : "
    this.correction = ` On divise par $3$ chacun des deux membres  de l'équation pour obtenir $x=0$.<br>
    C'est bien $3\\times 0$ qui est égal à 0.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence('0')}$.`

    this.reponses = [
      '$\\vphantom{\\dfrac{1}{3}}x=0$',
      '$\\vphantom{\\dfrac{1}{3}}x=-3$',
      '$x=\\dfrac{1}{3}$',
      '$x=-\\dfrac{1}{3}$',
    ]
  }

  versionAleatoire = () => {
    switch (randint(1, 6)) {
      case 1:
        {
          const a = randint(-9, 9, [-1, 1, 0])
          this.enonce = `La solution de l'équation  $${a}x=0$ est : `
          this.correction = ` On divise par $${a}$ chacun des deux membres  de l'équation pour obtenir $x=0$.<br>
    C'est bien $${a}\\times 0$ qui est égal à 0.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence('0')}$.`

          this.reponses = [
            '$\\vphantom{\\dfrac{1}{3}}x=0$',
            `$\\vphantom{\\dfrac{1}{3}}x=${-a}$`,
            `$x=\\dfrac{1}{${abs(a)}}$`,
            `$x=-\\dfrac{1}{${abs(a)}}$`,
          ]
        }
        break
      case 2:
        {
          const a = randint(2, 10)
          this.enonce = `La solution de l'équation  $\\dfrac{x}{${a}}=0$ est : `

          this.correction = ` On multiplie par $${a}$ chacun des deux membres  de l'équation pour obtenir $x=0$.<br>
    C'est bien $0\\div ${a}$ qui est égal à 0.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence('0')}$.`
          this.reponses = [
            '$\\vphantom{\\dfrac{1}{3}}x=0$',
            `$\\vphantom{\\dfrac{1}{3}}x=${-a}$`,
            `$x=\\dfrac{1}{${abs(a)}}$`,
            `$x=-\\dfrac{1}{${abs(a)}}$`,
          ]
        }
        break

      case 3:
        {
          const a = randint(-10, 10, [-1, 1, 0])
          this.enonce = `La solution de l'équation $\\dfrac{${a}}{x}=1$ est : `

          this.correction = ` Le quotient $\\dfrac{${a}}{x}$ est égal à $1$, lorsque son numérateur et son dénominateur sont égaux, c'est-à-dire lorsque $x=${a}$.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence(a)}$.`
          this.reponses = [
            `$\\vphantom{\\dfrac{1}{3}}x=${a}$`,
            `$\\vphantom{\\dfrac{1}{3}}x=${-a}$`,
            `$x=\\dfrac{1}{${abs(a)}}$`,
            `$x=-\\dfrac{1}{${abs(a)}}$`,
          ]
        }
        break
      case 4:
        {
          const a = randint(-10, 10, [-1, 1, 0])
          this.enonce = `La solution de l'équation $\\dfrac{x}{${a}}=1$ est : `

          this.correction = ` Le quotient $\\dfrac{x}{${a}}$ est égal à $1$, lorsque son numérateur et son dénominateur sont égaux, c'est-à-dire lorsque $x=${a}$.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence(a)}$.`
          this.reponses = [
            `$\\vphantom{\\dfrac{1}{3}}x=${a}$`,
            `$\\vphantom{\\dfrac{1}{3}}x=${-a}$`,
            `$x=\\dfrac{1}{${abs(a)}}$`,
            `$x=-\\dfrac{1}{${abs(a)}}$`,
          ]
        }
        break

      case 5:
        {
          const a = randint(-10, 10, [-1, 1, 0])
          this.enonce = `La solution de l'équation $\\dfrac{${a}}{x}=${a}$ est : `

          this.correction = ` Le quotient $\\dfrac{${a}}{x}$ est égal à $${a}$, lorsque son  dénominateur est égal à $1$.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence('1')}$.`
          this.reponses = [
            `$\\vphantom{\\dfrac{1}{3}}x=1$`,
            `$\\vphantom{\\dfrac{1}{3}}x=${a}$`,
            `$\\vphantom{\\dfrac{1}{3}}x=${-a}$`,
            `$x=\\dfrac{1}{${abs(a)}}$`,
          ]
        }
        break

      case 6:
      default:
        {
          const a = randint(-9, 9, [-1, 1, 0])
          this.enonce = `La solution de l'équation  $${a}x=${a}$ est : `
          this.correction = ` On divise par $${a}$ chacun des deux membres  de l'équation pour obtenir $x=1$.<br>
    C'est bien $${a}\\times 1$ qui est égal à $${a}$.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence('1')}$.`

          this.reponses = [
            '$\\vphantom{\\dfrac{1}{3}}x=1$',
            `$\\vphantom{\\dfrac{1}{3}}x=${-a}$`,
            `$x=\\dfrac{1}{${abs(a)}}$`,
            `$x=-\\dfrac{1}{${abs(a)}}$`,
          ]
        }
        break
    }
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
