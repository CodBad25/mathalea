import EqCartDroite from '../1e/1G13'
export const titre =
  "Déterminer une équation cartésienne à partir d'un point et de la pente"

export const dateDeModifImportante = '03/03/2025'
export const interactifReady = true
export const interactifType = 'mathLive'
/**
 *
 * @author Stéphane Guyon  + Jean-claude Lhote (interactif) + Gilles Mora
 */
export const uuid = 'd1da4'

export const refs = {
  'fr-fr': ['2G32-3'],
  'fr-ch': ['11FA9-6', '1mF2-5'],
}
class EqCart1pointVectDir extends EqCartDroite {
  constructor() {
    super()
    this.nbQuestions = 1
    this.spacingCorr = 2
    this.version = 4
    // this.consigne = 'Déterminer une équation cartésienne de la droite $(AB)$.'
  }
}
export default EqCart1pointVectDir
