import ReperagePointDuPlan from './5G1B-2'
export const titre = "Déterminer les coordonnées (positives) d'un point"
export const interactifReady = true
export const interactifType = 'mathLive'
export const amcReady = true
export const amcType = 'AMCHybride'
export const dateDeModifImportante = '24/11/2024'
export const uuid = 'cf83c'
export const refs = {
  'fr-fr': ['5G1B'],
  'fr-2016': ['5R12'],
  'fr-ch': ['9FA1-5'],
}
export default class ReperagePointDuQuartDePlan extends ReperagePointDuPlan {
  constructor() {
    super()
    this.quartDePlan = true
  }
}
