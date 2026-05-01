import PuissanceDecimaleOuFractionnaire from '../4e/4C35'
export const titre =
  'Transformer une écriture de puissance en écriture décimale'
export const dateDePublication = '01/05/2025'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can4C35 pour la 5e
 * @author Rémi Angot
 */

export const uuid = '76472'

export const refs = {
  'fr-fr': ['5_2026_P1'],
  'fr-ch': [],
}
export default class PuissanceCarreEtCube extends PuissanceDecimaleOuFractionnaire {
  constructor() {
    super()
    this.classe = 5
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire2CaseACocher = false
    this.sup = false
    this.sup2 = true
  }
}
