import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'
export const dateDePublication = '07/09/2025'
export const uuid = '96187'

export const refs = {
  'fr-fr': ['1A-C10-9'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre =
  'Résoudre une équation du type $\\dfrac{a}{x}=b$ ou $\\dfrac{x}{a}=b$'
/**
 * @author Gilles Mora
 */
export default class Auto1AC11a extends ExerciceQcmA {
  versionOriginale: () => void = () => {
    this.enonce = "La solution de l'équation  $\\dfrac{144}{x}=9$ est : "
    this.correction = ` L'équation  $\\dfrac{144}{x}=9$ est équivalente à $9\\times x=144$, soit $x=\\dfrac{144}{9}$.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence('\\dfrac{144}{9}')}$.`

    this.reponses = [
      '$\\vphantom{\\dfrac{1}{3}}x=\\dfrac{144}{9}$',
      '$x=\\dfrac{9}{144}$',
      '$\\vphantom{\\dfrac{1}{3}}x=144\\times 9$',
      '$x=-16$',
    ]
  }

  versionAleatoire = () => {
    let compteur = 0
    do {
      switch (randint(1, 3)) {
        case 1:
          {
            const a = randint(6, 9)
            const b = a * randint(13, 19)
            this.enonce = `La solution de l'équation  $\\dfrac{${b}}{x}=${a}$ est : `
            this.correction = ` L'équation   $\\dfrac{${b}}{x}=${a}$ est équivalente à $${a}\\times x=${b}$, soit $x=\\dfrac{${b}}{${a}}$.<br>
        Ainsi, la solution de l'équation est $${miseEnEvidence(`\\dfrac{${b}}{${a}}`)}$.`

            this.reponses = [
              `$x=\\dfrac{${b}}{${a}}$`,
              `$\\vphantom{\\dfrac{1}{3}}x=\\dfrac{${a}}{${b}}$`,
              `$\\vphantom{\\dfrac{1}{3}}x=${b}\\times ${a}$`,
              `$\\vphantom{\\dfrac{1}{3}}x=-${texNombre(b / a, 0)}$`,
            ]
          }
          break
        case 2:
          {
            const a = randint(6, 9)
            const b = a * randint(13, 19)
            this.enonce = `La solution de l'équation $\\dfrac{x}{${a}}=${b}$ est : `
            this.correction = `L'équation $\\dfrac{x}{${a}}=${b}$ est équivalente à $x=${a}\\times ${b}$.<br>
    Ainsi, la solution de l'équation est $${miseEnEvidence(`${a}\\times ${b}`)}$.`

            this.reponses = [
              `$\\vphantom{\\dfrac{1}{3}}x=${a} \\times ${b}$`,
              `$x=\\dfrac{${b}}{${a}}$`,
              `$x=\\dfrac{${a}}{${b}}$`,
              `$\\vphantom{\\dfrac{1}{3}}x=-${texNombre(a * b)}$`,
            ]
          }
          break

        // Cas 3: Solution sous forme d'entier avec fraction comme distracteur
        case 3:
          {
            const a = randint(6, 9)
            const b = a * randint(13, 19)
            const solution = b / a // Cette fois c'est un entier
            this.enonce = `La solution de l'équation $\\dfrac{${b}}{x}=${a}$ est : `
            this.correction = `L'équation $\\dfrac{${b}}{x}=${a}$ est équivalente à $${a}\\times x=${b}$, soit $x=\\dfrac{${b}}{${a}}=${texNombre(b / a, 0)}$.<br>
    Ainsi, la solution de l'équation est $${miseEnEvidence(`${texNombre(b / a, 0)}`)}$.`

            this.reponses = [
              `$\\vphantom{\\dfrac{1}{3}}x=${solution}$`,
              `$x=-\\dfrac{${b}}{${a}}$`,
              `$\\vphantom{\\dfrac{1}{3}}x=\\dfrac{${a}}{${b}}$`,
              `$\\vphantom{\\dfrac{1}{3}}x=-${solution}$`,
            ]
          }
          break
      }
      compteur++
    } while (
      compteur < 100 &&
      !aLeBonNombreDePropsDifferentes(this, 4, true, {
        egaliteExpression: true,
      })
    ) // On s'assure d'avoir 4 réponses différentes, sinon on régénère
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
