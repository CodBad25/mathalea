import EqCartDroite from '../1e/1G21-1'
export const titre =
  "Déterminer une équation cartésienne à partir d'un point et de la pente"

export const dateDeModifImportante = '03/03/2025'
export const interactifReady = true
export const interactifType = 'mathLive'
/**
 *
 * @author Stéphane Guyon  + Jean-claude Lhote (interactif) + Gilles Mora
 * Passage en multiMathfield par Éric Elter le 13/05/2026
 */
export const uuid = 'd1dae'

export const refs = {
  'fr-fr': ['2G32-3'],
  'fr-ch': ['11FA1B-19', '1mF2-5'],
}
class EqCart1pointVectDir extends EqCartDroite {
  constructor() {
    super()
    this.nbQuestions = 1
    this.sup = '4'
    this.besoinFormulaireTexte = false
    this.version = 2
  }
}
export default EqCart1pointVectDir
