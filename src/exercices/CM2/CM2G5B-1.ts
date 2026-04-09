import Solide6e from '../6e/_Solide_6e'
export const titre = 'Connaitre les propriétés du cube et du pavé droit'
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMult'

export const dateDeModifImportante = '07/06/2023'

/**
 * @author Jean-claude Lhote
 * vocabulaire arête, face, perpendicularité dans l'espace, parallélisme dans l'espace

 */
export const uuid = 'b36df'

export const refs = {
  'fr-fr': ['CM2G5B-1'],
  'fr-2016': ['6G42'],
  'fr-ch': ['9ES7-4'],
}
export default class UtiliserVocabulairePave extends Solide6e {
  constructor() {
    super()
    this.nbQuestions = 1
  }
}
