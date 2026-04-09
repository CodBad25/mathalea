import EqCartDroite from '../1e/1G13'
export const titre =
  'Déterminer une équation cartésienne de droite à partir de deux points'
export const dateDeModifImportante = '03/03/2025'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 *
 * @author Stéphane Guyon  + Jean-claude Lhote (interactif) + Gilles Mora
 */
export const uuid = '1bb30'

export const refs = {
  'fr-fr': ['2G30-3'],
  'fr-ch': ['1mF2-3'],
}
class EqCart2points extends EqCartDroite {
  version: number
  constructor() {
    super()
    this.nbQuestions = 1

    this.version = 2
  }
}
export default EqCart2points
