import ExerciceConversions from '../6e/_Exercice_conversions'
export const titre =
  'Utiliser les préfixes multiplicateurs et diviseurs (milli à kilo)'
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCNum'

/**
 * @author Rémi Angot

 * Relecture : Novembre 2021 par EE
 */
export const uuid = 'ae35d'

export const refs = {
  'fr-fr': ['5G2D-3'],
  'fr-2016': ['6N24', '5N15-1'],
  'fr-ch': ['10GM3-8'],
}
export default class Exercice6N24 extends ExerciceConversions {
  constructor() {
    super()
    this.sup = 3
    this.correction_avec_des_fractions = true
    this.spacingCorr = 2
  }
}
