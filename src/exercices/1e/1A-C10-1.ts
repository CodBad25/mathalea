import { KeyboardType } from '../../lib/interactif/claviers/keyboard'
import { ecritureAlgebrique } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { abs } from '../../lib/outils/nombres'
import { texNombre } from '../../lib/outils/texNombre'
import { context } from '../../modules/context'
import ExerciceSimple from '../ExerciceSimple'
export const dateDePublication = '23/07/2025'
export const dateDeModifImportante = '30/09/2026'

export const uuid = 'c9889'

export const refs = {
  'fr-fr': ['1A-C10-1', '2A-C3-1'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = true
export const amcType = 'qcmMono'
export const titre = 'Résoudre une équation du type $x^2=a$'
/**
 * @author Gilles Mora
 */
export default class Puissances extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.formatChampTexte = KeyboardType.clavierEnsemble
    this.optionsDeComparaison = { ensembleDeNombres: true }
    this.versionQcmDisponible = true
    this.versionQcm = false
  }

  nouvelleVersion() {
    if (context.isAmc) this.versionQcm = true

    const corrCarre = `On isole le carré pour se ramener à une équation du type $x^2=k$.<br>
        Résoudre l'équation revient à résoudre `
    const corrNegatif = ` est strictement négatif, l'équation n'a pas de solution sur $\\mathbb{R}$.<br>
          Ainsi, $S=${miseEnEvidence('\\emptyset')}$.`
    const corrPositif =
      " est strictement positif, l'équation a deux solutions : "
    const ensemble = (a: string) => `\\{-${a};${a}\\}`

    const choix = this.quotaChoice('ecriture', [true, false])
    // Solution (sans le « S= ») et distracteurs pour la version QCM
    let solution: string
    let distracteurs: string[]

    switch (this.quotaChoice('cas', [1, 1, 2, 3, 3, 4, 4])) {
      case 1: {
        const a = this.quotaRandint('a1', 1, 9)
        this.question = `Résoudre dans $\\mathbb{R}$ l'équation ${choix ? `$x^{2}-${a * a}=0$` : `$${a * a}-x^2=0$`}.`
        this.correction =
          corrCarre +
          ` $x^2=${a * a}$.<br>
        Puisque $${a * a}$` +
          corrPositif +
          `$-\\sqrt{${a * a}}=-${a}$ et $\\sqrt{${a * a}}=${a}$.<br>
        Ainsi, $S=${miseEnEvidence(ensemble(String(a)))}$.`
        solution = ensemble(String(a))
        distracteurs = [
          ensemble(`\\sqrt{${a}}`),
          '\\emptyset',
          `\\{${a}\\}`,
          `\\{${a * a}\\}`,
        ]
        break
      }
      case 2: {
        const a = this.quotaRandint('a2', 1, 9)
        this.question = `Résoudre dans $\\mathbb{R}$ l'équation $x^{2}+${a * a}=0$.`
        this.correction = `On isole le carré. L'équation s'écrit $x^{2}=-${a * a}$.<br>
          Comme  $-${a * a}$${corrNegatif}`
        solution = '\\emptyset'
        distracteurs = [
          ensemble(String(a)),
          ensemble(`\\sqrt{${a}}`),
          `\\{${-a}\\}`,
        ]
        break
      }
      case 3: {
        const b = this.quotaRandint('b3', 1, 12)
        const a = b ** 2 * this.quotaChoice('signe3', [-1, 1])
        this.question = `Résoudre dans $\\mathbb{R}$ l'équation $x^{2}=${a}$.`
        this.correction = ` On reconnaît une équation du type $x^2=k$ avec $k=${a}$.<br>`
        if (a > 0) {
          this.correction += `Puisque $${a}$ ${corrPositif} $-\\sqrt{${a}}=-${b}$ et $\\sqrt{${a}}=${b}$.<br>
          Ainsi, $S=${miseEnEvidence(ensemble(String(b)))}$.`
          solution = ensemble(String(b))
          distracteurs = [
            '\\emptyset',
            `\\{${texNombre(-a / 2, 2)};${texNombre(a / 2, 2)}\\}`,
            `\\{${b}\\}`,
          ]
        } else {
          this.correction += `Puisque $${a}$ ${corrNegatif}`
          solution = '\\emptyset'
          distracteurs = [
            ensemble(String(b)),
            `\\{\\sqrt{${-a}}\\}`,
            `\\{-${b}\\}`,
          ]
        }
        break
      }
      case 4:
      default: {
        const a = this.quotaRandint('a4', 2, 9)
        const k = this.quotaRandint('k4', -7, 13, [0, 1, 4, 9])
        const b = a * k
        this.question = `Résoudre dans $\\mathbb{R}$ l'équation ${choix ? `$${a}x^{2}${ecritureAlgebrique(-b)}=0$` : `$${-b}${ecritureAlgebrique(a)}x^{2}=0$`}.`
        this.correction = `${corrCarre} $x^2=${k}$.<br>  `
        if (k < 0) {
          this.correction += `Puisque $${k}$ ${corrNegatif}`
          solution = '\\emptyset'
          distracteurs = [
            ensemble(`\\sqrt{${abs(b)}}`),
            ensemble(`\\sqrt{${abs(k)}}`),
            `\\{\\sqrt{${abs(k)}}\\}`,
          ]
        } else {
          this.correction += `Puisque $${k}$ ${corrPositif} $-\\sqrt{${k}}$ et $\\sqrt{${k}}$.<br>
          Ainsi, $S=${miseEnEvidence(ensemble(`\\sqrt{${k}}`))}$.`
          solution = ensemble(`\\sqrt{${k}}`)
          distracteurs = [
            `\\{\\sqrt{${k}}\\}`,
            ensemble(texNombre(k / 2, 2)),
            '\\emptyset',
          ]
        }
        break
      }
    }

    if (this.versionQcm) {
      this.reponse = `$S=${solution}$`
      this.distracteurs = distracteurs.map((d) => `$S=${d}$`)
    } else {
      this.reponse = solution
      if (this.interactif) this.question += '<br>$S=$'
    }
  }
}
