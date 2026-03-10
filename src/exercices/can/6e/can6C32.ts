import { texteParPosition } from '../../../lib/2d/textes'
import Pyramide from '../../../modules/pyramide'

import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'

import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { mathalea2d } from '../../../modules/mathalea2d'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Calculer dans une pyramide additive'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'
export const dateDePublication = '09/05/2022'
/**
 * @author  Jean-Claude Lhote
 */
export const uuid = '109ae'

export const refs = {
  'fr-fr': ['can6C32'],
  'fr-ch': ['PR-14'],
}
export default class Pyramide3Etages extends ExerciceSimple {
  constructor() {
    super()
    this.nbQuestions = 1
    this.formatChampTexte = KeyboardType.clavierNumbers
    this.typeExercice = 'simple'
  }

  nouvelleVersion() {
    const pyr = new Pyramide({
      operation: '+',
      nombreEtages: 3,
      rangeData: [3, 10],
      exclusions: [0],
      fractionOn: false,
    })
    pyr.isVisible = [[false], [false, false], [true, true, true]]
    this.question = `Chaque case contient la somme des deux cases sur lesquelles elle repose. Quel est le nombre qui correspond à * ?<br>
    ${mathalea2d({ xmin: 0, ymin: 0, xmax: 12, ymax: 3.5, scale: 0.6 }, pyr.representeMoi(0, 0), texteParPosition('*', 6, 2.5))}`
    this.reponse = pyr.valeurs[0][0]
    pyr.isVisible = [[true], [true, true], [true, true, true]]
    this.correction = `Le nombre qui se trouve au sommet de la pyramide est : $${miseEnEvidence(this.reponse)}$.<br>
    ${mathalea2d({ xmin: 0, ymin: 0, xmax: 12, ymax: 3.5, scale: 0.6 }, pyr.representeMoi(0, 0))}`
  }
}
