import { fixeBordures } from '../../../lib/2d/fixeBordures'
import { pave } from '../../../lib/2d/projections3d'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Volume de pavé droit'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '04/07/2022'

/**
 * @author Jean-claude Lhote
 *

 */
export const uuid = 'f8019'

export const refs = {
  'fr-fr': ['can6M10'],
  'fr-ch': [],
}
export default class VolumePaveSimple extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.optionsChampTexte = {
      texteAvant: '$V= $',
      texteApres: '$\\text{ cm}^3$',
    }
    this.sup = 1
  }

  nouvelleVersion() {
    const l = randint(2, 3)
    const L = randint(3, 5)
    const h = randint(2, 7, [l, L])
    const pav = pave(L, l, h)
    this.question = `Quel est le volume du pavé droit ci-dessous ?<br>
  ${mathalea2d(Object.assign({ scale: 0.8 }, fixeBordures([pav])), pav)}`
    this.reponse = L * l * h
    this.correction = `Le volume de ce pavé droit est : $${L}$ $\\text{cm}\\times ${l}$ $\\text{cm}\\times ${h}$ $\\text{cm}=${miseEnEvidence(this.reponse)}$ $\\text{cm}^3$.`

    this.canReponseACompleter = '$\\dots\\text{ cm}^3$'
  }
}
