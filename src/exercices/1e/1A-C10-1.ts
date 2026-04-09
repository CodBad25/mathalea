import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { abs } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '23/07/2025'
export const uuid = 'e1e6d'

export const refs = {
  'fr-fr': ['1A-C10-1'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Résoudre une équation du type $x^2=a$'
/**
 * @author Gilles Mora
 */
export default class Puissances extends ExerciceQcmA {
  versionOriginale: () => void = () => {
    this.enonce =
      'On note $S$ l’ensemble des solutions de l’équation $x^2=10$ sur $\\mathbb{R}$ . On a : '
    this.correction = `On reconnaît une équation du type $x^2=k$ avec $k=10$.<br>
    Puisque $10$  est strictement positif, l'équation a deux solutions :
    $-\\sqrt{10}$ et $\\sqrt{10}$.<br>
        Ainsi, $S=${miseEnEvidence('\\{-\\sqrt{10}\\,;\\,\\sqrt{10}\\}')}$.`

    this.reponses = [
      '$S=\\{-\\sqrt{10}\\,;\\,\\sqrt{10}\\}$',
      '$S=\\{-\\sqrt{5}\\,;\\,\\sqrt{5}\\}$',
      '$S=\\emptyset$',
      '$S=\\{-5\\,;\\,5\\}$',
    ]
  }

  versionAleatoire = () => {
    let compteur = 0
    do {
      const CorrCarre = `On isole le carré pour se ramener à une équation du type $x^2=k$.<br>
        Résoudre l'équation revient à résoudre `

      const CorrNegatif = ` est strictement négatif, l'équation n'a pas de solution.<br>
          Ainsi, $S=${miseEnEvidence('\\emptyset')}$.`

      const CorrPositif =
        " est strictement positif, l'équation a deux solutions : "
      const choix = choice([true, false])
      switch (choice([1, 1, 2, 3, 3, 4, 4])) {
        case 1:
          {
            const a = randint(1, 9)
            this.enonce = `On note $S$ l’ensemble des solutions de l’équation ${choix ? `$x^{2}-${a * a}=0$` : `$${a * a}-x^2=0$`} sur $\\mathbb{R}$ . On a : `
            this.correction =
              CorrCarre +
              ` $x^2=${a * a}$.<br>  
        Puisque $${a * a}$` +
              CorrPositif
            this.correction += `$-\\sqrt{${a * a}}=-${a}$ et $\\sqrt{${a * a}}=${a}$.<br>`
            this.correction += `Ainsi, $S=${miseEnEvidence(`\\{-${a}\\,;\\,${a}\\}`)}$.`
            this.reponses = [
              `$S=\\{-${a}\\,;\\,${a}\\}$`,
              `$S=\\{-\\sqrt{${a}}\\,;\\,\\sqrt{${a}}\\}$`,
              '$S=\\emptyset$',
              `$S=\\{${a}\\}$`,
            ]
          }
          break
        case 2:
          {
            const a = randint(1, 9)
            this.enonce = `On note $S$ l’ensemble des solutions de l’équation $x^{2}+${a * a}=0$ sur $\\mathbb{R}$ . On a : `

            this.correction =
              `On isole le carré. L'équation s'écrit $x^{2}=-${a * a}$.<br>
          Comme  $-${a * a}$` + CorrNegatif
            this.reponses = [
              '$S=\\emptyset$',
              `$S=\\{-${a}\\,;\\,${a}\\}$`,
              `$S=\\{-\\sqrt{${a}}\\,;\\,\\sqrt{${a}}\\}$`,
              `$S=\\{${-a}\\}$`,
            ]
          }
          break

        case 3:
          {
            const b = randint(1, 12)
            const a = b ** 2 * choice([-1, 1])
            this.enonce = `On note $S$ l’ensemble des solutions de l’équation $x^{2}=${a}$ sur $\\mathbb{R}$ . On a : `

            this.correction = ` On reconnaît une équation du type $x^2=k$ avec $k=${a}$.<br>`
            if (a > 0) {
              this.correction += `Puisque $${a}$ ` + CorrPositif
              this.correction += ` $-\\sqrt{${a}}=-${b}$ et $\\sqrt{${a}}=${b}$.<br>`
              this.correction += `Ainsi, $S=${miseEnEvidence(`\\{-${b}\\,;\\,${b}\\}`)}$.`
              this.reponses = [
                `$S=\\{-${b}\\,;\\,${b}\\}$`,
                '$S=\\emptyset$',
                `$S=\\{${texNombre(-a / 2, 2)}\\,;\\,${texNombre(a / 2, 2)}\\}$`,
                `$S=\\{${b}\\}$`,
              ]
            } else {
              this.correction += `Puisque $${a}$ ` + CorrNegatif
              this.reponses = [
                '$S=\\emptyset$',
                `$S=\\{-${b}\\,;\\,${b}\\}$`,
                `$S=\\{\\sqrt{${-a}}\\}$`,
                `$S=\\{-${b}\\}$`,
              ]
            }
          }
          break

        case 4:
        default:
          {
            const a = randint(2, 9)
            const k = randint(-7, 13, [0, 1, 4, 9])
            const b = a * k
            this.enonce = `On note $S$ l’ensemble des solutions de l’équation ${choix ? `$${a}x^{2}${ecritureAlgebrique(-b)}=0$` : `$${-b}${ecritureAlgebrique(a)}x^{2}=0$`} sur $\\mathbb{R}$ . On a : `
            this.correction = '' + CorrCarre + ` $x^2=${k}$.<br>  `
            if (k < 0) {
              this.correction += `Puisque $${k}$ ` + CorrNegatif
              this.reponses = [
                '$S=\\emptyset$',
                `$S=\\{-\\sqrt{${abs(b)}}\\,;\\,\\sqrt{${abs(b)}}\\}$`,
                `$S=\\{-\\sqrt{${abs(k)}}\\,;\\,\\sqrt{${abs(k)}}\\}$`,
                `$S=\\{\\sqrt{${abs(k)}}\\}$`,
              ]
            } else {
              this.correction += `Puisque $${k}$ ` + CorrPositif
              this.correction += ` $-\\sqrt{${k}}$ et $\\sqrt{${k}}$.<br>`
              this.correction += `Ainsi, $S=${miseEnEvidence(`\\{-\\sqrt{${k}}\\,;\\,\\sqrt{${k}}\\}`)}$.`
              this.reponses = [
                `$S=\\{-\\sqrt{${abs(k)}}\\,;\\,\\sqrt{${abs(k)}}\\}$`,
                `$S=\\{\\sqrt{${abs(k)}}\\}$`,
                `$S=\\{-${texNombre(abs(k) / 2, 2)}\\,;\\,${texNombre(abs(k) / 2, 2)}\\}$`,
                '$S=\\emptyset$',
              ]
            }
          }
          break
      }
      compteur++
    } while (
      compteur < 100 &&
      !aLeBonNombreDePropsDifferentes(this, 4, true, {
        ensembleDeNombres: true,
      })
    ) // On s'assure d'avoir 4 réponses différentes, sinon on régénère
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
