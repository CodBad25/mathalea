import { texteParPosition } from '../../../lib/2d/textes'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import Pyramide from '../../../modules/pyramide'
import ExerciceSimple from '../../ExerciceSimple'

import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { mathalea2d } from '../../../modules/mathalea2d'
export const titre = 'Calculer dans une pyramide multiplicative'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '09/05/2022'
/**
 * @author  Jean-Claude Lhote
 */
export const uuid = 'a905f'

export const refs = {
  'fr-fr': ['can6C33'],
  'fr-ch': [],
}
export default class PyramideMul3Etages extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierNumbers
    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const pyr = new Pyramide({
      operation: '*',
      nombreEtages: 3,
      rangeData: [2, 5],
      exclusions: [0],
      fractionOn: false,
    })
    pyr.isVisible = [[false], [false, false], [true, true, true]]
    this.question = `Chaque case contient le produit des deux cases sur lesquelles elle repose. Quel est le nombre qui correspond à * ?<br>
    ${mathalea2d({ xmin: 0, ymin: 0, xmax: 12, ymax: 3.5, scale: 0.6 }, pyr.representeMoi(0, 0), texteParPosition('*', 6, 2.5))}`
    this.reponse = pyr.valeurs[0][0]
    pyr.isVisible = [[true], [true, true], [true, true, true]]
    this.correction = `Le nombre qui se trouve au sommet de la pyramide est : $${miseEnEvidence(this.reponse)}$.<br>
    ${mathalea2d({ xmin: 0, ymin: 0, xmax: 12, ymax: 3.5, scale: 0.6 }, pyr.representeMoi(0, 0))}`
  }
}
