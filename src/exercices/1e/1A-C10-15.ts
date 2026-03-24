import { miseEnEvidence } from '../../lib/outils/embellissements'
import { randint } from '../../modules/outils'
// import ExerciceQcmA from '../../ExerciceQcmA'
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { reduireAxPlusB } from '../../lib/outils/ecritures'
import { texNombre } from '../../lib/outils/texNombre'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'e6c95'
export const refs = {
  'fr-fr': ['1A-C10-15'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Trouver l'inéquation avec une solution"
export const dateDePublication = '17/12/2025'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora avec Claude ai
 *
 */
export default class Auto1C10o extends ExerciceQcmA {
  private genererInequation1(
    x0: number,
    estSolution: boolean,
  ): { inequation: string; a: number; b: number; c: number; d: number } {
    if (estSolution) {
      const a = randint(2, 6)
      const c = randint(1, a - 1)
      const d = randint(1, 5)
      const b = c * x0 + d - a * x0 - randint(1, 3)

      return {
        inequation: `${reduireAxPlusB(a, b)} < ${reduireAxPlusB(c, d)}`,
        a,
        b,
        c,
        d,
      }
    } else {
      const a = randint(2, 6)
      const c = randint(1, a - 1)
      const d = randint(1, 5)
      const b = c * x0 + d - a * x0 + randint(1, 3)

      return {
        inequation: `${reduireAxPlusB(a, b)} < ${reduireAxPlusB(c, d)}`,
        a,
        b,
        c,
        d,
      }
    }
  }

  // Génère une inéquation du second degré avec solution x0
  private genererInequation2(
    x0: number,
    estSolution: boolean,
  ): { inequation: string; a: number; b: number } {
    if (estSolution) {
      const a = randint(2, 5)
      const b = x0 * x0 - a * x0 + randint(1, 3)

      return {
        inequation: `x^2 < ${reduireAxPlusB(a, b)}`,
        a,
        b,
      }
    } else {
      const a = randint(2, 5)
      const b = x0 * x0 - a * x0 - randint(1, 3)

      return {
        inequation: `x^2 < ${reduireAxPlusB(a, b)}`,
        a,
        b,
      }
    }
  }

  private cas1(x0: number): void {
    const bonneInequationData = this.genererInequation1(x0, true)
    const bonneInequation = bonneInequationData.inequation

    // Calculs pour la justification
    const { a, b, c, d } = bonneInequationData
    const membreGauche = a * x0 + b
    const membreDroit = c * x0 + d

    this.enonce = `Le nombre $${x0}$ est solution de l'inéquation :`

    this.correction = `On teste le nombre $${x0}$ dans chacune des inéquations proposées.<br>
     Dans l'inéquation $${bonneInequation}$, on a :<br>
Dans le membre de gauche, on obtient : $${a} \\times (${x0}) + ${b} = ${texNombre(membreGauche)}$<br>
Dans le membre de droite, on obtient : $${c} \\times (${x0}) + ${d} = ${texNombre(membreDroit)}$<br>
On a bien : $${texNombre(membreGauche)} < ${texNombre(membreDroit)}$<br>
Ainsi, l'inéquation dont $${x0}$ est solution est $${miseEnEvidence(`${bonneInequation}`)}$.`

    this.reponses = [
      `$${bonneInequation}$`,
      `$${this.genererInequation1(x0, false).inequation}$`,
      `$${this.genererInequation2(x0, false).inequation}$`,
      `$${this.genererInequation2(x0, false).inequation}$`,
    ]
  }

  private cas2(x0: number): void {
    const bonneInequationData = this.genererInequation2(x0, true)
    const bonneInequation = bonneInequationData.inequation

    // Calculs pour la justification
    const { a, b } = bonneInequationData
    const membreGauche = x0 * x0
    const membreDroit = a * x0 + b

    this.enonce = `Le nombre $${x0}$ est solution de l'inéquation :`

    this.correction = `On teste le nombre $${x0}$ dans chacune des inéquations proposées.<br>
     Dans l'inéquation $${bonneInequation}$, on a :<br>
Dans le membre de gauche, on obtient : $(${x0})^2 = ${texNombre(membreGauche)}$<br>
Dans le membre de droite, on obtient : $${a} \\times (${x0}) + ${b} = ${texNombre(membreDroit)}$<br>
On a bien : $${texNombre(membreGauche)} < ${texNombre(membreDroit)}$<br>
Ainsi, l'inéquation dont $${x0}$ est solution est $${miseEnEvidence(`${bonneInequation}`)}$.`

    this.reponses = [
      `$${bonneInequation}$`,
      `$${this.genererInequation1(x0, false).inequation}$`,
      `$${this.genererInequation1(x0, false).inequation}$`,
      `$${this.genererInequation2(x0, false).inequation}$`,
    ]
  }

  versionOriginale: () => void = () => {
    this.cas1(-1)
  }

  versionAleatoire: () => void = () => {
    let compteur = 0
    do {
      const x0 = choice([-1, -2, -3])
      const typeCas = randint(1, 2)

      if (typeCas === 1) {
        this.cas1(x0)
      } else {
        this.cas2(x0)
      }
      compteur++
    } while (
      compteur < 100 &&
      !aLeBonNombreDePropsDifferentes(this, 4, true, { texteSansCasse: true })
    )
  }

  constructor() {
    super()
    this.optionsDeComparaison = { texteSansCasse: true } // pour le test qcm_exercice
    this.versionAleatoire()
    this.spacing = 1.5
  }
}
