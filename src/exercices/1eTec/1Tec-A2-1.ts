import AssocierCoefficient from '../3e/3P10-1'
export const titre = 'Associer évolution en pourcentage et coefficient'
export const dateDePublication = '19/06/2022'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de 3P10-1 pour les 1er
 * @author Rémi Angot
 */

export const uuid = 'e38d8'

export const refs = {
  'fr-fr': ['1Tec-A2-1'],
  'fr-ch': [],
}
export default class AssocierCoefficient1T extends AssocierCoefficient {
  constructor() {
    super()
    this.sup = 1
  }
}
