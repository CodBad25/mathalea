import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'

import { randint } from '../../modules/outils'
// import ExerciceQcmA from '../../ExerciceQcmA'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = '6b959'
export const refs = {
  'fr-fr': ['1A-C03-10'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Passer de l'écriture scientifique à l'écriture décimale"
export const dateDePublication = '11/10/2025'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class Auto1AC3j extends ExerciceQcmA {
  private appliquerLesValeurs(a: number, n: number): void {
    this.enonce = `Quelle est l'écriture décimale du nombre dont l'écriture scientifique est $${texNombre(a, 4)}\\times 10^{${n}}$ ?`

    this.correction = `Multiplier par  $10^{${n}}$ revient à multiplier par $${texNombre(10 ** n, 6)}$,  donc l'écriture décimale de $${texNombre(a, 6)}\\times 10^{${n}}$ est : $${miseEnEvidence(texNombre(a * 10 ** n, 6))}$.
         `

    this.reponses = [
      `$${texNombre(a * 10 ** n, 8)}$`,
      `$${texNombre(a * 10 ** (n - 1), 8)}$`,
      ` $${texNombre(a * 10 ** -n, 8)}$`,
      n < 0
        ? `$${texNombre(a * 10 ** (n + 1), 8)}$`
        : `$${texNombre(Math.floor(a) * 10 ** n + a / 10, 8)}$`,
    ]
  }

  versionOriginale: () => void = () => {
    this.appliquerLesValeurs(3.56, -3)
  }

  versionAleatoire: () => void = () => {
    let compteur = 0
    do {
      const a = choice([randint(101, 999) / 100, randint(1001, 9999) / 1000])
      const n = choice([randint(-5, -2), randint(2, 5)])
      this.appliquerLesValeurs(a, n)
      compteur++
    } while (
      compteur < 100 &&
      !aLeBonNombreDePropsDifferentes(this, 4, true, {})
    )
  }

  constructor() {
    super()
    this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut passer d'une écriture scientifique à une écriture décimale.<br>
    Si vous hésitez, vous pouvez construire au brouillon le tableau de numération du nombre en fonction des puissances de $10$.<br>
  </p>
 
`
    // this.options = { vertical: true, ordered: false }
    this.versionAleatoire()
  }
}
