import { choice } from '../../../lib/outils/arrayOutils'
import {
  simplificationDeFractionAvecEtapes,
  texFractionReduite,
} from '../../../lib/outils/deprecatedFractions'
import {
  miseEnEvidence,
  texteEnCouleur,
} from '../../../lib/outils/embellissements'
import { arrondi } from '../../../lib/outils/nombres'
import { texNombre } from '../../../lib/outils/texNombre'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Déterminer un pourcentage de proportion'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora
 * reprise de can5P02 qui a été cassé en 2

 * Date de publication
*/
export const dateDeModifImportante = '06/07/2025'
export const uuid = '1a706'

export const refs = {
  'fr-fr': ['can6P07', '6N3P-flash1'],
  'fr-ch': ['9NO14-15'],
}
export default class PoucentageProportion extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.spacing = 1.5
    this.spacingCorr = 1.5
    this.versionQcmDisponible = true
  }

  nouvelleVersion() {
    const listeCarac = [
      ['filles', 'Elles'],
      ['garçons', 'Ils'],
      ['sportifs', 'Ils'],
      ['musiciens', 'Ils'],
    ]
    let a, b, c, n, d, carac, choix
    switch (randint(1, 2)) {
      case 1:
        if (choice([true, false])) {
          a = choice([20, 40])
          b = a === 20 ? choice([4, 8, 16, 5]) : choice([4, 8, 16, 10])
          carac = choice(listeCarac)
          n = carac[0]
          d = carac[1]
          this.question = ` Dans un groupe de $${a}$ enfants, $${b}$  sont des ${n}.<br>`
          this.question +=
            this.versionQcm || this.interactif
              ? `Le pourcentage de ${n} dans ce groupe est : `
              : `${d} représentent ..... $\\%$ du groupe.`

          this.optionsChampTexte = { texteAvant: '<br>', texteApres: '$\\%$' }
          this.correction = `La proportion de ${n} est donnée par $\\dfrac{${b}}{${a}}=${texFractionReduite(b, a)}=${texNombre(b / a)}$, soit $${miseEnEvidence(texNombre((b / a) * 100))}$ $\\%$.`
        } else {
          a = choice([30, 60])
          b = a === 30 ? choice([6, 12, 18, 24]) : choice([6, 12, 15, 18, 24])
          carac = choice(listeCarac)
          n = carac[0]
          d = carac[1]
          this.question = ` Dans un groupe de $${a}$ enfants, $${b}$  sont des ${n}.<br>`
          this.question +=
            this.versionQcm || this.interactif
              ? `Le pourcentage de ${n} dans ce groupe est : `
              : `${d} représentent ..... $\\%$ du groupe.`
          this.optionsChampTexte = { texteAvant: '<br>', texteApres: '$\\%$' }
          this.correction = `La proportion de ${n} est donnée par $\\dfrac{${b}}{${a}}=${texFractionReduite(b, a)}=${texNombre(b / a)}$, soit $${miseEnEvidence(texNombre((b / a) * 100))}$ $\\%$.`
        }
        this.reponse = this.versionQcm
          ? `$${texNombre((b / a) * 100, 2)}\\,\\%$`
          : arrondi((b / a) * 100)
        this.canEnonce = 'Compléter.'
        this.canReponseACompleter = this.question //
        this.distracteurs =
          a === arrondi((b / a) * 100)
            ? [`$${a + b}\\,\\%$`, `$${b}\\,\\%$`, `$${a - b}\\,\\%$`]
            : [`$${a}\\,\\%$`, `$${b}\\,\\%$`, `$${a - b}\\,\\%$`]
        break

      case 2:
        a = arrondi(randint(1, 12, 10) * 10)
        b = arrondi((a * randint(1, 7, 5)) / 10)
        c = (b / a) * 100
        choix = choice([true, false])
        this.question = `Le prix d'un article coûtant $${a}$ euros ${choix ? 'baisse' : 'augmente'} de $${b}$ euros.<br>`
        this.question += this.versionQcm
          ? `Le pourcentage ${choix ? 'de réduction' : 'd’augmentation'} de ce prix est :`
          : ` Quel est le pourcentage ${choix ? 'de réduction' : 'd’augmentation'} de ce prix ?`

        this.optionsChampTexte = { texteAvant: '<br>', texteApres: '$\\%$' }
        this.correction = `${choix ? 'La réduction' : 'L’augmentation'} est de $${b}$ euros sur un total de $${a}$ euros.<br>
          Le pourcentage  ${choix ? 'de baisse' : 'd’augmentation'} est donné par le quotient : $\\dfrac{${b}}{${a}}${simplificationDeFractionAvecEtapes(b, a)}=${texNombre(b / a)}= ${miseEnEvidence(texNombre((b / a) * 100))}\\,\\%$.
          `
        this.correction += texteEnCouleur(`<br> Mentalement : <br>
        Calculez $10\\, \\%$ du prix. <br>${choix ? 'La réduction' : 'L’augmentation'} est un multiple de $10\\, \\%$.
             `)
        this.reponse = this.versionQcm ? `$${texNombre(c, 2)}\\,\\%$` : c

        this.distracteurs =
          b === c
            ? [`$${a + b}\\,\\%$`, `$${a}\\,\\%$`, `$${a - b}\\,\\%$`]
            : [`$${a}\\,\\%$`, `$${b}\\,\\%$`, `$${a - b}\\,\\%$`]

        this.canReponseACompleter = '$\\ldots$ $\\%$'
        break
    }
  }
}
