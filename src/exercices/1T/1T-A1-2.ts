import AppliquerPourcentage from '../6e/6N3Q'
export const titre = 'Appliquer un pourcentage'
export const dateDePublication = '19/06/2022'
export const amcReady = true
export const amcType = 'AMCNum'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de 6N33-1 pour les 1er
 * @author Rémi Angot
 */

export const uuid = 'eb1e8'

export const refs = {
  'fr-fr': ['1T-A1-2', 'BP2SP10'],
  'fr-ch': [],
}
export default class AppliquerPourcentage1 extends AppliquerPourcentage {
  constructor() {
    super()
    this.sup = 1
  }
}
