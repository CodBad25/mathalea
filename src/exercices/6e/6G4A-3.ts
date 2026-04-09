import VocabulaireAngles from '../5e/5G30-3'
export const interactifReady = true
export const interactifType = 'listeDeroulante'
export const titre = 'Connaître le vocabulaire sur les angles'
export const dateDePublication = '05/08/2025'

/**
 * @author Éric Elter
 */

export const uuid = '04ea4'

export const refs = {
  'fr-fr': ['6G4A-3'],
  'fr-2016': ['6G22-3'],
  'fr-ch': [''],
}
export default class VocabulaireAngles6e extends VocabulaireAngles {
  constructor() {
    super()
    this.sup = '3-4-6-7-8'
  }
}
