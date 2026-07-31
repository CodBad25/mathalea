import DecrireAssemblageDeSolides from '../5e/5G2A-1'
export const titre = 'Décrire un assemblage de solides'
export const dateDePublication = '30/07/2026'

/**
 * Clone de 5G2A-1 pour le Bac Pro Première.
 * Les prismes droits (hors cube et pavé droit) ne sont pas au programme : ils sont retirés des assemblages proposés.
 */

export const uuid = 'a8d7e'

export const refs = {
  'fr-fr': ['BP1GEO06'],
  'fr-ch': [],
}
export default class ExerciceBP1GEO06 extends DecrireAssemblageDeSolides {
  constructor() {
    super()
    this.sansPrisme = true
  }
}
