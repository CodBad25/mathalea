import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { choice } from '../../../lib/outils/arrayOutils'
import { ecritureParentheseSiNegatif } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { context } from '../../../modules/context'
import FractionEtendue from '../../../modules/FractionEtendue'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre =
  'Déterminer un coefficient directeur à partir des coordonnées'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '08/07/2025'
export const uuid = '0ea37'
export const refs = {
  'fr-fr': ['can2G24'],
  'fr-ch': [''],
}
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

*/
export default class TrouverpDroite extends ExerciceSimple {
  constructor() {
    super()
    this.versionQcmDisponible = true
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
    this.spacing = 1.5
  }

  nouvelleVersion() {
    const nomlisteA = ['A', 'B', 'C']
    const nomA = choice(nomlisteA)

    const nomlisteB = ['D', 'E', 'F']
    const nomB = choice(nomlisteB)
    const xA = this.quotaRandint('xA', -10, 10, [0])
    const yA = this.quotaRandint('yA', -10, 10, [0])
    const xB = randint(-10, 10, [0, xA])
    const yB = this.quotaRandint('yB', -10, 10, [0])
    const m = new FractionEtendue(yB - yA, xB - xA)
    if (context.isAmc) this.versionQcm = false
    this.reponse = this.versionQcm
      ? `$${m.texFractionSimplifiee}$`
      : m.texFractionSimplifiee
    this.question = `Le plan est muni d’un repère orthogonal. <br>
    On note $d$ la droite passant par les points $${nomA}(${xA}\\,;\\,${yA})$ et $${nomB}(${xB}\\,;\\,${yB})$.<br>
     Le coefficient directeur $m$ de la droite $(${nomA}${nomB})$ est égal à : `

    if (yB === yA) {
      if (this.versionQcm) {
        this.distracteurs = [
          '$1$',
          '$-1$',
          `${xB - xA === 1 || xB - xA === -1 ? `$${yB}$` : `$${xB - xA}$`}`,
        ]
      }
      this.correction = `Comme $y_{${nomA}}=y_{${nomB}}$, la droite $(${nomA}${nomB})$ est horizontale, son coefficient directeur est nul.<br>
    Ainsi, $m=${miseEnEvidence('0')}$`
    } else {
      this.correction = `Le coefficient directeur $m$ de la droite  $(${nomA}${nomB})$ est donnée par la formule : $\\dfrac{y_{${nomB}}-y_{${nomA}}}{x_{${nomB}}-x_{${nomA}}}$.<br>
    $\\begin{aligned}
    m&=\\dfrac{${yB}-${ecritureParentheseSiNegatif(yA)}}{${xB}-${ecritureParentheseSiNegatif(xA)}}\\\\
    &= \\dfrac{${yB - yA}}{${xB - xA}}\\\\
    &=${miseEnEvidence(m.texFractionSimplifiee)}
    \\end{aligned}$`
      if (this.versionQcm) {
        if (yB - yA === xB - xA || yB - yA === -xB + xA) {
          this.distracteurs = [
            `$${new FractionEtendue(xA - xB, yB - yA).texFractionSimplifiee}$`,
            '$0$',
            `$${yB - yA}$`,
          ]
        } else {
          const denTroisiemeDistracteur = xB + xA === 0 ? xB - xA : xB + xA
          this.distracteurs = [
            `$${new FractionEtendue(xA - xB, yB - yA).texFractionSimplifiee}$`,
            `$${m.inverse().texFractionSimplifiee}$`,
            `$${new FractionEtendue(yB + yA, denTroisiemeDistracteur).texFractionSimplifiee}$`,
          ]
        }
      }
    }

    this.canReponseACompleter = '$m=\\ldots$'
    if (!this.interactif && !this.versionQcm) {
      this.question += ' $\\ldots$'
    }
  }
}
