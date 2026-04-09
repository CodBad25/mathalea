import { rienSi1 } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '10/08/2025'
export const uuid = '66ec4'
// @Author Stéphane Guyon
export const refs = {
  'fr-fr': ['1A-C03-5'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Appliquer la propriété des quotients avec des puissances'
export default class Auto1AC3e extends ExerciceQcmA {
  private appliquerLesValeurs(k: number, inverse: boolean = false): void {
    if (inverse) {
      // Cas inversé : a^n / a^(n^k)
      this.enonce = `Soit $a$ un nombre réel non nul et $n$ un entier non nul.<br> À quelle expression est égale $\\dfrac{a^{n}}{a^{n^{${k}}}}$ ?`

      this.correction = `On applique la propriété du quotient des puissances d'un réel : <br>
      Soit $n$ et $p$ deux entiers et $a$ un réel :  $\\dfrac{a^n}{a^p}=a^{n-p}$<br>
      $\\begin{aligned} \\dfrac{a^{n}}{a^{n^{${k}}}}&=a^{n-n^{${k}}}\\\\
      &=a^{-n(-1+n^{${rienSi1(k - 1)}})}\\\\
      &=${miseEnEvidence(`a^{-n(n^{${rienSi1(k - 1)}}-1)}`)}
      \\end{aligned}$<br>`

      this.reponses = [
        `$a^{-n(n^{${rienSi1(k - 1)}}-1)}$`,
        `$a^{-${rienSi1(k - 1)}n}$`,
        k === 2 ? '$a^{1-n}$' : `$a^{-n^${k - 1}}$`,
        `$a^{n(n^{${rienSi1(k - 1)}}-1)}$`,
      ]
    } else {
      // Cas normal : a^(n^k) / a^n
      this.enonce = `Soit $a$ un nombre réel non nul et $n$ un entier non nul.<br> À quelle expression est égale $\\dfrac{a^{n^{${k}}}}{a^{n}}$ ?`

      this.correction = `On applique la propriété du quotient des puissances d'un réel : <br>
      Soit $n$ et $p$ deux entiers et $a$ un réel :  $\\dfrac{a^n}{a^p}=a^{n-p}$<br>
      $\\begin{aligned} \\dfrac{a^{n^{${k}}}}{a^{n}}&=a^{n^{${k}}-n}\\\\
      &=${miseEnEvidence(`a^{n(n^{${rienSi1(k - 1)}}-1)}`)}
      \\end{aligned}$<br>`

      this.reponses = [
        `$a^{n(n^{${rienSi1(k - 1)}}-1)}$`,
        `$a^{${rienSi1(k - 1)}n}$`,
        k === 2 ? '$a^{n-1}$' : `$a^{n^${k - 1}}$`,
        `$a^{${k}}$`,
      ]
    }
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(2)
  }

  versionAleatoire = () => {
    const casChoisi = randint(1, 2)
    const k = randint(2, 5)

    if (casChoisi === 1) {
      // Cas normal : a^(n^k) / a^n
      this.appliquerLesValeurs(k, false)
    } else {
      // Cas inversé : a^n / a^(n^k)
      this.appliquerLesValeurs(k, true)
    }
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
