import ExerciceConversions from '../6e/_Exercice_conversions'

export const titre =
  'Convertir des longueurs, masses, capacités, prix ou unités informatiques'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Rémi Angot

 * Relecture : Novembre 2021 par EE
 */
export const uuid = '3eae0'

export const refs = {
  'fr-fr': ['5N15-2', 'BP2AutoQ2', '3AutoG06-1'],
  'fr-2016': ['6N13', 'BP2AutoQ2'],
  'fr-ch': ['10GM3-7'],
}
export default class Exercice5N152 extends ExerciceConversions {
  constructor() {
    super()
    this.sup = 1
    this.nbQuestions = 5
  }
}
